import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  FaCalendarAlt, FaLink, FaExternalLinkAlt, FaClock, FaSignInAlt, 
  FaFileAlt, FaBook, FaMoon, FaSun, FaCodeBranch, 
  FaBullhorn, FaSyncAlt, FaLayerGroup, FaCheckCircle, FaExclamationCircle,
  FaRocket, FaUserGraduate
} from 'react-icons/fa';
import './GuestIndex.css';

const GuestIndex = () => {
  const [guestRoom, setGuestRoom] = useState(localStorage.getItem('guest_room') || 'room1');
  const [schedules, setSchedules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 1. จัดการ Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      setDarkMode(true);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      setDarkMode(false);
    }

    // 2. ดึงข้อมูลครั้งแรก
    fetchData();

    // 3. เปิดระบบ Real-time Subscription ของ Supabase
    const subscription = supabase.channel('guest_public_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_schedules' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submission_links' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchData())
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    // 4. ดักจับ Event Ctrl + F5
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'F5') {
        e.preventDefault(); 
        handleHardRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      supabase.removeChannel(subscription);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลตารางเรียน
      const { data: schData } = await supabase.from('class_schedules').select('*').eq('is_active', true);
      if (schData) setSchedules(schData);

      // ดึงข้อมูลงานที่ยังไม่หมดเขต
      const now = new Date().toISOString();
      const { data: assignData } = await supabase
        .from('assignments')
        .select('assignment_id, title, description, due_date, file_url, room_id, subjects ( course_code, course_name )')
        .gte('due_date', now)
        .order('due_date', { ascending: true });
      if (assignData) setAssignments(assignData);

      // ดึงลิงก์ส่งงาน
      const { data: linkData } = await supabase.from('submission_links').select('*').order('created_at', { ascending: false });
      if (linkData) setLinks(linkData);

      // ดึงประกาศข่าวสาร
      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (annData) setAnnouncements(annData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleHardRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const toggleDarkMode = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const currentSchedule = schedules.find(s => s.room_id === guestRoom);
  const filteredAssignments = assignments.filter(a => a.room_id === guestRoom);
  const filteredLinks = links.filter(l => l.room_id === guestRoom);
  const filteredAnnouncements = announcements.filter(a => a.room_id === guestRoom || a.room_id === 'all' || !a.room_id);
  const displayAssignments = filteredAssignments.slice(0, 4);
  const displayAnnouncements = filteredAnnouncements.slice(0, 4);

  if (loading && !isRefreshing) {
    return (
      <div className="preloader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="se-layout font-prompt">
      {/* 1. Hero Section */}
      <div className="hero-gradient-wrapper">
        <nav className="top-navbar">
          <div className="nav-brand">
            <img src="/logo-landing.jpg" alt="Logo" className="nav-logo" onError={(e) => { e.target.style.display = 'none' }} />
            <span className="nav-title">Software Engineering - RMUTL</span>
          </div>
          
          <div className="nav-actions">
            
            <button className={`icon-btn ${isRefreshing ? 'spin' : ''}`} onClick={handleHardRefresh} title="Hard Refresh">
              <FaSyncAlt />
            </button>
            <button className="icon-btn" onClick={toggleDarkMode}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            
            <Link to="/admin/login" className="login-link">
              Sign In <FaSignInAlt />
            </Link>
          </div>
        </nav>

        <div className="hero-split-container">
          <div className="hero-text-area">
            <h1 className="hero-heading">
              The best<br />
              class platform<br />
              for SE Gen.4
            </h1>
            <p className="hero-subtext">
              Manage your academic workflows, track assignments, and view class schedules seamlessly in one place.
            </p>
            
            <div className="hero-room-selector">
              <button 
                className={`room-btn ${guestRoom === 'room1' ? 'active' : ''}`} 
                onClick={() => setGuestRoom('room1')}
              >
                เทียบโอน (Room 1)
              </button>
              <button 
                className={`room-btn ${guestRoom === 'room2' ? 'active' : ''}`} 
                onClick={() => setGuestRoom('room2')}
              >
                ปกติ (Room 2)
              </button>
            </div>
          </div>

          <div className="hero-visual-area">
            <div className="visual-glow-backdrop"></div>
            
            <div className="visual-card card-terminal float-delay-1">
              <div className="terminal-header">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="terminal-body">
                <code>
                  <span className="code-keyword">import</span> {'{ SE }'} <span className="code-keyword">from</span> <span className="code-string">'@gen4/core'</span>;<br/>
                  <br/>
                  <span className="code-keyword">const</span> <span className="code-var">student</span> = <span className="code-keyword">await</span> SE.<span className="code-func">connect</span>();<br/>
                  <span className="code-func">console</span>.<span className="code-func">log</span>(<span className="code-string">"Ready to code!"</span>);
                </code>
              </div>
            </div>

            <div className="visual-card card-notification float-delay-2">
              <div className="notif-icon"><FaRocket /></div>
              <div className="notif-text">
                <strong>Next Deadline</strong>
                <span>in 2 days</span>
              </div>
            </div>

            <div className="visual-card card-profile float-delay-3">
              <div className="profile-icon"><FaUserGraduate /></div>
              <div className="profile-lines">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line long"></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Main Dashboard */}
      <main className="main-full-width">
        <div className="bento-layout">
          
          <div className="col-primary">
            
            <div className="content-card">
              <div className="card-top">
                <h3 className="card-title">Active Assignments</h3>
                <span className="card-limit">Latest {displayAssignments.length}</span>
              </div>
              <div className="card-body">
                {displayAssignments.length > 0 ? (
                  <div className="list-wrapper">
                    {displayAssignments.map(task => {
                      const due = new Date(task.due_date);
                      const isUrgent = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24)) <= 1;

                      return (
                        <div key={task.assignment_id} className="list-item">
                          <div className="item-info">
                            <div className={`status-indicator ${isUrgent ? 'red' : 'green'}`}>
                              {isUrgent ? <FaExclamationCircle /> : <FaCheckCircle />}
                            </div>
                            <div>
                              <h4 className="item-name">{task.title}</h4>
                              <span className="item-course"><FaBook /> {task.subjects?.course_code}</span>
                            </div>
                          </div>
                          <div className="item-meta">
                            <div className="due-date">
                              <FaClock /> {due.toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                            </div>
                            {task.file_url && (
                              <a href={task.file_url} className="download-btn"><FaFileAlt /></a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="blank-slate">No pending assignments.</div>
                )}
              </div>
            </div>

            <div className="content-card">
              <div className="card-top">
                <h3 className="card-title">System Announcements</h3>
                <span className="card-limit">Latest {displayAnnouncements.length}</span>
              </div>
              <div className="card-body">
                {displayAnnouncements.length > 0 ? (
                  <div className="feed-wrapper">
                    {displayAnnouncements.map(item => (
                      <div key={item.id} className="feed-post">
                        <div className="post-header">
                          <span className="post-type">{item.room_id === 'all' ? 'GLOBAL' : 'SYSTEM'}</span>
                          <span className="post-date">{new Date(item.created_at).toLocaleDateString('en-GB')}</span>
                        </div>
                        <h4 className="post-title">{item.title}</h4>
                        <p className="post-desc">{item.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="blank-slate">No announcements at this time.</div>
                )}
              </div>
            </div>

          </div>

          <div className="col-secondary">
            
            <div className="content-card">
              <div className="card-top">
                <h3 className="card-title">Schedule</h3>
              </div>
              <div className="card-body p-0">
                {currentSchedule ? (
                  <div className="schedule-img-box" onClick={() => setPreviewImage(currentSchedule.image_path)}>
                    <img src={currentSchedule.image_path} alt="Schedule" />
                    <div className="img-overlay">Expand</div>
                  </div>
                ) : (
                  <div className="blank-slate">No schedule available</div>
                )}
              </div>
            </div>

            <div className="content-card">
              <div className="card-top">
                <h3 className="card-title">Resources</h3>
              </div>
              <div className="card-body p-0">
                {filteredLinks.length > 0 ? (
                  <div className="link-wrapper">
                    {filteredLinks.map(link => (
                      <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="link-item">
                        {link.title} <FaExternalLinkAlt className="ext-icon" />
                      </a>
                    ))}
                  </div>
                ) : (
                   <div className="blank-slate">No resources available</div>
                )}
              </div>
            </div>

            <div className="content-card">
              <div className="card-top">
                <h3 className="card-title">Community & Learning</h3>
              </div>
              <div className="card-body p-0">
                <div className="link-wrapper">
                  <a href="https://www.borntodev.com/" target="_blank" rel="noreferrer" className="link-item">
                    BorntoDev <FaExternalLinkAlt className="ext-icon" />
                  </a>
                  <a href="https://www.freecodecamp.org/" target="_blank" rel="noreferrer" className="link-item">
                    freeCodeCamp <FaExternalLinkAlt className="ext-icon" />
                  </a>
                  <a href="https://milerdev.com/" target="_blank" rel="noreferrer" className="link-item">
                    MilerDev <FaExternalLinkAlt className="ext-icon" />
                  </a>
                  <a href="https://infinitestack.vercel.app/" target="_blank" rel="noreferrer" className="link-item">
                    InfiniteStack <FaExternalLinkAlt className="ext-icon" />
                  </a>
                  <a href="https://discord.com/invite/PxUTkBHZB" target="_blank" rel="noreferrer" className="link-item discord-link">
                    Community Discord <FaExternalLinkAlt className="ext-icon" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="main-footer">
        <p>
          <strong>&copy; {new Date().getFullYear()} <a href="https://fk-myportfolio.netlify.app/" target="_blank" rel="noreferrer" className="footer-link">Pattaradanai Saiwongkham</a>.</strong>
        </p>
        <p className="footer-version">Version 1.3.1 | All rights reserved.</p>
      </footer>

      {/* Modal View */}
      {previewImage && (
        <div className="fullscreen-modal" onClick={() => setPreviewImage(null)}>
          <div className="modal-content">
            <button className="close-btn">Close</button>
            <img src={previewImage} alt="Expanded" />
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestIndex;