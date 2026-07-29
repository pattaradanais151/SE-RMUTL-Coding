import { useState, useEffect } from 'react'
import { FaTable, FaUpload, FaTrash, FaSearchPlus, FaDownload, FaCloudUploadAlt, FaSpinner, FaImage } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { getBangkokTime } from '../../utils/timezone'
import { useOutletContext } from 'react-router-dom'

const AdminSchedules = () => {
  const { activeRoom } = useOutletContext();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  
  const [previewImage, setPreviewImage] = useState(null);

  const userStr = localStorage.getItem('se_user');
  const currentUser = userStr ? JSON.parse(userStr) : {};
  const isSuper = currentUser?.role === 'super_admin';

  useEffect(() => {
    if (activeRoom) {
      fetchSchedules();
    }
  }, [activeRoom]);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('room_id', activeRoom)
      .order('created_at', { ascending: false });
    if (!error && data) setSchedules(data);
    setLoading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const safeFileName = `schedule_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('schedules').upload(safeFileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('schedules').getPublicUrl(safeFileName);
      
      // ซ่อนตารางเดิมเฉพาะของห้องนี้
      await supabase.from('class_schedules').update({ is_active: false }).eq('room_id', activeRoom).neq('id', 0);
      
      // เพิ่มตารางใหม่และฝัง room_id
      const { error: insertError } = await supabase.from('class_schedules').insert([{ 
        image_path: publicUrlData.publicUrl, 
        is_active: true,
        room_id: activeRoom 
      }]);

      if (insertError) throw insertError;

      alert('อัปโหลดตารางเรียนใหม่สำเร็จ!');
      setFile(null); 
      fetchSchedules();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, imagePath) => {
    if (window.confirm('คุณต้องการลบตารางเรียนนี้ออกจากระบบใช่หรือไม่?')) {
      try {
        await supabase.from('class_schedules').delete().eq('id', id).eq('room_id', activeRoom);
        
        const fileName = imagePath.split('/').pop();
        await supabase.storage.from('schedules').remove([fileName]);
        
        fetchSchedules();
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
      }
    }
  };

  return (
    // 🟢 ใส่ w-full และ overflow-x-hidden ป้องกันสไลด์ซ้าย-ขวา
    <div className="w-full max-w-7xl mx-auto relative animate-fade-in font-prompt overflow-x-hidden pb-12">
      
      {/* 🔮 Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      {/* 📝 Header Section */}
      <div className="relative z-10 mb-8">
        <h3 className="m-0 font-extrabold text-slate-800 dark:text-white text-2xl md:text-3xl flex items-center mb-2 tracking-tight">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl mr-3 shadow-lg shadow-indigo-500/30">
            <FaTable size={20} />
          </div>
          ตารางเรียน (Class Schedule)
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base ml-[52px]">
          อัปโหลดและจัดการรูปภาพตารางเรียนสำหรับแสดงให้ผู้เข้าชมเว็บไซต์
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10">
        
        {/* คอลัมน์ซ้าย: ฟอร์มอัปโหลด */}
        {isSuper && (
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-6 md:p-8 transition-all hover:shadow-lg">
              <h5 className="font-extrabold text-slate-800 dark:text-white mb-2 flex items-center text-lg">
                <FaUpload className="mr-2 text-indigo-500" /> อัปโหลดตารางใหม่
              </h5>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 leading-relaxed">
                ภาพตารางเรียนเดิมจะถูกซ่อนจากหน้าเว็บผู้เข้าชมโดยอัตโนมัติเมื่อมีการอัปโหลดใหม่
              </p>
              
              <form onSubmit={handleUpload} className="space-y-5">
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-200 dark:border-indigo-500/40 rounded-2xl cursor-pointer bg-indigo-50/50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      {file ? (
                        <>
                          <FaImage className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">คลิกเพื่อเปลี่ยนไฟล์</p>
                        </>
                      ) : (
                        <>
                          <FaCloudUploadAlt className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3 group-hover:text-indigo-500 transition-colors" />
                          <p className="mb-1 text-sm text-slate-600 dark:text-slate-300 font-semibold">คลิกเพื่อเลือกไฟล์รูปภาพ</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, JPEG, WEBP</p>
                        </>
                      )}
                    </div>
                    <input id="dropzone-file" type="file" accept="image/*" required onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                
                <button 
                  type="submit" 
                  disabled={uploading || !file} 
                  className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl py-3.5 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 gap-2"
                >
                  {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                  {uploading ? 'กำลังอัปโหลด...' : 'บันทึกตารางเรียน'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* คอลัมน์ขวา: ตารางแสดงประวัติ */}
        <div className={isSuper ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
              <h5 className="font-extrabold text-slate-800 dark:text-white text-lg">ประวัติตารางเรียน</h5>
            </div>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar p-0">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-100/50 dark:bg-slate-700/30">
                  <tr>
                    <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">ภาพตารางเรียน</th>
                    <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center">สถานะ</th>
                    <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center">อัปโหลดเมื่อ</th>
                    <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center w-36">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-16 text-center text-slate-500 dark:text-slate-400">
                        <FaSpinner className="animate-spin text-3xl text-indigo-500 mx-auto mb-3" />
                        กำลังโหลดข้อมูล...
                      </td>
                    </tr>
                  ) : schedules.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-16 text-center text-slate-400 dark:text-slate-500">
                        <FaTable className="text-5xl mx-auto mb-3 opacity-20" />
                        ยังไม่มีตารางเรียนในห้องนี้
                      </td>
                    </tr>
                  ) : schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-6">
                        <div 
                          className="w-32 h-20 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all shadow-sm"
                          onClick={() => setPreviewImage(sch.image_path)}
                        >
                          <img src={sch.image_path} alt="Schedule" className="w-full h-full object-cover opacity-90 hover:opacity-100" />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {sch.is_active ? (
                          <span className="inline-flex items-center justify-center bg-emerald-100/80 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                            ใช้งานอยู่
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-slate-100/80 text-slate-600 border border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600/50 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                            ซ่อน (อดีต)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600 dark:text-slate-400 text-sm font-medium">
                        {getBangkokTime(sch.created_at)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => setPreviewImage(sch.image_path)} 
                             className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all shadow-sm"
                             title="ขยายดูภาพ"
                           >
                             <FaSearchPlus size={14} />
                           </button>
                           <a 
                             href={sch.image_path} 
                             target="_blank" 
                             download 
                             className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                             title="ดาวน์โหลดภาพ"
                           >
                             <FaDownload size={14} />
                           </a>
                           {isSuper && (
                             <button 
                               onClick={() => handleDelete(sch.id, sch.image_path)} 
                               className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                               title="ลบตารางเรียน"
                             >
                               <FaTrash size={14} />
                             </button>
                           )}
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

      {/* 🔍 Modal ขยายรูปภาพแบบ Glassmorphism */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setPreviewImage(null)}></div>
          <div className="relative max-w-5xl w-full flex flex-col items-center animate-fade-in">
            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute -top-12 right-0 md:-right-12 bg-white/10 hover:bg-rose-500 text-white border border-white/20 p-3 rounded-full transition-colors backdrop-blur-sm"
              title="ปิดหน้าต่าง"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-2xl border border-white/20">
              <img src={previewImage} alt="Schedule Preview" className="rounded-xl shadow-inner max-h-[80vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSchedules;