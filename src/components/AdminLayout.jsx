import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  FaBars, FaExternalLinkAlt, FaSignOutAlt, 
  FaTachometerAlt, FaUsersCog, FaCalendarAlt, FaBook, 
  FaTable, FaClipboardList, FaUserCircle, FaLink,
  FaChartPie, FaFolderOpen, FaHistory, FaBookOpen, FaReceipt, FaBullhorn
} from 'react-icons/fa'

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState(null)
  const [imageError, setImageError] = useState(false)

  const [activeRoom, setActiveRoom] = useState(localStorage.getItem('active_room') || null)

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const loadUser = () => {
      const storedUser = localStorage.getItem('se_user');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        navigate('/admin/login');
      }
    };

    loadUser();
    window.addEventListener('userUpdated', loadUser);
    return () => window.removeEventListener('userUpdated', loadUser);
  }, [navigate]);

  useEffect(() => {
    if (currentUser && !activeRoom && location.pathname !== '/admin/portal') {
      navigate('/admin/portal');
    }
  }, [currentUser, activeRoom, navigate, location.pathname]);

  useEffect(() => {
    const handleIdleLogout = () => {
      localStorage.removeItem('se_user');
      localStorage.removeItem('active_room'); 
      alert('เซสชันหมดอายุ! คุณไม่ได้ใช้งานระบบเกิน 5 นาที กรุณาเข้าสู่ระบบใหม่เพื่อความปลอดภัย');
      navigate('/admin/login');
    };

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleIdleLogout, 5 * 60 * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [navigate]);

  useEffect(() => {
    setImageError(false);
  }, [currentUser?.avatar_url]);

  const handleLogout = () => {
    localStorage.removeItem('se_user');
    localStorage.removeItem('active_room'); 
    navigate('/admin/login')
  }

  const handleRoomChange = (e) => {
    const room = e.target.value;
    setActiveRoom(room);
    localStorage.setItem('active_room', room);
  }

  if (!currentUser) return <div className="flex h-screen bg-[#f4f7fa] dark:bg-slate-900 items-center justify-center dark:text-white">กำลังโหลดระบบ...</div>;

  const initial = currentUser.username.charAt(0).toUpperCase();
  const isSuperAdmin = currentUser.role === 'super_admin';
  const hasMultipleRooms = currentUser.room_access === 'all'; 

  return (
    <div className="flex h-screen bg-[#f4f7fa] dark:bg-slate-900 font-prompt overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className={`bg-slate-800 dark:bg-slate-950 text-slate-300 flex flex-col transition-all duration-300 z-20 shrink-0 ${isSidebarOpen ? 'w-64' : 'w-0 md:w-20'} overflow-hidden shadow-xl`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-700/50 shrink-0 px-4">
          <img src="/logo.PNG" alt="Logo" className="h-8 w-auto object-contain rounded shrink-0 md:mr-2" onError={(e) => { e.target.style.display = 'none'; }} />
          <span className={`font-bold text-lg text-white whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            SE-JOB Admin
          </span>
        </div>

        <div className={`p-4 border-b border-slate-700/50 flex items-center ${!isSidebarOpen && 'md:justify-center'}`}>
          {currentUser.avatar_url && !imageError ? (
            <img
              src={currentUser.avatar_url}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover shadow-md shrink-0 border-2 border-slate-700"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
              {initial}
            </div>
          )}
          <div className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            <div className="font-bold text-white leading-tight">@{currentUser.username}</div>
            <div className={`text-[0.7rem] px-2 py-0.5 rounded mt-1 inline-block border ${isSuperAdmin ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 'bg-slate-500/20 text-slate-300 border-slate-500/20'}`}>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <ul className="space-y-1 px-2">
            <li>
              <NavLink to="/admin/dashboard" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaTachometerAlt className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>ภาพรวม (Dashboard)</span>
              </NavLink>
            </li>

            {isSuperAdmin && (
              <>
                <li className={`px-3 pt-4 pb-2 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider ${!isSidebarOpen && 'hidden'}`}>ตั้งค่าระบบ</li>
                <li>
                  <NavLink to="/admin/announcements" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-sky-600 text-white shadow-md' : 'text-sky-400 hover:bg-slate-700/50 hover:text-sky-300'}`}>
                    <FaBullhorn className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                    <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>จัดการประกาศ</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/users" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-red-600 text-white shadow-md' : 'text-red-400 hover:bg-slate-700/50 hover:text-red-300'}`}>
                    <FaUsersCog className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                    <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>จัดการผู้ใช้งาน</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/semesters" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                    <FaCalendarAlt className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                    <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>จัดการภาค/เทอม</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/subjects" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                    <FaBook className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                    <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>จัดการรายวิชา</span>
                  </NavLink>
                </li>
                
                <li>
                  <NavLink to="/admin/statement" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                    <FaReceipt className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                    <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>ตรวจสอบการโอนเงิน</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink to="/admin/activity-log" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                    <FaHistory className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                    <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>บันทึกกิจกรรมระบบ</span>
                  </NavLink>
                </li>
              </>
            )}

            <li className={`px-3 pt-4 pb-2 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider ${!isSidebarOpen && 'hidden'}`}>การจัดการงาน</li>
            
            <li>
              <NavLink to="/admin/submission-tracking" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaChartPie className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>ติดตามสถานะส่งงาน</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/admin/schedules" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaTable className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>ตารางเรียน</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/assignments" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaClipboardList className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>งานภายในรายวิชา</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/admin/AdminWeeklyMaterials" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaClipboardList className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>ข้อมูลชีท (Sheet Data)</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/admin/links" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaLink className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>ลิ้งก์ส่งงาน</span>
              </NavLink>
            </li>

            <li className={`px-3 pt-4 pb-2 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider ${!isSidebarOpen && 'hidden'}`}>ศูนย์ช่วยเหลือ</li>
            <li>
              <NavLink to="/admin/resource-center" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaFolderOpen className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>คลังเอกสารกลาง</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/manual" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaBookOpen className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>คู่มือการใช้งาน</span>
              </NavLink>
            </li>

            <li className={`px-3 pt-4 pb-2 text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider ${!isSidebarOpen && 'hidden'}`}>บัญชีของฉัน</li>
            <li>
              <NavLink to="/admin/profile" className={({isActive}) => `flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-700/50 hover:text-white'}`}>
                <FaUserCircle className={`shrink-0 ${isSidebarOpen ? 'mr-3' : 'md:mx-auto'}`} />
                <span className={`${isSidebarOpen ? 'block' : 'hidden'} whitespace-nowrap`}>โปรไฟล์ & ตั้งค่า</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="h-16 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-between px-4 z-10 shrink-0 border-b border-transparent dark:border-slate-700 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
              <FaBars />
            </button>
            <Link to="/" target="_blank" className="hidden sm:flex items-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
              <FaExternalLinkAlt className="mr-2" /> ดูหน้าเว็บผู้เข้าชม
            </Link>

            {hasMultipleRooms && (
              <div className="hidden md:flex items-center ml-4 bg-slate-100 dark:bg-slate-700 rounded-lg px-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-2">พื้นที่:</span>
                <select
                  value={activeRoom || ''}
                  onChange={handleRoomChange}
                  className="bg-transparent text-slate-800 dark:text-white text-sm border-none rounded-lg px-3 py-1.5 font-semibold focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="room1">ห้องเทียบโอน</option>
                  <option value="room2">ห้องปกติ 4 ปี</option>
                </select>
              </div>
            )}
            {!hasMultipleRooms && activeRoom && (
              <div className="hidden md:flex items-center ml-4 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-semibold border border-indigo-100 dark:border-indigo-800/50">
                {activeRoom === 'room1' ? 'ห้องเทียบโอน' : 'ห้องปกติ 4 ปี'}
              </div>
            )}
          </div>
          
          <button onClick={handleLogout} className="flex items-center text-red-500 font-semibold text-sm hover:text-red-700 dark:hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
            <FaSignOutAlt className="mr-2" /> ออกจากระบบ
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 text-slate-800 dark:text-slate-200">
          <Outlet context={{ activeRoom }} />
        </main>

        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 p-4 flex flex-col items-center shrink-0 transition-colors duration-300">
          <div>
            <strong>&copy; {new Date().getFullYear()} Pattaradanai Saiwongkham.</strong> All rights reserved.
          </div>
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-3">
            <span>Version 1.3.2 | Updated 24-07-2569 23:20</span>
            <span>|</span>
            <Link to="/admin/privacy-policy" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link to="/admin/license" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">License Agreement</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
export default AdminLayout