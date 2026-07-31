import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser, FaLock, FaSignInAlt, FaArrowLeft, FaGlobe, FaClock,
  FaMoon, FaSun, FaExclamationTriangle, FaShieldAlt
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import bcrypt from 'bcryptjs';
import './AdminLogin.css';

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

  // ล้าง Session เก่าออกทุกครั้งที่เข้ามาหน้า Login
  useEffect(() => {
    supabase.auth.signOut();
    localStorage.removeItem('se_user');
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      setDarkMode(true);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      setDarkMode(false);
    }
  }, []);

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

  useEffect(() => {
    const updateClock = () => {
      const formatted = new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(new Date());
      setBangkokTime(formatted);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. ค้นหาผู้ใช้ด้วย Username หรือ Email (ใช้ maybeSingle เพื่อไม่ให้เกิด Error 406)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${username}`)
        .maybeSingle();

      if (userError || !userData) {
        throw new Error('ไม่พบชื่อผู้ใช้งานหรืออีเมลนี้ในระบบ');
      }

      // 2. ตรวจสอบการโดนแบน
      if (userData.suspended_until) {
        const suspendDate = new Date(userData.suspended_until);
        const now = new Date();
        if (suspendDate > now) {
          throw new Error(`บัญชีถูกระงับการใช้งานถึงวันที่ ${suspendDate.toLocaleDateString('th-TH')} เวลา ${suspendDate.toLocaleTimeString('th-TH')} น.`);
        }
      }

      // 3. ตรวจสอบรหัสผ่านด้วย bcrypt เป็นด่านหน้า (ไม่ต้องพึ่ง Auth กรณีเซอร์เวอร์มีปัญหา)
      const isValidPassword = bcrypt.compareSync(password, userData.password_hash);
      if (!isValidPassword) {
        throw new Error('รหัสผ่านไม่ถูกต้อง');
      }

      if (!userData.email) {
        throw new Error('บัญชีของคุณไม่มีอีเมลผูกไว้ กรุณาติดต่อ Super Admin');
      }

      // 4. ล็อกอินเข้า Supabase Auth เพื่อปลดล็อก RLS
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password,
      });

      if (authError) {
        console.error("Supabase Auth Error:", authError);
        if (authError.status === 500) {
           throw new Error('ระบบเซิร์ฟเวอร์ขัดข้อง (Internal Server Error)');
        }
        throw new Error(authError.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
      }

      // 5. ล็อกอินสำเร็จ เก็บข้อมูลลง LocalStorage และพานำไปหน้า Portal
      localStorage.setItem('se_user', JSON.stringify(userData));
      navigate('/admin/portal');

    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper font-prompt">
      <div className="login-glow login-glow-1"></div>
      <div className="login-glow login-glow-2"></div>

      <div className="login-topbar">
        <div className="topbar-container">
          <Link to="/" className="topbar-back-link">
            <div className="back-icon-box"><FaArrowLeft /></div>
            กลับสู่หน้าหลัก
          </Link>

          <div className="topbar-status">
            <span className="status-item hide-on-mobile" title="Public IP ของคุณ">
              <FaGlobe className="status-icon text-cyan" />
              {ipStatus === 'loading' && 'กำลังตรวจสอบ IP...'}
              {ipStatus === 'ok' && `${publicIp}`}
              {ipStatus === 'error' && 'ไม่สามารถระบุ IP ได้'}
            </span>
            <span className="status-item" title="เวลาปัจจุบัน เขตกรุงเทพฯ">
              <FaClock className="status-icon text-indigo" />
              {bangkokTime} น.
            </span>
            <button onClick={toggleDarkMode} className="theme-toggle-btn" title="สลับโหมดหน้าจอ">
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </div>
      </div>

      <div className="login-main-content">
        <div className="login-glass-card">
          <div className="login-header">
            <div className="login-logo-container">
              <div className="logo-overlay"></div>
              {logoError ? (
                <FaShieldAlt className="logo-fallback" />
              ) : (
                <img src="/logo-landing.jpg" alt="SE-JOB Logo" className="login-img" onError={() => setLogoError(true)} />
              )}
            </div>
            <h2 className="login-title">Admin Portal</h2>
            <p className="login-subtitle">เข้าสู่ระบบผ่าน Supabase Auth</p>
          </div>

          {errorMsg && (
            <div className="login-error-alert">
              <FaExclamationTriangle className="error-icon" />
              <div className="error-text">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-input-group">
              <label className="login-label">Username / Email</label>
              <div className="login-input-wrapper">
                <FaUser className="login-input-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="login-input"
                  placeholder="กรอกชื่อผู้ใช้ หรือ อีเมล..."
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrapper">
                <FaLock className="login-input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="login-input"
                  placeholder="กรอกรหัสผ่าน..."
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-submit-btn">
              <span>
                {loading ? (
                  <>
                    <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <><FaSignInAlt /> Sign In</>
                )}
              </span>
            </button>
          </form>
        </div>

        <div className="login-footer-text">
          <p>&copy; {new Date().getFullYear()} SE-JOB Admin System, Secured Area. Authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;