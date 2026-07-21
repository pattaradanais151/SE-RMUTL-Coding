import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useOutletContext } from 'react-router-dom';
import { FaBullhorn, FaPlus, FaTrash, FaPen, FaSave, FaCheckCircle, FaTimesCircle, FaGlobe, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { sendDiscordNotify } from '../../utils/discord';

const AdminAnnouncements = () => {
  const { activeRoom } = useOutletContext();
  const [currentUser, setCurrentUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = { 
    title: '', 
    content: '', 
    is_active: true, 
    room_id: 'all' 
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const storedUser = localStorage.getItem('se_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      fetchAnnouncements();
    }
  }, [currentUser]);

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setAnnouncements(prev => prev.map(item => item.id === id ? { ...item, is_active: !currentStatus } : item));
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ: ' + error.message);
    }
  };

  const handleDelete = async (id, title) => {
    const isConfirm = window.confirm(`คุณต้องการลบประกาศ "${title}" ออกจากระบบใช่หรือไม่?`);
    if (!isConfirm) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      
      setAnnouncements(prev => prev.filter(item => item.id !== id));
      sendDiscordNotify('ประกาศข่าวสาร', 'DELETE', `ลบประกาศ: ${title}`, currentUser.username);
    } catch (error) {
      alert('ลบข้อมูลไม่สำเร็จ: ' + error.message);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ ...initialForm, room_id: activeRoom || 'all' });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content || '',
      is_active: item.is_active,
      room_id: item.room_id || 'all'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const { data, error } = await supabase.from('announcements').insert([formData]).select();
        if (error) throw error;
        setAnnouncements(prev => [data[0], ...prev]);
        sendDiscordNotify('ประกาศข่าวสาร', 'CREATE', `เพิ่มประกาศใหม่: ${formData.title}`, currentUser.username);
      } else {
        const { data, error } = await supabase.from('announcements').update(formData).eq('id', editingId).select();
        if (error) throw error;
        setAnnouncements(prev => prev.map(item => item.id === editingId ? data[0] : item));
        sendDiscordNotify('ประกาศข่าวสาร', 'UPDATE', `แก้ไขประกาศ: ${formData.title}`, currentUser.username);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert('บันทึกข้อมูลไม่สำเร็จ: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ตรวจสอบสิทธิ์
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg border border-red-100 dark:border-red-800 backdrop-blur-md">
          <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Access Denied</h2>
          <p className="text-red-600 dark:text-red-300">ขออภัย หน้าจอนี้สงวนสิทธิ์ไว้สำหรับ <b>Super Admin</b> เท่านั้น</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative animate-fade-in">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-sky-500/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/50 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-sky-400 to-indigo-500 text-white rounded-2xl shadow-lg shadow-sky-500/30">
              <FaBullhorn size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">จัดการประกาศข่าวสาร (Announcements)</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ข้อความประกาศเหล่านี้จะไปแสดงผลที่หน้าแรกของ Guest</p>
            </div>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 font-bold"
          >
            <FaPlus /> เพิ่มประกาศใหม่
          </button>
        </div>

        {/* List of Announcements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center text-slate-500">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              กำลังโหลดข้อมูลประกาศ...
            </div>
          ) : announcements.length === 0 ? (
            <div className="col-span-full py-20 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
              <FaBullhorn className="text-5xl mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">ยังไม่มีประกาศข่าวสารในระบบ</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div key={item.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/50 dark:border-slate-700/50 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${item.is_active ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100/80 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {item.is_active ? <><FaCheckCircle /> กำลังแสดงผล</> : <><FaTimesCircle /> ซ่อนอยู่</>}
                  </div>
                  <div className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <FaGlobe /> {item.room_id === 'all' ? 'แสดงทุกห้อง' : (item.room_id === 'room1' ? 'เฉพาะเทียบโอน' : 'เฉพาะ 4 ปี')}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 flex-1 line-clamp-4 whitespace-pre-wrap">{item.content}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-auto">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(item.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleActive(item.id, item.is_active)} className={`p-2 rounded-lg transition-colors ${item.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`} title={item.is_active ? "ปิดการแสดงผล" : "เปิดการแสดงผล"}>
                      {item.is_active ? <FaToggleOn size={20}/> : <FaToggleOff size={20}/>}
                    </button>
                    <button onClick={() => openEditModal(item)} className="p-2 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors">
                      <FaPen size={16}/>
                    </button>
                    <button onClick={() => handleDelete(item.id, item.title)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                      <FaTrash size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-600/50 p-8 transform transition-all">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              {modalMode === 'add' ? <><FaPlus className="text-sky-500"/> สร้างประกาศใหม่</> : <><FaPen className="text-amber-500"/> แก้ไขประกาศ</>}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">หัวข้อประกาศ (Title)</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none dark:text-white transition-all font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="เช่น แจ้งงดคลาสเรียนสัปดาห์นี้..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">เนื้อหา (Content)</label>
                <textarea
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none dark:text-white transition-all resize-none"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="รายละเอียดเพิ่มเติมของประกาศ..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">แสดงในพื้นที่ (Room)</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none dark:text-white cursor-pointer"
                    value={formData.room_id}
                    onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                  >
                    <option value="all">ทุกพื้นที่ (All)</option>
                    <option value="room1">เฉพาะ ห้องเทียบโอน</option>
                    <option value="room2">เฉพาะ ห้องปกติ 4 ปี</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">สถานะ</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none dark:text-white cursor-pointer"
                    value={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                  >
                    <option value="true">เปิดแสดงผล</option>
                    <option value="false">ซ่อนไว้ก่อน</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : <><FaSave /> บันทึกประกาศ</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;