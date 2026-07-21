import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaUserGraduate, FaChalkboardTeacher, FaExclamationCircle, FaTimes } from 'react-icons/fa'

const AdminPortal = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  
  // 🟢 State สำหรับ Custom Notification
  const [toast, setToast] = useState({ visible: false, message: '' })
  const toastTimeout = useRef(null)

  // 🟢 ตรวจสอบ Theme ให้ตรงกับระบบ
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
    
    // ❌ เอาโค้ดที่เคยให้ Auto-redirect ออก เพื่อให้ทุกคนได้เห็นหน้า Portal
  }, [navigate])

  // 🟢 ฟังก์ชันแสดง Custom Notification
  const showNotification = (message) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ visible: true, message })
    toastTimeout.current = setTimeout(() => {
      setToast({ visible: false, message: '' })
    }, 3500) // หายไปเองใน 3.5 วินาที
  }

  // 🟢 ฟังก์ชันตรวจสอบสิทธิ์และเลือกห้อง
  const handleSelectRoom = (room) => {
    const access = currentUser?.room_access || 'all'

    if (access === 'all' || access === room) {
      // มีสิทธิ์เข้าได้
      localStorage.setItem('active_room', room)
      navigate('/admin/dashboard')
    } else {
      // ไม่มีสิทธิ์ โชว์ Custom Notification
      const roomName = room === 'room1' ? 'ห้อง 1 (เทียบโอน)' : 'ห้อง 2 (ปกติ 4 ปี)'
      showNotification(`Access Denied! คุณไม่มีสิทธิ์เข้าจัดการข้อมูลของ ${roomName}`)
    }
  }

  // รอให้ดึงข้อมูลจาก localStorage เสร็จก่อน
  if (!currentUser) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#090D14] font-prompt relative overflow-hidden transition-colors duration-500">
      
      {/* 🔮 Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[100px] md:blur-[150px] mix-blend-screen pointer-events-none transition-all duration-1000 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-emerald-600/10 dark:bg-emerald-600/20 rounded-full blur-[100px] md:blur-[150px] mix-blend-screen pointer-events-none transition-all duration-1000 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* 🔴 Custom Notification Toast */}
      <div 
        className={`fixed top-8 right-1/2 translate-x-1/2 md:translate-x-0 md:right-8 z-50 transition-all duration-500 ease-out flex items-center shadow-[0_10px_40px_rgba(225,29,72,0.2)] ${
          toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-l-4 border-rose-500 border-y border-r border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 max-w-sm w-max min-w-[320px]">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
            <FaExclamationCircle className="text-xl text-rose-600 dark:text-rose-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">การเข้าถึงถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast({ visible: false, message: '' })}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="max-w-4xl w-full px-6 relative z-10 animate-fade-in">
        
        {/* 📝 Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
            ยินดีต้อนรับคุณ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-indigo-400 dark:to-cyan-300">{currentUser.username}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">กรุณาเลือกพื้นที่การทำงานที่คุณต้องการจัดการ</p>
        </div>

        {/* 🗂️ Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Card: Room 1 */}
          <button 
            onClick={() => handleSelectRoom('room1')}
            className="group relative flex flex-col items-center justify-center p-10 bg-white/70 dark:bg-[#161B22]/80 backdrop-blur-2xl rounded-3xl shadow-lg hover:shadow-2xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] border border-slate-200 dark:border-white/5 transition-all duration-500 hover:-translate-y-2 overflow-hidden focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
          >
            {/* Glowing Bottom Line */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-80 group-hover:opacity-100 group-hover:h-2 transition-all duration-300"></div>
            
            {/* Inner Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="relative z-10 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <FaUserGraduate className="text-4xl text-indigo-600 dark:text-indigo-400 drop-shadow-md" />
            </div>
            
            <h2 className="relative z-10 text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-wide transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
              ห้อง 1 (เทียบโอน)
            </h2>
            <p className="relative z-10 text-slate-500 dark:text-slate-400 text-sm font-medium">
              จัดการข้อมูลหลักสูตร ปวส. เทียบโอน
            </p>
          </button>

          {/* Card: Room 2 */}
          <button 
            onClick={() => handleSelectRoom('room2')}
            className="group relative flex flex-col items-center justify-center p-10 bg-white/70 dark:bg-[#161B22]/80 backdrop-blur-2xl rounded-3xl shadow-lg hover:shadow-2xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] border border-slate-200 dark:border-white/5 transition-all duration-500 hover:-translate-y-2 overflow-hidden focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
          >
            {/* Glowing Bottom Line */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-600 opacity-80 group-hover:opacity-100 group-hover:h-2 transition-all duration-300"></div>
            
            {/* Inner Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="relative z-10 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <FaChalkboardTeacher className="text-4xl text-emerald-600 dark:text-emerald-400 drop-shadow-md" />
            </div>
            
            <h2 className="relative z-10 text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-wide transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
              ห้อง 2 (ปกติ 4 ปี)
            </h2>
            <p className="relative z-10 text-slate-500 dark:text-slate-400 text-sm font-medium">
              จัดการข้อมูลหลักสูตรปริญญาตรี ปกติ
            </p>
          </button>

        </div>
      </div>
      
      {/* 🌟 Custom Animation Style */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default AdminPortal