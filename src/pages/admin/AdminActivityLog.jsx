import { useState, useEffect } from 'react'
import { FaHistory, FaUserShield, FaTrash, FaExclamationTriangle } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { useOutletContext } from 'react-router-dom' // 🟢

const AdminActivityLog = () => {
  const { activeRoom } = useOutletContext(); // 🟢 รับค่าห้องปัจจุบัน
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeRoom) {
      fetchLogs()
    }
  }, [activeRoom]) // 🟢 โหลดข้อมูลใหม่เมื่อสลับห้อง

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('room_id', activeRoom) // 🟢 กรองประวัติตามห้อง
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) setLogs(data)
    setLoading(false)
  }

  const handleDeleteLog = async (id) => {
    if (window.confirm('คุณต้องการลบบันทึกกิจกรรมนี้ใช่หรือไม่?')) {
      await supabase.from('system_logs').delete().eq('log_id', id).eq('room_id', activeRoom) // 🟢
      fetchLogs()
    }
  }

  const handleClearAllLogs = async () => {
    if (window.confirm(`คำเตือน: คุณต้องการลบบันทึกกิจกรรม "ทั้งหมด" ของห้องนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!`)) {
      // 🟢 ลบเฉพาะของห้องที่กำลังเลือกอยู่
      await supabase.from('system_logs').delete().eq('room_id', activeRoom)
      fetchLogs()
    }
  }

  const formatDate = (dateString) => {
    const d = new Date(dateString)
    return d.toLocaleString('th-TH', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }) + ' น.'
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
            <FaHistory className="text-indigo-600 dark:text-indigo-400 mr-3" /> บันทึกกิจกรรมระบบ (System Log)
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm flex items-center"><FaUserShield className="mr-2 text-amber-500"/> (สิทธิ์การเข้าถึง: Super Admin เท่านั้น)</p>
        </div>
        <button onClick={handleClearAllLogs} className="flex items-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl px-5 py-2.5 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 shadow-sm transition-colors">
          <FaExclamationTriangle className="mr-2" /> ล้างประวัติทั้งหมด
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden min-h-[400px]">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
             <div className="p-10 text-center text-slate-500 dark:text-slate-400">กำลังดึงข้อมูลกิจกรรม...</div>
          ) : logs.length === 0 ? (
             <div className="p-10 text-center text-slate-400">ยังไม่มีบันทึกกิจกรรมในห้องนี้</div>
          ) : logs.map(log => (
            <div key={log.log_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-600' : 
                      log.action === 'DELETE' ? 'bg-red-100 text-red-600' : 
                      log.action === 'UPDATE' ? 'bg-amber-100 text-amber-600' : 
                      'bg-sky-100 text-sky-600'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-white text-sm">@{log.username}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">{log.details}</p>
               </div>
               <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-3 sm:mt-0 gap-4">
                 <span className="text-xs text-slate-400 font-mono">{formatDate(log.created_at)}</span>
                 <button onClick={() => handleDeleteLog(log.log_id)} className="flex items-center text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-100 dark:border-red-900 px-3 py-1.5 rounded-lg transition-colors">
                   <FaTrash className="mr-1" /> ลบ
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default AdminActivityLog