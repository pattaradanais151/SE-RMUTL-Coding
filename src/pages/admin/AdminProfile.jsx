import { useState, useEffect } from 'react'
import { FaUserCircle, FaKey, FaSave, FaCamera, FaMoon, FaSun, FaHistory, FaEnvelope, FaPen, FaTimes, FaShieldAlt } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import bcrypt from 'bcryptjs'

const AdminProfile = () => {
  const [currentUser, setCurrentUser] = useState({ username: '', role: '', user_id: '', avatar_url: '', email: '' });
  const [passwordData, setPasswordData] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('se_user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setCurrentUser(parsedUser);
      setNewEmail(parsedUser.email || '');
    }
    if (document.documentElement.classList.contains('dark')) setDarkMode(true);
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [currentUser.avatar_url]);

  const handleChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('ขนาดไฟล์ต้องไม่เกิน 5MB'); return; }

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const safeFileName = `user_${currentUser.user_id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('profiles').upload(safeFileName, file, { cacheControl: '3600', upsert: true });
    if (uploadError) { alert('อัปโหลดล้มเหลว: ' + uploadError.message); setUploadingImage(false); return; }

    const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(safeFileName);
    const { error: updateError } = await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('user_id', currentUser.user_id);

    if (updateError) alert('อัปเดตฐานข้อมูลล้มเหลว: ' + updateError.message);
    else {
      const updatedUser = { ...currentUser, avatar_url: urlData.publicUrl };
      setCurrentUser(updatedUser);
      localStorage.setItem('se_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('userUpdated'));
      alert('เปลี่ยนรูปโปรไฟล์สำเร็จ!');
    }
    setUploadingImage(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      alert('กรุณาระบุอีเมล');
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.from('users').update({ email: newEmail }).eq('user_id', currentUser.user_id);
    
    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      const updatedUser = { ...currentUser, email: newEmail };
      setCurrentUser(updatedUser);
      localStorage.setItem('se_user', JSON.stringify(updatedUser));
      setIsEditingEmail(false);
    }
    setEmailLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) { alert('รหัสผ่านใหม่ยืนยันไม่ตรงกัน!'); return; }
    setLoading(true);
    const hashedPassword = bcrypt.hashSync(passwordData.new_password, 10);
    const { error } = await supabase.from('users').update({ password_hash: hashedPassword }).eq('user_id', currentUser.user_id);

    if (error) alert('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + error.message);
    else {
      alert('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาใช้รหัสผ่านใหม่ในครั้งต่อไป');
      setPasswordData({ new_password: '', confirm_password: '' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto relative animate-fade-in">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative z-10 mb-8">
        <h3 className="m-0 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 text-3xl flex items-center mb-2 tracking-tight">
          <FaUserCircle className="text-indigo-500 mr-3 drop-shadow-md" /> โปรไฟล์ของฉัน
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm ml-10">จัดการบัญชี ความปลอดภัย และปรับแต่งประสบการณ์การใช้งานของคุณ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* คอลัมน์ 1: โปรไฟล์ & ตั้งค่า */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Profile Card */}
          <div className="relative overflow-hidden bg-white/70 dark:bg-slate-800/50 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 transition-all duration-300 group">
            {/* Banner Background */}
            <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            </div>
            
            <div className="px-6 pb-8 text-center relative">
              {/* Avatar */}
              <div className="relative w-28 h-28 mx-auto -mt-14 mb-4 z-10">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                {currentUser.avatar_url && !imageError ? (
                  <img src={currentUser.avatar_url} alt="Profile" className="relative w-full h-full rounded-full object-cover border-[4px] border-white dark:border-slate-800 bg-slate-100 shadow-xl" onError={() => setImageError(true)} />
                ) : (
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-[4px] border-white dark:border-slate-800 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                    {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-indigo-500 text-white p-2.5 rounded-full cursor-pointer hover:bg-indigo-600 hover:scale-110 shadow-lg transition-all duration-300 ring-4 ring-white dark:ring-slate-800">
                  <FaCamera size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
              
              {uploadingImage && <p className="text-xs text-indigo-500 font-bold mb-2 animate-pulse">กำลังอัปโหลดรูปภาพ...</p>}
              
              <h4 className="font-extrabold text-slate-800 dark:text-white text-2xl mb-1 tracking-tight">@{currentUser.username}</h4>
              <div className="inline-flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-sm">
                <FaShieldAlt className="mr-1.5" />
                {currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </div>
              
              <div className="text-left bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 space-y-4 backdrop-blur-sm">
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"><FaEnvelope /> อีเมลติดต่อ</span>
                  
                  {isEditingEmail ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                       <input 
                         type="email" 
                         value={newEmail} 
                         onChange={(e) => setNewEmail(e.target.value)} 
                         className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm outline-none dark:text-white focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner" 
                         placeholder="ระบุอีเมล..." 
                         autoFocus
                       />
                       <button onClick={handleUpdateEmail} disabled={emailLoading} className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors"><FaSave /></button>
                       <button onClick={() => { setIsEditingEmail(false); setNewEmail(currentUser.email || ''); }} className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"><FaTimes /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group/email">
                       <span className="font-medium text-sm text-slate-700 dark:text-slate-300 truncate pr-2">
                          {currentUser.email ? currentUser.email : <span className="text-slate-400 italic">ยังไม่ได้ระบุอีเมล</span>}
                       </span>
                       <button onClick={() => setIsEditingEmail(true)} className="text-slate-400 hover:text-indigo-500 opacity-0 group-hover/email:opacity-100 transition-opacity bg-white dark:bg-slate-700 p-1.5 rounded-md shadow-sm border border-slate-200 dark:border-slate-600"><FaPen className="text-[10px]" /></button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700/50">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">สถานะบัญชี</span>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preferences Card */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
             <h5 className="font-bold text-slate-800 dark:text-white mb-5 flex items-center text-lg">
                การแสดงผล (Preferences)
             </h5>
             <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                   <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-100 text-amber-500'}`}>
                     {darkMode ? <FaMoon size={20} /> : <FaSun size={20} />}
                   </div>
                   <div>
                     <div className="text-sm font-bold text-slate-700 dark:text-white">โหมดกลางคืน</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400">เปลี่ยนธีมลดแสงสะท้อน</div>
                   </div>
                </div>
                <button 
                  onClick={toggleDarkMode} 
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${darkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${darkMode ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
             </div>
          </div>
        </div>

        {/* คอลัมน์ 2: รหัสผ่าน & ประวัติ */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Password Reset Card */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-8 transition-all duration-300 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
            
            <h5 className="font-extrabold text-slate-800 dark:text-white mb-6 flex items-center text-xl">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl mr-3 shadow-lg shadow-indigo-500/30">
                <FaKey size={16} />
              </div>
              เปลี่ยนรหัสผ่านใหม่
            </h5>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold ml-1">รหัสผ่านใหม่</label>
                  <input 
                    type="password" 
                    name="new_password" 
                    required minLength="6" 
                    value={passwordData.new_password} 
                    onChange={handleChange} 
                    className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3.5 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all backdrop-blur-sm" 
                    placeholder="อย่างน้อย 6 ตัวอักษร" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold ml-1">ยืนยันรหัสผ่านใหม่</label>
                  <input 
                    type="password" 
                    name="confirm_password" 
                    required minLength="6" 
                    value={passwordData.confirm_password} 
                    onChange={handleChange} 
                    className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3.5 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all backdrop-blur-sm" 
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" 
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex items-center justify-center w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl px-8 py-3.5 hover:from-indigo-600 hover:to-purple-700 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <FaSave className="mr-2" /> {loading ? 'กำลังบันทึก...' : 'อัปเดตรหัสผ่าน'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Recent Activity Card */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-8 transition-all duration-300 relative overflow-hidden">
            <h5 className="font-extrabold text-slate-800 dark:text-white mb-6 flex items-center text-xl">
              <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl mr-3 shadow-lg shadow-emerald-500/30">
                <FaHistory size={16} />
              </div>
              ประวัติกิจกรรมล่าสุด
            </h5>
            
            <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-700 space-y-6 mt-4">
               {/* Timeline Item 1 */}
               <div className="relative">
                 <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50 dark:ring-slate-800/80 shadow-sm"></div>
                 <div className="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">เข้าสู่ระบบครั้งล่าสุด</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">วันนี้ เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
                 </div>
               </div>
               
               {/* Timeline Item 2 */}
               <div className="relative">
                 <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-slate-800/80 shadow-sm"></div>
                 <div className="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">อัปเดตระบบสำเร็จ</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ระบบทำงานและพร้อมแยกข้อมูลตามห้องอย่างสมบูรณ์แบบ Multi-Tenant</p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
export default AdminProfile