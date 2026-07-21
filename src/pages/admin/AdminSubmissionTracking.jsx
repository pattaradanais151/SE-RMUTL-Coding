import { useState, useEffect } from 'react'
import { FaChartPie, FaCheckCircle, FaTimesCircle, FaSearch, FaUserCheck, FaUserTimes, FaTimes } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import { useOutletContext } from 'react-router-dom' // 🟢

const AdminSubmissionTracking = () => {
  const { activeRoom } = useOutletContext(); // 🟢 รับค่าห้อง

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
    
    // 🟢 หาจำนวนนักเรียน (users) ที่สามารถเข้าห้องนี้ได้ หรือมีสิทธิ์ทั้งหมด (all)
    const { data: usersData } = await supabase.from('users').select('*')
    const validUsers = usersData ? usersData.filter(u => u.room_access === 'all' || u.room_access === activeRoom) : [];
    const totalUsers = validUsers.length || 1; 

    // 🟢 ดึงงานเฉพาะของห้องที่เลือก
    const { data: assignData } = await supabase
      .from('assignments')
      .select(`*, subjects(course_code, course_name), submissions(count)`)
      .eq('room_id', activeRoom) // 🟢 กรองตามห้อง
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
      // 🟢 นำรายชื่อเฉพาะที่เข้าถึงห้องนี้มาแสดงให้เช็คชื่อ
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

    setModalUsers(prev => prev.map(u => u.username === user.username ? { ...u, isSubmitted: !currentStatus } : u))

    if (currentStatus) {
      await supabase.from('submissions').delete().match({ assignment_id: selectedAssignment.assignment_id, student_id: studentIdentifier })
      sendDiscordNotify('ติดตามสถานะการส่งงาน', 'DELETE', `ยกเลิกการส่งงาน: @${user.username} (งาน: ${selectedAssignment.title})`, currentUser.username)
    } else {
      await supabase.from('submissions').insert([{ assignment_id: selectedAssignment.assignment_id, student_id: studentIdentifier }])
      sendDiscordNotify('ติดตามสถานะการส่งงาน', 'CREATE', `ยืนยันการส่งงาน: @${user.username} (งาน: ${selectedAssignment.title})`, currentUser.username)
    }
    
    fetchTrackingData()
  }

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.subjects?.course_code && a.subjects.course_code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto relative">
      <div className="mb-6">
        <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
          <FaChartPie className="text-indigo-600 dark:text-indigo-400 mr-3" /> ติดตามสถานะการส่งงาน (Manual)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-indigo-500 text-white rounded-2xl shadow p-5">
          <p className="text-indigo-100 text-sm font-medium">จำนวนงานทั้งหมดในระบบ</p>
          <h2 className="text-3xl font-bold mt-1 text-white">{assignments.length} งาน</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 flex items-center border border-slate-100 dark:border-slate-700">
          <FaCheckCircle className="text-4xl text-emerald-500 mr-4" />
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">ยอดติ๊กส่งงานรวม</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.submitted} <span className="text-base font-normal">ครั้ง</span></h2>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 flex items-center border border-slate-100 dark:border-slate-700">
          <FaTimesCircle className="text-4xl text-red-500 mr-4" />
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">ยอดค้างส่งโดยประมาณ</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.missing} <span className="text-base font-normal">รายการ</span></h2>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden transition-colors border border-transparent dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h4 className="font-bold text-slate-700 dark:text-slate-200">รายการงานทั้งหมด</h4>
          <div className="relative w-full sm:w-auto">
             <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="ค้นหารหัสวิชา หรือ ชื่องาน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white" />
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-700/30">
              <tr>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 border-b dark:border-slate-700 w-32">วิชา</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 border-b dark:border-slate-700">ชื่องาน</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 border-b dark:border-slate-700 text-center w-48">สถานะการส่ง</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 border-b dark:border-slate-700 text-center w-40">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td col colSpan="4" className="text-center py-10 text-slate-500">กำลังโหลดข้อมูล...</td></tr>
              ) : filteredAssignments.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-10 text-slate-400">ไม่พบข้อมูลงานในห้องนี้</td></tr>
              ) : filteredAssignments.map(a => {
                const subCount = a.submissions[0]?.count || 0;
                const percent = stats.totalStudents > 0 ? Math.min((subCount / stats.totalStudents) * 100, 100).toFixed(0) : 0;

                return (
                  <tr key={a.assignment_id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-5 text-slate-800 dark:text-white font-medium">{a.subjects?.course_code}</td>
                    <td className="py-3 px-5 text-slate-800 dark:text-white">{a.title}</td>
                    <td className="py-3 px-5 text-center">
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mb-1 overflow-hidden">
                        <div className={`h-2.5 rounded-full ${percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${percent}%` }}></div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{percent}% ({subCount}/{stats.totalStudents} คน)</span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <button onClick={() => openTrackingModal(a)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm">
                        ดูรายชื่อและเช็คงาน
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* โมดัลแสดงรายชื่อผู้ใช้เพื่อเช็คงาน */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl border border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-2xl">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-lg">เช็ครายชื่อผู้ส่งงาน (Manual)</h4>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1">{selectedAssignment.subjects?.course_code} - {selectedAssignment.title}</p>
              </div>
              <button onClick={() => setSelectedAssignment(null)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 text-slate-500 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-600 transition-all"><FaTimes /></button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
              {loadingModal ? (
                <div className="py-20 text-center text-slate-500">กำลังดึงรายชื่อผู้ใช้ทั้งหมด...</div>
              ) : modalUsers.length === 0 ? (
                <div className="py-20 text-center text-slate-500">ไม่พบรายชื่อผู้เรียนในห้องนี้</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {modalUsers.map(user => (
                    <div key={user.username} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${user.isSubmitted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                           {user.isSubmitted ? <FaCheckCircle /> : user.username.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <div className="font-bold text-slate-800 dark:text-white text-base">@{user.username}</div>
                           <div className="text-sm text-slate-500">{user.full_name || 'ไม่ได้ระบุชื่อจริง'}</div>
                         </div>
                      </div>
                      <button 
                        onClick={() => toggleSubmissionStatus(user, user.isSubmitted)}
                        className={`flex items-center justify-center w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                          user.isSubmitted 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-600 border border-emerald-200 hover:border-red-200' 
                            : 'bg-white text-slate-600 hover:bg-emerald-500 hover:text-white border border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-emerald-600 dark:hover:border-emerald-500'
                        }`}
                      >
                        {user.isSubmitted ? (
                           <> <FaUserCheck className="mr-2 text-lg" /> ส่งงานแล้ว (กดยกเลิก) </>
                        ) : (
                           <> <FaUserTimes className="mr-2 text-lg opacity-50" /> ยังไม่ส่ง (คลิกเพื่อรับงาน) </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-2xl text-center">
              <p className="text-xs text-slate-500">ข้อมูลจะถูกบันทึกอัตโนมัติเมื่อกดปุ่ม</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminSubmissionTracking