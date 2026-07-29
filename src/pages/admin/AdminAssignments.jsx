import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { FaClipboardList, FaPlus, FaTrash, FaPen, FaBoxOpen, FaEye, FaUsers, FaSpinner, FaFileAlt, FaClock, FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import ExternalLink from '../../components/ExternalLink'

const AdminAssignments = () => {
  const { activeRoom } = useOutletContext()
  const [assignments, setAssignments] = useState([])
  const [semesters, setSemesters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filterSemester, setFilterSemester] = useState('0')
  const [filterSubject, setFilterSubject] = useState('0')
  const [loading, setLoading] = useState(true)

  const [detailModal, setDetailModal] = useState(null)

  const currentUser = JSON.parse(localStorage.getItem('se_user') || '{}')

  useEffect(() => {
    if (activeRoom) {
      fetchOptions(); 
      fetchAssignments();
    }
    
    const subscription = supabase.channel('public:assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        if (activeRoom) fetchAssignments();
      })
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, [filterSemester, filterSubject, activeRoom])

  const fetchOptions = async () => {
    const { data: semData } = await supabase.from('semesters').select('*').eq('room_id', activeRoom).order('academic_year', { ascending: false })
    const { data: subData } = await supabase.from('subjects').select('*').eq('room_id', activeRoom).order('course_code', { ascending: true })
    if(semData) setSemesters(semData); if(subData) setSubjects(subData);
  }

  const fetchAssignments = async () => {
    setLoading(true)
    let query = supabase.from('assignments').select(`
      assignment_id, title, description, due_date, file_url, created_at,
      subjects ( course_code, course_name, day_of_week ),
      semesters ( academic_year, term_type )
    `).eq('room_id', activeRoom).order('due_date', { ascending: true })

    if (filterSemester !== '0') query = query.eq('semester_id', filterSemester)
    if (filterSubject !== '0') query = query.eq('subject_id', filterSubject)
    const { data, error } = await query
    if (!error && data) setAssignments(data)
    setLoading(false)
  }

  const handleDelete = async (id, title) => {
    if (window.confirm('คุณต้องการลบงานนี้ใช่หรือไม่?')) {
      const { error } = await supabase.from('assignments').delete().eq('assignment_id', id).eq('room_id', activeRoom)
      if (!error) {
        sendDiscordNotify('งานภายในรายวิชา', 'DELETE', `ลบงาน: ${title} (${activeRoom})`, currentUser.username)
      }
    }
  }

  return (
    // 🟢 ใส่ overflow-x-hidden ป้องกันสไลด์ซ้าย-ขวา 100%
    <div className="w-full max-w-7xl mx-auto relative animate-fade-in font-prompt overflow-x-hidden pb-12">
      
      {/* 🔮 Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      {/* 📝 Header Section */}
      <div className="relative z-10 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <h3 className="m-0 font-extrabold text-slate-800 dark:text-white text-2xl md:text-3xl flex items-center mb-2 tracking-tight">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl mr-3 shadow-lg shadow-indigo-500/30">
              <FaClipboardList size={20} />
            </div>
            งานภายในรายวิชา
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base ml-[52px]">
            จัดการรายการงานที่มอบหมายให้นักศึกษาในแต่ละรายวิชา
          </p>
        </div>

        <Link to="/admin/assignments/create" className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl px-6 py-3.5 shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 w-full md:w-auto">
          <FaPlus className="mr-2" /> สร้างงานใหม่
        </Link>
      </div>

      {/* 🔍 Filter Section */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-5 md:p-6 rounded-3xl border border-white/50 dark:border-slate-700/50 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col md:flex-row gap-5">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">กรองตามภาคเรียน</label>
          <select value={filterSemester} onChange={(e)=>setFilterSemester(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer shadow-inner text-sm">
            <option value="0">ทั้งหมด</option>
            {semesters && semesters.map(s => <option key={s.semester_id} value={s.semester_id}>ปี {s.academic_year} / ภาค {s.term_type}</option>)}
          </select>
        </div>
        <div className="flex-1 md:flex-[1.5]">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">กรองตามวิชา</label>
          <select value={filterSubject} onChange={(e)=>setFilterSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer shadow-inner text-sm">
            <option value="0">ทั้งหมด</option>
            {subjects && subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.course_code} - {s.course_name}</option>)}
          </select>
        </div>
      </div>

      {/* 🗂️ Data Table Card */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden flex flex-col min-h-[400px]">
        <div className="flex-1 p-0 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-100/50 dark:bg-slate-700/30">
              <tr>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">ชื่องาน</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">วิชา</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">กำหนดส่ง</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center w-40">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-500 dark:text-slate-400">
                    <FaSpinner className="animate-spin text-3xl text-indigo-500 mx-auto mb-3" />
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 dark:text-slate-500">
                    <FaBoxOpen className="text-6xl mx-auto mb-4 opacity-20" />
                    ไม่พบข้อมูลงานในห้องนี้ หรือไม่มีงานที่ตรงกับตัวกรอง
                  </td>
                </tr>
              ) : assignments.map(a => {
                  const due = a.due_date ? new Date(a.due_date.replace(/(Z|\+00:00)$/, '')) : null;
                  const isValidDate = due && !isNaN(due.getTime());
                  const diff = isValidDate ? due - new Date() : null;

                  return (
                    <tr key={a.assignment_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 dark:text-white text-base max-w-[300px] truncate" title={a.title}>
                          {a.title || 'ไม่ระบุชื่อ'}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className="inline-block bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm mb-1.5">
                          {a.subjects?.course_code || '-'}
                        </span>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                          <span>เทอม {a.semesters?.academic_year || '-'}/{a.semesters?.term_type || '-'}</span>
                          {a.subjects?.day_of_week && a.subjects.day_of_week !== 'ไม่ระบุ' && (
                            <span className="text-slate-400 dark:text-slate-500">• วัน{a.subjects.day_of_week}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {isValidDate ? (
                          <>
                            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1.5">
                              <FaClock className="text-slate-400" />
                              {due.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })} 
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {due.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                              </span>
                            </div>
                            <div>
                              {diff < 0 ? (
                                <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                  <FaTimesCircle /> หมดเขต
                                </span>
                              ) : diff < 86400000 ? (
                                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                  <FaExclamationCircle /> ใกล้หมดเวลา
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                  <FaCheckCircle /> กำลังเปิดรับ
                                </span>
                              )}
                            </div>
                          </>
                        ) : <span className="text-slate-400 italic text-sm">ไม่ระบุเวลา</span>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setDetailModal(a)} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all shadow-sm" title="ดูรายละเอียด">
                            <FaEye size={14} />
                          </button>
                          <Link to={`/admin/assignments/edit/${a.assignment_id}`} className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all shadow-sm" title="แก้ไข">
                            <FaPen size={14} />
                          </Link>
                          <button onClick={() => handleDelete(a.assignment_id, a.title)} className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="ลบ">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔍 Detail Modal (Glassmorphism Style) */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetailModal(null)}></div>
          <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-white/50 dark:border-slate-700/50 animate-fade-in">
            <h4 className="font-extrabold text-slate-800 dark:text-white text-xl mb-5 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm"><FaClipboardList /></div>
              รายละเอียดงาน
            </h4>
            
            <div className="space-y-4 mb-8 text-sm text-slate-600 dark:text-slate-300">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="mb-2"><b className="text-slate-800 dark:text-slate-200">ชื่องาน:</b> {detailModal.title}</p>
                <p className="mb-2"><b className="text-slate-800 dark:text-slate-200">วิชา:</b> {detailModal.subjects?.course_name} ({detailModal.subjects?.course_code})</p>
                <p className="mb-2"><b className="text-slate-800 dark:text-slate-200">รายละเอียด:</b> <br/><span className="whitespace-pre-line mt-1 block">{detailModal.description || '-'}</span></p>
                <div className="mt-4 flex items-center">
                  <b className="text-slate-800 dark:text-slate-200 mr-2">ไฟล์แนบ:</b> 
                  {detailModal.file_url ? (
                    <ExternalLink href={detailModal.file_url} className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-3 py-1.5 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors font-medium border border-sky-100 dark:border-sky-500/20">
                      <FaFileAlt /> ดาวน์โหลด/ดูไฟล์
                    </ExternalLink>
                  ) : <span className="italic text-slate-400">ไม่มีไฟล์แนบ</span>}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between shadow-inner">
                 <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                    <FaUsers /> สถานะการส่งงาน
                 </div>
                 <span className="text-[11px] bg-white/50 dark:bg-slate-800 px-2 py-1 rounded text-indigo-500 dark:text-indigo-400 font-medium">Coming Soon</span>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-700/50 pt-4">
              <button 
                onClick={() => setDetailModal(null)} 
                className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAssignments;