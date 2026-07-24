import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser, FaLock, FaSignInAlt, FaArrowLeft, FaGlobe, FaClock,
  FaTerminal, FaMoon, FaSun, FaExclamationTriangle, FaShieldAlt
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

  // จัดการ Theme ให้สอดคล้องกับหน้าหลัก (ใช้ data-theme)
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

  // ดึงข้อมูล IP Address
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

  // นาฬิกาแบบ Realtime
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

  // ฟังก์ชันสลับโหมด
  const toggleDarkMode = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // ฟังก์ชันเข้าสู่ระบบ
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

      if (data.suspended_until) {
        const suspendDate = new Date(data.suspended_until);
        const now = new Date();
        
        if (suspendDate > now) {
          setErrorMsg(`บัญชีถูกระงับการใช้งาน\n(ปลดแบนวันที่ ${suspendDate.toLocaleDateString('th-TH')} เวลา ${suspendDate.toLocaleTimeString('th-TH')} น.)`);
          setLoading(false);
          return;
        }
      }

      localStorage.setItem('se_user', JSON.stringify(data));
      navigate('/admin/portal'); 
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper font-prompt">
      {/* Background Glows */}
      <div className="login-glow login-glow-1"></div>
      <div className="login-glow login-glow-2"></div>

      {/* Top Status Bar */}
      <div className="login-topbar">
        <div className="topbar-container">
          <Link to="/" className="topbar-back-link">
            <div className="back-icon-box">
              <FaArrowLeft />
            </div>
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

      {/* Main Content */}
      <div className="login-main-content">
        <div className="login-glass-card">
          <div className="login-header">
            <div className="login-logo-container">
              <div className="logo-overlay"></div>
              {logoError ? (
                <FaShieldAlt className="logo-fallback" />
              ) : (
                <img
                  src="/logo-landing.jpg"
                  alt="SE-JOB Logo"
                  className="login-img"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
            <h2 className="login-title">Admin Portal</h2>
            <p className="login-subtitle">เข้าสู่ระบบเพื่อจัดการข้อมูล</p>
          </div>

          {errorMsg && (
            <div className="login-error-alert">
              <FaExclamationTriangle className="error-icon" />
              <div className="error-text">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-input-group">
              <label className="login-label">Username</label>
              <div className="login-input-wrapper">
                <FaUser className="login-input-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="login-input"
                  placeholder="กรอกชื่อผู้ใช้..."
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
                  <>
                    <FaSignInAlt /> Sign In
                  </>
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