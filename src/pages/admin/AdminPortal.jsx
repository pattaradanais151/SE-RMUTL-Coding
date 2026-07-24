import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUserGraduate, FaChalkboardTeacher, FaExclamationCircle, FaTimes } from 'react-icons/fa'

const AdminPortal = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  
  const [toast, setToast] = useState({ visible: false, message: '' })
  const toastTimeout = useRef(null)

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('se_user')
    if (!userStr) {
      navigate('/admin/login')
      return
    }

    const parsedUser = JSON.parse(userStr)
    setCurrentUser(parsedUser)
  }, [navigate])

  const showNotification = (message) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ visible: true, message })
    toastTimeout.current = setTimeout(() => {
      setToast({ visible: false, message: '' })
    }, 3500) 
  }

  const handleSelectRoom = (room) => {
    const access = currentUser?.room_access || 'all'

    if (access === 'all' || access === room) {
      localStorage.setItem('active_room', room)
      navigate('/admin/dashboard')
    } else {
      const roomName = room === 'room1' ? 'ห้อง 1 (เทียบโอน)' : 'ห้อง 2 (ปกติ 4 ปี)'
      showNotification(`Access Denied! คุณไม่มีสิทธิ์เข้าจัดการข้อมูลของ ${roomName}`)
    }
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0B1120] font-prompt relative overflow-hidden transition-colors duration-500">
      
      {/* 🔮 Premium Ambient Glows (Glassmorphism Background) */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] bg-cyan-500/10 dark:bg-cyan-600/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* 🔴 Minimalist Toast Notification */}
      <div 
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-6 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-rose-200 dark:border-rose-500/30 shadow-[0_10px_40px_rgba(225,29,72,0.15)] rounded-full px-6 py-3.5 flex items-center gap-4 min-w-[340px]">
          <FaExclamationCircle className="text-rose-500 text-xl animate-bounce shrink-0" />
          <div className="flex-1">
            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">การเข้าถึงถูกปฏิเสธ</span>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</span>
          </div>
          <button 
            onClick={() => setToast({ visible: false, message: '' })}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="max-w-5xl w-full px-6 relative z-10 animate-fade-in flex flex-col items-center">
        
        {/* 📝 Header Section */}
        <div className="text-center mb-16 relative">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight leading-tight">
            ยินดีต้อนรับคุณ <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
              {currentUser.username}
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
            กรุณาเลือกพื้นที่การทำงานที่คุณต้องการจัดการ เพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* 🗂️ Cards Section (Liquid Glass Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 w-full">
          
          {/* Card: Room 1 */}
          <button 
            onClick={() => handleSelectRoom('room1')}
            className="group relative flex flex-col items-center justify-center p-12 md:p-14 bg-white/40 dark:bg-slate-800/30 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_20px_40px_rgba(56,189,248,0.12)] transition-all duration-500 hover:-translate-y-2 overflow-hidden w-full focus:outline-none"
          >
            {/* Inner Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            {/* Animated Bottom Line */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

            {/* Icon Wrapper */}
            <div className="relative z-10 w-24 h-24 bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <FaUserGraduate className="text-4xl text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors duration-300" />
            </div>
            
            <h2 className="relative z-10 text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-3 tracking-wide transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">
              ห้อง 1 (เทียบโอน)
            </h2>
            <p className="relative z-10 text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium">
              จัดการข้อมูลหลักสูตร ปวส. เทียบโอน
            </p>
          </button>

          {/* Card: Room 2 */}
          <button 
            onClick={() => handleSelectRoom('room2')}
            className="group relative flex flex-col items-center justify-center p-12 md:p-14 bg-white/40 dark:bg-slate-800/30 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_20px_40px_rgba(52,211,153,0.12)] transition-all duration-500 hover:-translate-y-2 overflow-hidden w-full focus:outline-none"
          >
            {/* Inner Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            {/* Animated Bottom Line */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

            {/* Icon Wrapper */}
            <div className="relative z-10 w-24 h-24 bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
              <FaChalkboardTeacher className="text-4xl text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors duration-300" />
            </div>
            
            <h2 className="relative z-10 text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-3 tracking-wide transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
              ห้อง 2 (ปกติ 4 ปี)
            </h2>
            <p className="relative z-10 text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium">
              จัดการข้อมูลหลักสูตรปริญญาตรี ปกติ
            </p>
          </button>

        </div>
      </div>
      
      {/* 🌟 Custom Animation Style for Ambient Glows */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}

export default AdminPortal