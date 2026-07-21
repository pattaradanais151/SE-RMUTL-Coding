// src/pages/admin/AdminSchedules.jsx
import { useState, useEffect } from 'react'
import { FaTable, FaUpload, FaTrash, FaSearchPlus, FaDownload } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { getBangkokTime } from '../../utils/timezone'
import { useOutletContext } from 'react-router-dom' // 🟢

const AdminSchedules = () => {
  const { activeRoom } = useOutletContext(); // 🟢 รับค่าห้องปัจจุบัน
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  
  // สถานะสำหรับโชว์รูปใหญ่
  const [previewImage, setPreviewImage] = useState(null);

  const userStr = localStorage.getItem('se_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isSuper = currentUser?.role === 'super_admin';

  useEffect(() => {
    if (activeRoom) {
      fetchSchedules();
    }
  }, [activeRoom]); // 🟢 ดึงข้อมูลใหม่เมื่อสลับห้อง

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('room_id', activeRoom) // 🟢 กรองตามห้อง
      .order('created_at', { ascending: false });
    if (!error && data) setSchedules(data);
    setLoading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const safeFileName = `schedule_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('schedules').upload(safeFileName, file);
    if (uploadError) { alert('อัปโหลดล้มเหลว: ' + uploadError.message); setUploading(false); return; }

    const { data: publicUrlData } = supabase.storage.from('schedules').getPublicUrl(safeFileName);
    
    // 🟢 ซ่อนตารางเดิมเฉพาะของห้องนี้
    await supabase.from('class_schedules').update({ is_active: false }).eq('room_id', activeRoom).neq('id', 0);
    
    // 🟢 เพิ่มตารางใหม่และฝัง room_id
    const { error: insertError } = await supabase.from('class_schedules').insert([{ 
      image_path: publicUrlData.publicUrl, 
      is_active: true,
      room_id: activeRoom 
    }]);

    if (!insertError) {
      alert('อัปโหลดตารางเรียนใหม่สำเร็จ!');
      setFile(null); document.getElementById('file-upload').value = ''; fetchSchedules();
    }
    setUploading(false);
  };

  const handleDelete = async (id, imagePath) => {
    if (window.confirm('คุณต้องการลบตารางเรียนนี้ใช่หรือไม่?')) {
      await supabase.from('class_schedules').delete().eq('id', id).eq('room_id', activeRoom); // 🟢
      const fileName = imagePath.split('/').pop();
      await supabase.storage.from('schedules').remove([fileName]);
      fetchSchedules();
    }
  };

  return (
    <div className="max-w-7xl mx-auto relative">
      <div className="mb-6">
        <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
          <FaTable className="text-indigo-600 dark:text-indigo-400 mr-3" /> ตารางเรียน (Class Schedule)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isSuper && (
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6">
              <h5 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center">
                <FaUpload className="mr-2 text-indigo-500" /> อัปโหลดตารางใหม่
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">ตารางเดิมจะถูกซ่อนจากผู้ใช้ทั่วไปอัตโนมัติ</p>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-4 text-center">
                  <input id="file-upload" type="file" accept="image/*" required onChange={handleFileChange} className="w-full text-sm text-slate-500 dark:text-slate-400 cursor-pointer" />
                </div>
                <button type="submit" disabled={uploading} className="w-full flex justify-center bg-indigo-600 text-white font-semibold rounded-xl py-3 hover:bg-indigo-700 disabled:opacity-50">
                  {uploading ? 'กำลังอัปโหลด...' : 'บันทึกตารางเรียน'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className={isSuper ? "md:col-span-2" : "md:col-span-3"}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow h-full overflow-hidden flex flex-col p-6">
            <h5 className="font-bold text-slate-800 dark:text-white mb-4">ประวัติตารางเรียน</h5>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="py-3 px-4 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">ภาพ</th>
                    <th className="py-3 px-4 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">สถานะ</th>
                    <th className="py-3 px-4 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">อัปโหลดเมื่อ</th>
                    <th className="py-3 px-4 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="py-8 text-center dark:text-slate-300">กำลังโหลด...</td></tr>
                  ) : schedules.length === 0 ? (
                    <tr><td colSpan="4" className="py-12 text-center text-slate-400">ยังไม่มีตารางเรียนในห้องนี้</td></tr>
                  ) : schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                      <td className="py-3 px-4">
                        <img src={sch.image_path} alt="Schedule" className="h-16 w-auto rounded shadow-sm object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => setPreviewImage(sch.image_path)} />
                      </td>
                      <td className="py-3 px-4">
                        {sch.is_active ? <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">ใช้งานอยู่</span> : <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">อดีต (ซ่อน)</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">
                        {getBangkokTime(sch.created_at)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                           <button onClick={() => setPreviewImage(sch.image_path)} className="w-8 h-8 rounded-full border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center"><FaSearchPlus /></button>
                           <a href={sch.image_path} target="_blank" download className="w-8 h-8 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><FaDownload /></a>
                           {isSuper && <button onClick={() => handleDelete(sch.id, sch.image_path)} className="w-8 h-8 rounded-full border border-red-200 dark:border-red-900 text-red-500 flex items-center justify-center"><FaTrash /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal ดูรูปตารางแบบเต็ม */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
           <div className="relative max-w-4xl w-full flex flex-col items-center">
             <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white font-bold text-xl hover:text-red-400">ปิด (X)</button>
             <img src={previewImage} alt="Preview" className="rounded-lg shadow-2xl max-h-[85vh] object-contain bg-white" />
           </div>
        </div>
      )}
    </div>
  )
}
export default AdminSchedules