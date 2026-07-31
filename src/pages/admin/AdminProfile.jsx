import { useState, useEffect } from 'react';
import { FaUserCircle, FaKey, FaSave, FaCamera, FaMoon, FaSun, FaHistory, FaIdCard, FaShieldAlt } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import bcrypt from 'bcryptjs';

const AdminProfile = () => {
  const [currentUser, setCurrentUser] = useState({ username: '', role: '', user_id: '', avatar_url: '', email: '' });
  
  const [profileData, setProfileData] = useState({
    name: '', surname: '', nickname: '', ig: '', facebook: '', tel: '', email: ''
  });
  
  const [passwordData, setPasswordData] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchUserData();
    if (document.documentElement.classList.contains('dark')) setDarkMode(true);
  }, []);

  const fetchUserData = async () => {
    const userStr = localStorage.getItem('se_user');
    if (!userStr) return;
    const parsedUser = JSON.parse(userStr);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', parsedUser.user_id)
      .single();

    if (data && !error) {
      setCurrentUser(data);
      setProfileData({
        name: data.name || '',
        surname: data.surname || '',
        nickname: data.nickname || '',
        ig: data.ig || '',
        facebook: data.facebook || '',
        tel: data.tel || '',
        email: data.email || ''
      });
      localStorage.setItem('se_user', JSON.stringify(data));
      window.dispatchEvent(new Event('userUpdated')); // ทริกเกอร์ให้ Sidebar อัปเดตชื่อ
    }
  };

  useEffect(() => {
    setImageError(false);
  }, [currentUser.avatar_url]);

  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

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
  };

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
      alert('เปลี่ยนรูปโปรไฟล์สำเร็จ!');
      fetchUserData();
    }
    setUploadingImage(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    
    // 🟢 อัปเดตข้อมูลรวมถึงอีเมลลง public.users (Trigger จะจัดการ Auth ให้)
    const { error } = await supabase
      .from('users')
      .update({ ...profileData })
      .eq('user_id', currentUser.user_id);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('อัปเดตข้อมูลโปรไฟล์สำเร็จ!');
      fetchUserData();
    }
    setProfileLoading(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) { 
      alert('รหัสผ่านใหม่ยืนยันไม่ตรงกัน!'); 
      return; 
    }
    
    setLoading(true);
    
    // 🟢 ใช้ bcrypt เข้ารหัส แล้วบันทึกลง public.users (Trigger จะโยนรหัสนี้เข้า Auth ให้เอง)
    const hashedPassword = bcrypt.hashSync(passwordData.new_password, 10);
    const { error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('user_id', currentUser.user_id);

    if (error) alert('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + error.message);
    else {
      alert('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาใช้รหัสผ่านใหม่ในครั้งต่อไป');
      setPasswordData({ new_password: '', confirm_password: '' });
    }
    setLoading(false);
  };

  if (!currentUser.user_id) return (
    <div className="flex justify-center items-center h-[50vh] text-slate-500 dark:text-slate-400 font-prompt">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mr-3"></div>
      กำลังโหลดข้อมูลโปรไฟล์...
    </div>
  );

  return (
    // ใส่ overflow-x-hidden และ pb-12 ป้องกันการเลื่อนซ้ายขวา และปุ่มตกขอบ
    <div className="w-full max-w-7xl mx-auto relative animate-fade-in font-prompt overflow-x-hidden pb-12">
      
      {/* Ambient Background Glows (ขังไว้ไม่ให้ทะลุจอ) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 mb-8">
        <h3 className="m-0 font-extrabold text-slate-800 dark:text-white text-2xl md:text-3xl flex items-center mb-2 tracking-tight">
          <FaUserCircle className="text-indigo-500 mr-3 drop-shadow-md" /> โปรไฟล์ของฉัน
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base ml-10 md:ml-12">
          จัดการบัญชี ความปลอดภัย และข้อมูลส่วนตัวของคุณ
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 relative z-10">
        
        {/* คอลัมน์ซ้าย: โปรไฟล์ & ตั้งค่า */}
        <div className="xl:col-span-1 space-y-6 lg:space-y-8">
          
          {/* Profile Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden text-center pb-8 transition-all hover:shadow-lg">
            {/* Banner Background */}
            <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 w-full mb-14 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            {/* Avatar */}
            <div className="relative w-28 h-28 mx-auto -mt-28 mb-4 z-10">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-lg opacity-40"></div>
              {currentUser.avatar_url && !imageError ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt="Profile" 
                  className="relative w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-800 bg-slate-100 shadow-xl" 
                  onError={() => setImageError(true)} 
                />
              ) : (
                <div className="relative w-full h-full rounded-full bg-slate-800 border-4 border-white dark:border-slate-800 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-indigo-500 text-white p-2.5 rounded-full cursor-pointer hover:bg-indigo-600 shadow-lg transition-transform hover:scale-110 border-2 border-white dark:border-slate-800">
                <FaCamera size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              </label>
            </div>
            
            {uploadingImage && <p className="text-xs text-indigo-500 font-bold mb-3 animate-pulse">กำลังอัปโหลดรูปภาพ...</p>}
            
            <h4 className="font-extrabold text-slate-800 dark:text-white text-2xl tracking-tight mb-2">
              @{currentUser.username}
            </h4>
            <div className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-700/50 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              <FaShieldAlt className="mr-1.5" />
              {currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </div>
          </div>
          
          {/* Preferences Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-6 md:p-8 transition-all hover:shadow-lg">
             <h5 className="font-bold text-slate-800 dark:text-white mb-5 flex items-center text-lg">
                การแสดงผล (Preferences)
             </h5>
             <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-inner">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-xl shadow-sm ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-100 text-amber-500'}`}>
                     {darkMode ? <FaMoon size={18} /> : <FaSun size={18} />}
                   </div>
                   <div>
                     <div className="text-sm font-bold text-slate-800 dark:text-white">โหมดกลางคืน</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ลดแสงสะท้อนถนอมสายตา</div>
                   </div>
                </div>
                <button 
                  onClick={toggleDarkMode} 
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${darkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${darkMode ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
             </div>
          </div>
        </div>

        {/* คอลัมน์ขวา: แก้ไขโปรไฟล์, รหัสผ่าน, กิจกรรม */}
        <div className="xl:col-span-2 space-y-6 lg:space-y-8">
          
          {/* Personal Info Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-6 md:p-8 transition-all hover:shadow-lg flex flex-col">
            <h5 className="font-extrabold text-slate-800 dark:text-white mb-6 flex items-center text-xl">
              <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-xl mr-3 shadow-md shadow-blue-500/20">
                <FaIdCard size={18} />
              </div>
              ข้อมูลส่วนบุคคล
            </h5>
            
            {/* Form */}
            <form onSubmit={handleUpdateProfile} className="flex flex-col flex-1">
              <div className="space-y-5 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">ชื่อจริง (Name)</label>
                    <input 
                      type="text" name="name" required 
                      value={profileData.name} onChange={handleProfileChange} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">นามสกุล (Surname)</label>
                    <input 
                      type="text" name="surname" required 
                      value={profileData.surname} onChange={handleProfileChange} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">ชื่อเล่น (Nickname)</label>
                  <input 
                    type="text" name="nickname" required 
                    value={profileData.nickname} onChange={handleProfileChange} 
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Instagram</label>
                    <input 
                      type="text" name="ig" required 
                      value={profileData.ig} onChange={handleProfileChange} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Facebook</label>
                    <input 
                      type="text" name="facebook" required 
                      value={profileData.facebook} onChange={handleProfileChange} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">เบอร์โทรศัพท์ (Tel)</label>
                    <input 
                      type="tel" name="tel" required 
                      value={profileData.tel} onChange={handleProfileChange} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">อีเมล (Email)</label>
                    <input 
                      type="email" name="email" required 
                      value={profileData.email} onChange={handleProfileChange} 
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-inner" 
                    />
                  </div>
                </div>
              </div>

              {/* ปุ่ม Save จะอยู่ด้านล่างเสมอ และมี margin กันตกขอบ */}
              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                <button 
                  type="submit" 
                  disabled={profileLoading} 
                  className="w-full md:w-auto flex items-center justify-center bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl px-8 py-3.5 hover:from-sky-600 hover:to-blue-700 shadow-[0_4px_15px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)] transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  <FaSave className="mr-2" /> {profileLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนตัว'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Reset Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-6 md:p-8 transition-all hover:shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h5 className="font-extrabold text-slate-800 dark:text-white mb-6 flex items-center text-xl">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl mr-3 shadow-md shadow-indigo-500/20">
                <FaKey size={18} />
              </div>
              เปลี่ยนรหัสผ่านใหม่
            </h5>
            
            <form onSubmit={handleUpdatePassword} className="space-y-5 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5 ml-1">รหัสผ่านใหม่</label>
                  <input 
                    type="password" name="new_password" required minLength="6" 
                    value={passwordData.new_password} onChange={handlePasswordChange} 
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" 
                    placeholder="อย่างน้อย 6 ตัวอักษร" 
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5 ml-1">ยืนยันรหัสผ่านใหม่</label>
                  <input 
                    type="password" name="confirm_password" required minLength="6" 
                    value={passwordData.confirm_password} onChange={handlePasswordChange} 
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" 
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" 
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" disabled={loading} 
                  className="w-full md:w-auto flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl px-8 py-3.5 hover:from-indigo-600 hover:to-purple-700 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  <FaSave className="mr-2" /> {loading ? 'กำลังบันทึก...' : 'อัปเดตรหัสผ่าน'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-6 md:p-8 transition-all hover:shadow-lg">
            <h5 className="font-extrabold text-slate-800 dark:text-white mb-6 flex items-center text-xl">
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl mr-3 shadow-md shadow-emerald-500/20">
                <FaHistory size={18} />
              </div>
              ประวัติกิจกรรมล่าสุด
            </h5>
            
            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6 mt-4">
               {/* Timeline Item 1 */}
               <div className="relative">
                 <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50 dark:ring-slate-800/80 shadow-sm"></div>
                 <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">เข้าสู่ระบบครั้งล่าสุด</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      วันนี้ เวลา {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </p>
                 </div>
               </div>
               
               {/* Timeline Item 2 */}
               <div className="relative">
                 <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-slate-800/80 shadow-sm"></div>
                 <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">อัปเดตระบบสำเร็จ</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      ระบบทำงานและพร้อมแสดงผลแบบไร้การเลื่อนซ้ายขวาอย่างสมบูรณ์แบบ
                    </p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AdminProfile;