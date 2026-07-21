import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser, FaLock, FaSignInAlt, FaArrowLeft, FaGlobe, FaClock,
  FaTerminal, FaMoon, FaSun, FaExclamationTriangle, FaShieldAlt
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import bcrypt from 'bcryptjs';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);

  const [publicIp, setPublicIp] = useState(null);
  const [ipStatus, setIpStatus] = useState('loading');
  const [bangkokTime, setBangkokTime] = useState('');

  // 🟢 ตรวจสอบ Theme เริ่มต้น
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  // 🟢 ดึงข้อมูล IP Address
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setPublicIp(data.ip);
        setIpStatus('ok');
      } catch (err) {
        setIpStatus('error');
      }
    };
    fetchIp();
  }, []);

  // 🟢 นาฬิกาแบบ Realtime
  useEffect(() => {
    const updateClock = () => {
      const formatted = new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date());
      setBangkokTime(formatted);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🟢 ฟังก์ชันสลับโหมด
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

  // 🟢 ฟังก์ชันเข้าสู่ระบบ
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        setErrorMsg('ไม่พบชื่อผู้ใช้งานนี้ในระบบ');
        setLoading(false);
        return;
      }

      const isValid = bcrypt.compareSync(password, data.password_hash);
      if (!isValid) {
        setErrorMsg('รหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      // เช็กการระงับบัญชี
      if (data.suspended_until) {
        const suspendDate = new Date(data.suspended_until);
        const now = new Date();
        
        if (suspendDate > now) {
          setErrorMsg(`บัญชีถูกระงับการใช้งาน\n(ปลดแบนวันที่ ${suspendDate.toLocaleDateString('th-TH')} เวลา ${suspendDate.toLocaleTimeString('th-TH')} น.)`);
          setLoading(false);
          return;
        }
      }

      // บันทึกข้อมูลและเด้งไปหน้า Portal
      localStorage.setItem('se_user', JSON.stringify(data));
      navigate('/admin/portal'); 
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#090D14] font-prompt transition-colors duration-500 overflow-hidden relative">

      {/* 🔮 Background Glow Effects */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none transition-all duration-1000"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none transition-all duration-1000"></div>

      {/* 📡 Status Bar (Top Header) */}
      <div className="w-full bg-white/40 dark:bg-black/20 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 shrink-0 z-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex flex-wrap sm:flex-nowrap items-center justify-between text-[11px] sm:text-xs font-mono text-slate-600 dark:text-slate-400">
          
          <Link to="/" className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors shrink-0 group">
            <div className="bg-slate-200 dark:bg-white/10 p-1 rounded group-hover:bg-indigo-100 dark:group-hover:bg-cyan-500/20 transition-colors">
              <FaArrowLeft className="text-[10px]" />
            </div>
            กลับสู่หน้าหลัก
          </Link>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <span className="hidden sm:flex items-center gap-1.5" title="Public IP ของคุณ">
              <FaGlobe className="text-[10px] text-cyan-600 dark:text-cyan-400" />
              {ipStatus === 'loading' && 'กำลังตรวจสอบ IP...'}
              {ipStatus === 'ok' && `${publicIp}`}
              {ipStatus === 'error' && 'ไม่สามารถระบุ IP ได้'}
            </span>
            <span className="flex items-center gap-1.5" title="เวลาปัจจุบัน เขตกรุงเทพฯ">
              <FaClock className="text-[10px] text-indigo-500 dark:text-indigo-400" />
              {bangkokTime} น.
            </span>
            <button
              onClick={toggleDarkMode}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors focus:outline-none text-slate-700 dark:text-amber-400"
              title="สลับโหมดหน้าจอ"
            >
              {darkMode ? <FaSun className="text-[12px]" /> : <FaMoon className="text-[12px]" />}
            </button>
          </div>
        </div>
      </div>

      {/* 🔐 Main Login Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 z-10 w-full">
        
        {/* Terminal Badge */}
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/60 dark:bg-[#161B22]/80 border border-slate-200 dark:border-white/10 font-mono text-[11px] sm:text-xs text-indigo-600 dark:text-cyan-300 shadow-sm backdrop-blur-md animate-fade-in">
          <FaTerminal className="shrink-0" />
          <span className="text-slate-400 dark:text-slate-500">$</span> se-job auth --secure-login
        </div>

        {/* Login Card (Premium Glassmorphism) */}
        <div className="w-full max-w-[420px] bg-white/70 dark:bg-[#161B22]/70 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] transition-all duration-500 relative">
          
          {/* Inner Highlight for depth */}
          <div className="absolute inset-0 rounded-[2.5rem] border-[1.5px] border-white/40 dark:border-white/5 pointer-events-none"></div>

          {/* Logo & Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-cyan-500/30 mb-5 overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 dark:bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
              {logoError ? (
                <FaShieldAlt className="text-white text-3xl drop-shadow-md" />
              ) : (
                <img
                  src="/logo.PNG"
                  alt="SE-JOB Logo"
                  className="w-12 h-12 object-contain drop-shadow-md"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Admin Portal</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">เข้าสู่ระบบเพื่อจัดการข้อมูล</p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-6 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3 whitespace-pre-line text-left animate-fade-in relative z-10">
              <FaExclamationTriangle className="text-lg mt-0.5 shrink-0" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            
            {/* Username Input */}
            <div className="space-y-1.5 group/input">
              <label className="text-slate-600 dark:text-slate-400 text-[13px] font-bold ml-2 transition-colors group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-cyan-400">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within/input:text-indigo-500 dark:group-focus-within/input:text-cyan-400 text-slate-400">
                  <FaUser />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full bg-slate-50/50 dark:bg-[#0D1117]/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:bg-white dark:focus:bg-[#0D1117] focus:border-indigo-500 dark:focus:border-cyan-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-cyan-500/10 transition-all duration-300 font-medium"
                  placeholder="กรอกชื่อผู้ใช้..."
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 group/input">
              <label className="text-slate-600 dark:text-slate-400 text-[13px] font-bold ml-2 transition-colors group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-cyan-400">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within/input:text-indigo-500 dark:group-focus-within/input:text-cyan-400 text-slate-400">
                  <FaLock />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50/50 dark:bg-[#0D1117]/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:bg-white dark:focus:bg-[#0D1117] focus:border-indigo-500 dark:focus:border-cyan-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-cyan-500/10 transition-all duration-300 font-medium"
                  placeholder="กรอกรหัสผ่าน..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-slate-800 dark:bg-white/10 rounded-2xl py-4 mt-4 border border-transparent dark:border-white/5 hover:border-transparent transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {/* Animated Gradient Background on Hover */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient -z-10"></div>
              
              <span className="relative z-10 flex items-center justify-center text-white font-bold tracking-wide transition-colors duration-300">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="mr-2" /> Sign In
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Footer Text */}
        <div className="mt-10 text-center text-slate-500 dark:text-slate-500 text-xs font-mono relative z-10">
          <p>&copy; {new Date().getFullYear()} SE-JOB Admin System.</p>
          <p className="mt-1 opacity-70">Secured Area. Authorized personnel only.</p>
        </div>
      </div>
      
      {/* Required style for gradient animation */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;