import { useState, useEffect } from 'react'
import { FaChartPie, FaCheckCircle, FaTimesCircle, FaSearch, FaUserCheck, FaUserTimes, FaTimes, FaSpinner, FaUsers } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import { useOutletContext } from 'react-router-dom'

const AdminSubmissionTracking = () => {
  const { activeRoom } = useOutletContext(); 

  const [assignments, setAssignments] = useState([])
  const [stats, setStats] = useState({ submitted: 0, missing: 0, totalStudents: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [modalUsers, setModalUsers] = useState([])
  const [loadingModal, setLoadingModal] = useState(false)
  const currentUser = JSON.parse(localStorage.getItem('se_user') || '{}');

  useEffect(() => {
    if (activeRoom) fetchTrackingData()
  }, [activeRoom])

  const fetchTrackingData = async () => {
    setLoading(true)
    
    // หาจำนวนนักเรียนที่สามารถเข้าห้องนี้ได้
    const { data: usersData } = await supabase.from('users').select('*')
    const validUsers = usersData ? usersData.filter(u => u.room_access === 'all' || u.room_access === activeRoom) : [];
    const totalUsers = validUsers.length || 1; 

    // ดึงงานเฉพาะของห้องที่เลือก
    const { data: assignData } = await supabase
      .from('assignments')
      .select(`*, subjects(course_code, course_name), submissions(count)`)
      .eq('room_id', activeRoom)
      .order('created_at', { ascending: false })

    if (assignData) {
      setAssignments(assignData)
      let totalSubmissions = 0;
      assignData.forEach(a => { totalSubmissions += (a.submissions[0]?.count || 0) })
      
      setStats({
        submitted: totalSubmissions,
        totalStudents: totalUsers,
        missing: (assignData.length * totalUsers) - totalSubmissions
      })
    }
    setLoading(false)
  }

  const openTrackingModal = async (assignment) => {
    setSelectedAssignment(assignment)
    setLoadingModal(true)

    const { data: allUsers } = await supabase.from('users').select('*').order('username')
    const { data: subs } = await supabase.from('submissions').select('student_id').eq('assignment_id', assignment.assignment_id)
    const submittedIds = subs ? subs.map(s => s.student_id) : []

    if (allUsers) {
      const roomUsers = allUsers.filter(u => u.room_access === 'all' || u.room_access === activeRoom);
      const mappedUsers = roomUsers.map(user => {
        const identifier = user.username; 
        return {
          ...user,
          isSubmitted: submittedIds.includes(identifier)
        }
      })
      setModalUsers(mappedUsers)
    }
    setLoadingModal(false)
  }

  const toggleSubmissionStatus = async (user, currentStatus) => {
    const studentIdentifier = user.username; 

    // Optimistic UI update
    setModalUsers(prev => prev.map(u => u.username === user.username ? { ...u, isSubmitted: !currentStatus } : u))

    if (currentStatus) {
      await supabase.from('submissions').delete().match({ assignment_id: selectedAssignment.assignment_id, student_id: studentIdentifier })
      sendDiscordNotify('ติดตามสถานะการส่งงาน', 'DELETE', `ยกเลิกการส่งงาน: @${user.username} (งาน: ${selectedAssignment.title})`, currentUser.username)
    } else {
      await supabase.from('submissions').insert([{ assignment_id: selectedAssignment.assignment_id, student_id: studentIdentifier }])
      sendDiscordNotify('ติดตามสถานะการส่งงาน', 'CREATE', `ยืนยันการส่งงาน: @${user.username} (งาน: ${selectedAssignment.title})`, currentUser.username)
    }
    
    // Refresh data in background to update charts/stats
    fetchTrackingData()
  }

  const filteredAssignments = assignments.filter(a => 
    (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.subjects?.course_code && a.subjects.course_code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    // 🟢 บังคับ w-full และ overflow-x-hidden ป้องกันสไลด์ซ้ายขวาเด็ดขาด
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
            <FaChartPie size={20} />
          </div>
          ติดตามสถานะการส่งงาน (Manual)
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base ml-[52px]">
          ตรวจสอบและบันทึกการส่งงานของนักศึกษาในแต่ละรายวิชา
        </p>
      </div>

      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-indigo-100 text-sm font-semibold mb-1 opacity-90">จำนวนงานทั้งหมดในระบบ</p>
          <h2 className="text-4xl font-black">{assignments.length} <span className="text-lg font-medium opacity-80">งาน</span></h2>
        </div>
        
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 dark:border-slate-700/50 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-0.5">ยอดติ๊กส่งงานรวม</p>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{stats.submitted} <span className="text-sm font-medium text-slate-500">ครั้ง</span></h2>
          </div>
        </div>
        
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 dark:border-slate-700/50 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            <FaTimesCircle />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-0.5">ยอดค้างส่งโดยประมาณ</p>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{stats.missing} <span className="text-sm font-medium text-slate-500">รายการ</span></h2>
          </div>
        </div>
      </div>

      {/* 🗂️ Data Table Card */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden flex flex-col min-h-[400px]">
        
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h4 className="font-extrabold text-slate-800 dark:text-white text-lg">รายการงานทั้งหมด</h4>
          <div className="relative w-full sm:w-80">
             <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="ค้นหารหัสวิชา หรือ ชื่องาน..." 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)} 
               className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-inner" 
             />
          </div>
        </div>

        <div className="flex-1 p-0 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-100/50 dark:bg-slate-700/30">
              <tr>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 w-32">วิชา</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">ชื่องาน</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center w-56">สถานะการส่ง</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center w-40">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-16 dark:text-slate-400">
                    <FaSpinner className="animate-spin text-3xl text-indigo-500 mx-auto mb-3" />
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-16 text-slate-400 dark:text-slate-500">
                    <FaChartPie className="text-5xl mx-auto mb-3 opacity-20" />
                    ไม่พบข้อมูลงานที่ตรงกับการค้นหา
                  </td>
                </tr>
              ) : filteredAssignments.map(a => {
                const subCount = a.submissions[0]?.count || 0;
                const percent = stats.totalStudents > 0 ? Math.min((subCount / stats.totalStudents) * 100, 100).toFixed(0) : 0;

                let progressColor = 'from-rose-400 to-rose-500';
                if (percent >= 80) progressColor = 'from-emerald-400 to-emerald-500';
                else if (percent >= 40) progressColor = 'from-amber-400 to-orange-500';

                return (
                  <tr key={a.assignment_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="inline-block bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm">
                        {a.subjects?.course_code || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-white text-sm max-w-[300px] truncate" title={a.title}>
                        {a.title}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2 mb-1.5 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500 ease-out`} 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {percent}% ({subCount}/{stats.totalStudents} คน)
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => openTrackingModal(a)} 
                        className="w-full bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white border border-indigo-200 dark:border-indigo-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <FaUsers /> เช็คงาน
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔍 Modal ดูรายชื่อและเช็คงาน (Glassmorphism Style) */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedAssignment(null)}></div>
          
          <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-white/50 dark:border-slate-700/50 animate-fade-in overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-xl flex items-center gap-2">
                  <FaUserCheck className="text-indigo-500" /> เช็ครายชื่อผู้ส่งงาน
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                  วิชา: <span className="text-indigo-600 dark:text-indigo-400">{selectedAssignment.subjects?.course_code}</span> <br className="sm:hidden" />
                  <span className="hidden sm:inline"> - </span> งาน: {selectedAssignment.title}
                </p>
              </div>
              <button 
                onClick={() => setSelectedAssignment(null)} 
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
              >
                <FaTimes />
              </button>
            </div>
            
            {/* Modal Body (List) */}
            <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
              {loadingModal ? (
                <div className="py-24 text-center text-slate-500 flex flex-col items-center">
                  <FaSpinner className="animate-spin text-4xl text-indigo-500 mb-4" />
                  กำลังโหลดรายชื่อผู้เรียน...
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="py-24 text-center text-slate-500">ไม่พบรายชื่อผู้เรียนในห้องนี้</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {modalUsers.map(user => {
                    // สร้างชื่อที่จะแสดง (ใช้ Name + Surname ถ้ามี)
                    const displayName = user.name && user.surname 
                      ? `${user.name} ${user.surname}` 
                      : user.full_name || user.username;

                    return (
                      <div key={user.username} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm border-2 border-white dark:border-slate-800 transition-colors ${user.isSubmitted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                             {user.isSubmitted ? <FaCheckCircle /> : user.username.charAt(0).toUpperCase()}
                           </div>
                           <div className="overflow-hidden">
                             <div className="font-bold text-slate-800 dark:text-white text-base truncate max-w-[200px] sm:max-w-[250px]" title={displayName}>
                               {displayName}
                             </div>
                             <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">@{user.username}</div>
                           </div>
                        </div>
                        
                        <button 
                          onClick={() => toggleSubmissionStatus(user, user.isSubmitted)}
                          className={`flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border shrink-0 ${
                            user.isSubmitted 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600 border-emerald-200 hover:border-rose-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 dark:hover:border-rose-500/30' 
                              : 'bg-white text-slate-500 hover:bg-emerald-500 hover:text-white border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-emerald-600 dark:hover:border-emerald-500'
                          }`}
                        >
                          {user.isSubmitted ? (
                             <> <FaCheckCircle className="mr-2 text-lg" /> ส่งแล้ว (คลิกเพื่อยกเลิก) </>
                          ) : (
                             <> <FaUserTimes className="mr-2 text-lg opacity-50" /> ยังไม่ส่ง (คลิกรับงาน) </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 shrink-0 text-center">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                ข้อมูลจะถูกบันทึกลงฐานข้อมูลอัตโนมัติเมื่อกดปุ่มสถานะ
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminSubmissionTracking;