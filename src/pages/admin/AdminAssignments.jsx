import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom' // 🟢
import { FaClipboardList, FaPlus, FaTrash, FaPen, FaBoxOpen, FaEye, FaUsers } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import ExternalLink from '../../components/ExternalLink' // 🟢 นำเข้า ExternalLink

const AdminAssignments = () => {
  const { activeRoom } = useOutletContext() // 🟢
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
    
    // ตั้งค่า Subscription (ถ้าเกิดบั๊กการแสดงผลระหว่างสลับห้องให้ปิดส่วน Subscription นี้ได้ครับ)
    const subscription = supabase.channel('public:assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        if (activeRoom) fetchAssignments();
      })
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, [filterSemester, filterSubject, activeRoom]) // 🟢 เพิ่ม activeRoom เป็น Dependency

  const fetchOptions = async () => {
    // 🟢 ดึงข้อมูลตัวกรองเฉพาะห้องนี้
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
    `).eq('room_id', activeRoom).order('due_date', { ascending: true }) // 🟢 กรองตามห้อง

    if (filterSemester !== '0') query = query.eq('semester_id', filterSemester)
    if (filterSubject !== '0') query = query.eq('subject_id', filterSubject)
    const { data, error } = await query
    if (!error && data) setAssignments(data)
    setLoading(false)
  }

  const handleDelete = async (id, title) => {
    if (window.confirm('คุณต้องการลบงานนี้ใช่หรือไม่?')) {
      const { error } = await supabase.from('assignments').delete().eq('assignment_id', id).eq('room_id', activeRoom) // 🟢
      if (!error) {
        sendDiscordNotify('งานภายในรายวิชา', 'DELETE', `ลบงาน: ${title} (${activeRoom})`, currentUser.username)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
          <FaClipboardList className="text-indigo-600 dark:text-indigo-400 mr-3" /> งานภายในรายวิชา
        </h3>
        <Link to="/admin/assignments/create" className="flex items-center bg-indigo-600 text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm hover:bg-indigo-700 transition-colors">
          <FaPlus className="mr-2" /> สร้างงานใหม่
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mb-6 transition-colors">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">กรองตามภาคเรียน</label>
            <select value={filterSemester} onChange={(e)=>setFilterSemester(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 cursor-pointer">
              <option value="0">ทั้งหมด</option>
              {semesters && semesters.map(s => <option key={s.semester_id} value={s.semester_id}>ปี {s.academic_year} / {s.term_type}</option>)}
            </select>
          </div>
          <div className="w-full md:w-2/5">
            <label className="block text-slate-500 dark:text-slate-400 text-sm font-bold mb-2">กรองตามวิชา</label>
            <select value={filterSubject} onChange={(e)=>setFilterSubject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 cursor-pointer">
              <option value="0">ทั้งหมด</option>
              {subjects && subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.course_code} - {s.course_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">ชื่องาน</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">วิชา</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">กำหนดส่ง</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 text-center w-40">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="py-16 text-center text-slate-500 dark:text-slate-300">กำลังโหลด...</td></tr>
              ) : assignments.length === 0 ? (
                <tr><td colSpan="4" className="py-16 text-center text-slate-400"><FaBoxOpen className="text-5xl mx-auto mb-4 opacity-50" />ไม่มีข้อมูลงานในห้องนี้</td></tr>
              ) : assignments.map(a => {
                  const due = a.due_date ? new Date(a.due_date.replace(/(Z|\+00:00)$/, '')) : null;
                  const isValidDate = due && !isNaN(due.getTime());
                  const diff = isValidDate ? due - new Date() : null;

                  return (
                    <tr key={a.assignment_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                      <td className="py-4 px-5 font-bold text-slate-800 dark:text-white text-[1.05rem]">{a.title || 'ไม่ระบุชื่อ'}</td>
                      
                      <td className="py-4 px-5">
                        <span className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-md">{a.subjects?.course_code || '-'}</span>
                        
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                          <span>เทอม {a.semesters?.academic_year || '-'}/{a.semesters?.term_type || '-'}</span>
                          {a.subjects?.day_of_week && a.subjects.day_of_week !== 'ไม่ระบุ' && (
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              วัน{a.subjects.day_of_week}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {isValidDate ? (
                          <>
                            <div className="font-bold text-slate-700 dark:text-white">
                              {due.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })} 
                              <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">
                                {due.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                              </span>
                            </div>
                            <div className="mt-1">
                              {diff < 0 ? <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">หมดเขต</span> : diff < 86400000 ? <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">ใกล้หมดเวลา</span> : <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">กำลังเปิดรับ</span>}
                            </div>
                          </>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setDetailModal(a)} className="w-8 h-8 rounded-full border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/50"><FaEye /></button>
                          <Link to={`/admin/assignments/edit/${a.assignment_id}`} className="w-8 h-8 rounded-full border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center hover:bg-sky-50 dark:hover:bg-sky-900/50"><FaPen className="text-xs" /></Link>
                          <button onClick={() => handleDelete(a.assignment_id, a.title)} className="w-8 h-8 rounded-full border border-red-200 dark:border-red-900 text-red-500 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/50"><FaTrash className="text-xs" /></button>
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

      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl relative">
            <h4 className="font-bold text-slate-800 dark:text-white text-xl mb-4 border-b dark:border-slate-700 pb-2">รายละเอียดงาน</h4>
            
            <div className="space-y-3 mb-6 text-sm text-slate-700 dark:text-slate-300">
              <p><b>ชื่องาน:</b> {detailModal.title}</p>
              <p><b>วิชา:</b> {detailModal.subjects?.course_name} ({detailModal.subjects?.course_code})</p>
              <p><b>รายละเอียด:</b> {detailModal.description || '-'}</p>
              <p className="flex items-center">
                <b>ไฟล์แนบ:</b> 
                {/* 🟢 เปลี่ยน <a> เป็น <ExternalLink> */}
                {detailModal.file_url ? (
                  <ExternalLink href={detailModal.file_url} className="text-indigo-500 hover:underline ml-2">
                    ดาวน์โหลด/ดูไฟล์
                  </ExternalLink>
                ) : ' ไม่มีไฟล์แนบ'}
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl mt-4 flex items-center justify-between border dark:border-slate-600">
                 <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                    <FaUsers /> สถานะการส่งงาน
                 </div>
                 <span className="text-xs text-slate-500 dark:text-slate-400">(ฟีเจอร์นี้เตรียมเพิ่มในอนาคต)</span>
              </div>
            </div>

            <div className="text-right">
              <button onClick={() => setDetailModal(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminAssignments