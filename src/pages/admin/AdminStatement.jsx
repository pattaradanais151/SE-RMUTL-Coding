import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useOutletContext } from 'react-router-dom'; // 🟢
import ExternalLink from '../../components/ExternalLink'; // 🟢 นำเข้า ExternalLink

const AdminStatement = () => {
  const { activeRoom } = useOutletContext(); // 🟢
  const [currentUser, setCurrentUser] = useState(null);
  const [statements, setStatements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterType, setFilterType] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const initialForm = { 
    user_name: '', 
    amount: '', 
    payment_method: 'transfer', 
    payment_type: 'daily', 
    status: 'Standard', 
    slip_url: '' 
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const storedUser = localStorage.getItem('se_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchStatements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('room_id', activeRoom) // 🟢 ดึงข้อมูลแยกห้อง
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStatements(data || []);
    } catch (error) {
      console.error('Error fetching statements:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'super_admin' && activeRoom) { // 🟢 รีโหลดเมื่อเปลี่ยนห้อง
      fetchStatements();
    }
  }, [currentUser, activeRoom]);

  const handleUpdateStatus = async (id, newStatus) => {
    const isConfirm = window.confirm(`คุณแน่ใจหรือไม่ที่จะเปลี่ยนสถานะเป็น ${newStatus.toUpperCase()} ?`);
    if (!isConfirm) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('room_id', activeRoom); // 🟢 ป้องกันข้ามห้อง

      if (error) throw error;
      setStatements(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (error) {
      console.error('Error updating status:', error.message);
      alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    const isConfirm = window.confirm('⚠️ คุณต้องการลบข้อมูลนี้ออกจากระบบอย่างถาวรใช่หรือไม่?\n(การลบจะตัดข้อมูลออกจาก Database ทันทีเพื่อคืนพื้นที่)');
    if (!isConfirm) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('room_id', activeRoom); // 🟢

      if (error) throw error;
      setStatements(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting statement:', error.message);
      alert('ลบข้อมูลไม่สำเร็จ: ' + error.message);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormData({
      user_name: item.user_name || '',
      amount: item.amount || '',
      payment_method: item.payment_method || 'transfer',
      payment_type: item.payment_type || 'daily',
      status: item.status || 'Standard',
      slip_url: item.slip_url || ''
    });
    setIsModalOpen(true);
  };

  const handlePaymentMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      payment_method: method,
      status: method === 'cash' ? 'approved' : 'Standard',
      slip_url: method === 'cash' ? '' : prev.slip_url
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('slips')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, slip_url: data.publicUrl }));
    } catch (error) {
      console.error('Upload error:', error.message);
      alert('อัปโหลดรูปภาพล้มเหลว กรุณาตรวจสอบสิทธิ์ของ Bucket "slips"');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const insertData = { ...formData, room_id: activeRoom }; // 🟢 ฝัง room_id อัตโนมัติ
        const { data, error } = await supabase
          .from('transactions')
          .insert([insertData])
          .select();
        
        if (error) throw error;
        setStatements(prev => [data[0], ...prev]);
      } else {
        const { data, error } = await supabase
          .from('transactions')
          .update(formData)
          .eq('id', editingId)
          .eq('room_id', activeRoom) // 🟢
          .select();
          
        if (error) throw error;
        setStatements(prev => prev.map(item => item.id === editingId ? data[0] : item));
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving data:', error.message);
      alert('บันทึกข้อมูลไม่สำเร็จ: ' + error.message);
    }
  };

  const filteredStatements = statements.filter(item => {
    const matchesSearch = (item.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (item.id?.toString() || '').includes(searchTerm);
    const matchesType = filterType === 'all' || item.payment_type === filterType;
    return matchesSearch && matchesType;
  });

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm border border-red-100 dark:border-red-800 backdrop-blur-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Access Denied</h2>
          <p className="text-red-600 dark:text-red-300">ขออภัย หน้าจอนี้สงวนสิทธิ์ไว้สำหรับ <b>Super Admin</b> เท่านั้น</p>
        </div>
      </div>
    );
  }

  const getPaymentTypeBadge = (type) => {
    switch (type) {
      case 'daily':
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-sky-100/80 text-sky-700 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 rounded-lg">รายวัน</span>;
      case 'weekly':
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-fuchsia-100/80 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 rounded-lg">รายสัปดาห์</span>;
      case 'monthly':
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-orange-100/80 text-orange-700 border border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 rounded-lg">รายเดือน</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100/80 text-slate-700 border border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 rounded-lg">ทั่วไป</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">ตรวจสอบการโอนเงิน (Statement)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ประวัติและการอนุมัติการเก็บเงินภายในห้องเรียน</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ รหัสอ้างอิง..."
              className="w-full pl-11 pr-4 py-2.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-white/40 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600/90 hover:bg-indigo-700 backdrop-blur-md text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all font-medium border border-indigo-400/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            เพิ่มข้อมูล
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">รอตรวจสอบ (Pending)</p>
            <p className="text-3xl font-bold text-amber-500">
              {statements.filter(s => (filterType === 'all' || s.payment_type === filterType) && (s.status === 'Standard' || s.status === 'pending')).length}
            </p>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">อนุมัติแล้ว (Approved)</p>
            <p className="text-3xl font-bold text-emerald-500">
              {statements.filter(s => (filterType === 'all' || s.payment_type === filterType) && s.status === 'approved').length}
            </p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
        </div>
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">ยอดเงินรวมที่รับแล้ว</p>
            <p className="text-3xl font-bold text-indigo-500">
              ฿{statements.filter(s => (filterType === 'all' || s.payment_type === filterType) && s.status === 'approved').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {['all', 'daily', 'weekly', 'monthly'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
              filterType === type 
                ? 'bg-indigo-600/90 text-white border-indigo-500/50 shadow-md shadow-indigo-500/20 backdrop-blur-md' 
                : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-white/40 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80 backdrop-blur-sm'
            }`}
          >
            {type === 'all' && 'ทั้งหมด'}
            {type === 'daily' && 'รายวัน'}
            {type === 'weekly' && 'รายสัปดาห์'}
            {type === 'monthly' && 'รายเดือน'}
          </button>
        ))}
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 text-sm border-b border-white/20 dark:border-slate-700">
                  <th className="px-6 py-4 font-semibold">ชื่อผู้โอน</th>
                  <th className="px-6 py-4 font-semibold">ประเภท</th>
                  <th className="px-6 py-4 font-semibold">วิธีชำระ</th>
                  <th className="px-6 py-4 font-semibold text-right">จำนวนเงิน</th>
                  <th className="px-6 py-4 font-semibold text-center">สลิป</th>
                  <th className="px-6 py-4 font-semibold text-center">สถานะ</th>
                  <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredStatements.length > 0 ? (
                  filteredStatements.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white font-medium">{item.user_name || '-'}</div>
                        <div className="text-xs text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentTypeBadge(item.payment_type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {item.payment_method === 'cash' ? (
                          <span className="flex items-center gap-1"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> เงินสด</span>
                        ) : (
                          <span className="flex items-center gap-1"><svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> โอนเงิน</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold text-right">
                        ฿{(item.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.slip_url ? (
                          /* 🟢 เปลี่ยนแท็ก a เป็น ExternalLink 🟢 */
                          <ExternalLink href={item.slip_url} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 text-sm font-medium bg-indigo-50/80 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-100 dark:border-indigo-500/20">
                            ดูสลิป
                          </ExternalLink>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                          item.status === 'approved' ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' :
                          item.status === 'rejected' ? 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' :
                          'bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                        }`}>
                          {item.status ? item.status.toUpperCase() : 'STANDARD'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(item.id, 'approved')}
                            disabled={item.status === 'approved'}
                            className="p-2 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg disabled:opacity-30 disabled:hover:bg-emerald-50 disabled:hover:text-emerald-600 transition-all border border-emerald-100 dark:border-emerald-500/20"
                            title="อนุมัติ"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          
                          <button 
                            onClick={() => openEditModal(item)}
                            className="p-2 bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all border border-blue-100 dark:border-blue-500/20"
                            title="แก้ไข"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all border border-red-100 dark:border-red-500/20"
                            title="ลบถาวร"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      ไม่พบข้อมูลที่ตรงกับการค้นหา หรือในหมวดหมู่นี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/50 dark:border-slate-600/50 overflow-hidden transform transition-all">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
                {modalMode === 'add' ? 'เพิ่มข้อมูลการรับเงิน' : 'แก้ไขข้อมูล'}
              </h3>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('transfer')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.payment_method === 'transfer' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    โอนเงิน (Transfer)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('cash')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.payment_method === 'cash' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    เงินสด (Cash)
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ประเภทการเก็บเงิน</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['daily', 'weekly', 'monthly'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, payment_type: type})}
                        className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                          formData.payment_type === type 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        {type === 'daily' && 'รายวัน'}
                        {type === 'weekly' && 'รายสัปดาห์'}
                        {type === 'monthly' && 'รายเดือน'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ชื่อผู้จ่าย/ผู้โอน</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all"
                    value={formData.user_name}
                    onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>

                {formData.payment_method === 'transfer' && (
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">แนบหลักฐานการโอน (สลิป)</label>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-500/20 dark:file:text-indigo-400 transition-all cursor-pointer"
                      />
                      {isUploading && <p className="text-xs text-indigo-500 animate-pulse">กำลังอัปโหลดไฟล์...</p>}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                        <div className="relative flex justify-center"><span className="px-2 bg-white dark:bg-slate-800 text-xs text-slate-500">หรือระบุ URL เอง</span></div>
                      </div>
                      <input
                        type="url"
                        placeholder="https://..."
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all text-sm"
                        value={formData.slip_url}
                        onChange={(e) => setFormData({...formData, slip_url: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">สถานะ</label>
                  <select
                    className="w-full px-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Standard">Standard (รอตรวจสอบ)</option>
                    <option value="approved">Approved (อนุมัติแล้ว)</option>
                    <option value="rejected">Rejected (ปฏิเสธ)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                  >
                    {isUploading ? 'กำลังอัปโหลด...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatement;