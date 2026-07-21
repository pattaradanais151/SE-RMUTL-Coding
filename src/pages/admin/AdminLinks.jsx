import { useState, useEffect } from 'react'
import { FaLink, FaPlus, FaTrash, FaPen, FaSave, FaExternalLinkAlt } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import { useOutletContext } from 'react-router-dom' // 🟢

const AdminLinks = () => {
  const { activeRoom } = useOutletContext(); // 🟢 รับค่าห้อง

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const userStr = localStorage.getItem('se_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [formData, setFormData] = useState({ title: '', url: '' });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (activeRoom) {
      fetchLinks();
    }
  }, [activeRoom]); // 🟢 ดึงข้อมูลใหม่เมื่อสลับห้อง

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submission_links')
      .select('*')
      .eq('room_id', activeRoom) // 🟢 กรองตามห้อง
      .order('created_at', { ascending: false });
    if (!error && data) setLinks(data);
    setLoading(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    let validUrl = formData.url;
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    // 🟢 ฝัง room_id อัตโนมัติ
    const { error } = await supabase.from('submission_links').insert([{ 
      title: formData.title, 
      url: validUrl,
      room_id: activeRoom
    }]);
    
    if (!error) {
      sendDiscordNotify('ลิ้งก์ส่งงาน (Submission Links)', 'CREATE', `เพิ่มลิ้งก์: ${formData.title} (${activeRoom})`, currentUser.username);
      setFormData({ title: '', url: '' });
      fetchLinks();
      alert('เพิ่มลิ้งก์ส่งงานเรียบร้อยแล้ว');
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleSaveEdit = async () => {
    let validUrl = editData.url;
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    const { error } = await supabase
      .from('submission_links')
      .update({ title: editData.title, url: validUrl })
      .eq('id', editId)
      .eq('room_id', activeRoom); // 🟢 ป้องกันข้ามห้อง
    
    if (!error) {
      sendDiscordNotify('ลิ้งก์ส่งงาน (Submission Links)', 'UPDATE', `แก้ไขลิ้งก์: ${editData.title} (${activeRoom})`, currentUser.username);
      setEditId(null);
      fetchLinks();
    } else {
      alert('แก้ไขล้มเหลว: ' + error.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm('คุณต้องการลบลิ้งก์ส่งงานนี้ใช่หรือไม่?')) {
      const { error } = await supabase
        .from('submission_links')
        .delete()
        .eq('id', id)
        .eq('room_id', activeRoom); // 🟢 ป้องกันข้ามห้อง
      
      if (!error) {
        sendDiscordNotify('ลิ้งก์ส่งงาน (Submission Links)', 'DELETE', `ลบลิ้งก์: ${title} (${activeRoom})`, currentUser.username);
        fetchLinks();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto relative">
      <div className="mb-6">
        <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
          <FaLink className="text-indigo-600 dark:text-indigo-400 mr-3" /> ลิ้งก์ส่งงาน (Submission Links)
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">แหล่งเก็บงาน Google Drive และเว็บไซต์ต่างๆ สำหรับใช้ในระบบ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isSuperAdmin && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 transition-colors border border-transparent dark:border-slate-700 mb-6">
              <h5 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                 <FaPlus className="mr-2 text-indigo-500" /> เพิ่มลิ้งก์ใหม่
              </h5>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1">ชื่อแหล่งส่งงาน</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" placeholder="เช่น Drive ส่งงาน บทที่ 1" />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1">URL (ลิงก์)</label>
                  <input type="text" name="url" required value={formData.url} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" placeholder="https://drive.google.com/..." />
                </div>
                
                <button type="submit" className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-xl py-3 mt-2 hover:bg-indigo-700 transition-colors">
                  <FaSave className="mr-2" /> บันทึกข้อมูลลิ้งก์
                </button>
              </form>
            </div>
          </div>
        )}

        <div className={isSuperAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow h-full overflow-hidden flex flex-col transition-colors border border-transparent dark:border-slate-700">
            <div className="p-0 flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">ชื่อแหล่งส่งงาน</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">URL / ลิงก์แนบ</th>
                    {isSuperAdmin && (
                       <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 text-center w-28">จัดการ</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isSuperAdmin ? 3 : 2} className="text-center py-8 dark:text-slate-300">กำลังโหลด...</td></tr>
                  ) : links.length === 0 ? (
                    <tr><td colSpan={isSuperAdmin ? 3 : 2} className="text-center py-10 text-slate-400">ยังไม่มีการเพิ่มลิ้งก์ในห้องนี้</td></tr>
                  ) : links.map((link) => {
                      const isEditing = editId === link.id;

                      return (
                        <tr key={link.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700 transition-colors">
                          <td className="py-4 px-5">
                            {isEditing ? (
                              <input type="text" name="title" value={editData.title || ''} onChange={handleEditChange} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-500" />
                            ) : (
                              <div className="font-bold text-slate-800 dark:text-white">{link.title}</div>
                            )}
                          </td>
                          <td className="py-4 px-5 text-sm">
                            {isEditing ? (
                              <input type="text" name="url" value={editData.url || ''} onChange={handleEditChange} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-500" />
                            ) : (
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2 font-medium">
                                <FaExternalLinkAlt className="text-xs" /> คลิกเพื่อเปิดลิ้งก์
                              </a>
                            )}
                          </td>

                          {isSuperAdmin && (
                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isEditing ? (
                                  <button onClick={handleSaveEdit} className="w-8 h-8 flex items-center justify-center rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"><FaSave/></button>
                                ) : (
                                  <button onClick={() => { setEditId(link.id); setEditData(link); }} className="w-8 h-8 flex items-center justify-center rounded-full border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"><FaPen className="text-xs"/></button>
                                )}
                                <button onClick={() => handleDelete(link.id, link.title)} disabled={isEditing} className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${isEditing ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AdminLinks