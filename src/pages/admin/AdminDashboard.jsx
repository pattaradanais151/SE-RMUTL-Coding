import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  FaUsers, FaBook, FaClipboardList, FaCalendarCheck,
  FaArrowRight, FaUserPlus, FaCalendarPlus, FaPlusCircle,
  FaClock, FaSearch, FaFilter, FaExclamationTriangle, FaSyncAlt,
  FaChartBar, FaChartPie, FaFire, FaBolt
} from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ============================================================
// Constants & Animation Variants
// ============================================================
const CHART_COLORS = ['#2DD4BF', '#A78BFA', '#FBBF24', '#FB7185', '#60A5FA', '#34D399']

const ACCENTS = {
  blue:   { chip: 'bg-blue-500/20 text-blue-400',     glow: 'bg-blue-500' },
  emerald:{ chip: 'bg-emerald-500/20 text-emerald-400', glow: 'bg-emerald-500' },
  violet: { chip: 'bg-violet-500/20 text-violet-400', glow: 'bg-violet-500' },
  amber:  { chip: 'bg-amber-500/20 text-amber-400',   glow: 'bg-amber-500' },
  teal:   { chip: 'bg-teal-500/20 text-teal-400',      glow: 'bg-teal-500' },
  rose:   { chip: 'bg-rose-500/20 text-rose-400',      glow: 'bg-rose-500' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

// ============================================================
// Data Hook[cite: 3]
// ============================================================
function useDashboardData(activeRoom) {
  const [stats, setStats] = useState({
    users: 0,
    subjects: 0,
    assignments: 0,
    currentSemester: 'ไม่ได้ตั้งค่า',
  })
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    if (!activeRoom) return
    setLoading(true)
    setError(null)
    try {
      const [usersRes, subjectsRes, assignmentsCountRes, semesterRes, assignmentListRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('room_id', activeRoom),
        supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('room_id', activeRoom),
        supabase.from('semesters').select('*').eq('room_id', activeRoom).order('academic_year', { ascending: false }).limit(1),
        supabase.from('assignments').select('*, subjects(course_code)').eq('room_id', activeRoom).order('created_at', { ascending: false }).limit(50),
      ])

      const failed = [usersRes, subjectsRes, assignmentsCountRes, semesterRes, assignmentListRes].find(r => r.error)
      if (failed) throw failed.error

      const semesterData = semesterRes.data
      const currentSem = semesterData && semesterData.length > 0
        ? `ปี ${semesterData[0].academic_year} / ${semesterData[0].term_type}`
        : 'ไม่ได้ตั้งค่า'

      setStats({
        users: usersRes.count || 0,
        subjects: subjectsRes.count || 0,
        assignments: assignmentsCountRes.count || 0,
        currentSemester: currentSem,
      })
      setAssignments(assignmentListRes.data || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('โหลดข้อมูลแดชบอร์ดไม่สำเร็จ เครือข่ายอาจขัดข้องหรือฐานข้อมูลไม่ตอบสนอง')
    } finally {
      setLoading(false)
    }
  }, [activeRoom])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return { stats, assignments, loading, error, refetch: fetchDashboardData }
}

// ============================================================
// Presentational Components
// ============================================================

const ErrorBanner = ({ message, onRetry }) => (
  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-500/10 backdrop-blur-md border border-rose-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
    <div className="flex items-center gap-3">
      <FaExclamationTriangle className="text-rose-400 text-lg shrink-0" />
      <p className="text-sm font-medium text-rose-200">{message}</p>
    </div>
    <button
      onClick={onRetry}
      className="flex items-center justify-center gap-1.5 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 px-4 py-2 rounded-xl transition-colors shrink-0"
    >
      <FaSyncAlt /> ลองใหม่อีกครั้ง
    </button>
  </motion.div>
)

const StatChip = ({ icon: Icon, label, value, suffix, accent, loading, small }) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ y: -5, scale: 1.02 }}
    className="relative bg-slate-900/40 backdrop-blur-2xl rounded-2xl border border-white/5 p-5 shadow-[0_8px_32px_rgb(0,0,0,0.2)] overflow-hidden group transition-shadow hover:shadow-[0_8px_32px_rgb(0,0,0,0.4)]"
  >
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-[40px] opacity-30 ${accent.glow} group-hover:opacity-60 transition-opacity duration-500 pointer-events-none`}></div>
    <div className="relative z-10 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 truncate">{label}</p>
        {loading ? (
          <div className="h-6 w-14 bg-white/10 rounded-md animate-pulse" />
        ) : (
          <p className={`font-bold text-white leading-tight drop-shadow-sm ${small ? 'text-base' : 'text-3xl'}`}>
            {value}
            {suffix && <span className="text-xs font-medium text-slate-400 ml-1">{suffix}</span>}
          </p>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${accent.chip} shadow-inner group-hover:rotate-6 transition-transform`}>
        <Icon />
      </div>
    </div>
  </motion.div>
)

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-slate-300 font-medium mb-1 text-xs">{label || payload[0].name}</p>
        <p className="text-white font-bold text-sm">
          {payload[0].value} <span className="text-slate-400 font-normal text-xs">งาน</span>
        </p>
      </div>
    )
  }
  return null
}

const QuickMenu = ({ isSuperAdmin }) => (
  <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_8px_32px_rgb(0,0,0,0.2)] border border-white/5 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
    <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 drop-shadow-sm">
      <div className="p-1.5 bg-white/5 rounded-lg border border-white/5"><FaBolt className="text-indigo-400" /></div>
      เมนูลัดจัดการด่วน
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {isSuperAdmin && (
        <>
          <Link to="/admin/users" className="flex items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg group-hover:bg-blue-500 group-hover:text-white shadow-inner transition-colors">
              <FaUserPlus />
            </div>
            <div className="ml-4">
              <h4 className="font-bold text-slate-200 group-hover:text-white">จัดการผู้ใช้งาน</h4>
              <p className="text-xs text-slate-400 mt-0.5">เพิ่ม/ลดสิทธิ์ผู้ใช้</p>
            </div>
          </Link>

          <Link to="/admin/semesters" className="flex items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 transition-all duration-300 group">
            <div className="w-11 h-11 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-lg group-hover:bg-orange-500 group-hover:text-white shadow-inner transition-colors">
              <FaCalendarPlus />
            </div>
            <div className="ml-4">
              <h4 className="font-bold text-slate-200 group-hover:text-white">จัดการภาคเรียน</h4>
              <p className="text-xs text-slate-400 mt-0.5">ตั้งค่าปีการศึกษา</p>
            </div>
          </Link>
        </>
      )}

      <Link to="/admin/subjects" className="flex items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg group-hover:bg-emerald-500 group-hover:text-white shadow-inner transition-colors">
          <FaBook />
        </div>
        <div className="ml-4">
          <h4 className="font-bold text-slate-200 group-hover:text-white">จัดการรายวิชา</h4>
          <p className="text-xs text-slate-400 mt-0.5">เพิ่มรายวิชาใหม่</p>
        </div>
      </Link>

      <Link to="/admin/assignments" className="flex items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all duration-300 group">
        <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg group-hover:bg-purple-500 group-hover:text-white shadow-inner transition-colors">
          <FaPlusCircle />
        </div>
        <div className="ml-4">
          <h4 className="font-bold text-slate-200 group-hover:text-white">สั่งงานใหม่</h4>
          <p className="text-xs text-slate-400 mt-0.5">เข้าไปหน้าจัดการงาน</p>
        </div>
      </Link>
    </div>
  </motion.div>
)

const AssignmentRow = ({ assignment, formatDate }) => (
  <motion.div 
    variants={itemVariants}
    className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 flex justify-between items-center rounded-2xl group cursor-pointer"
  >
    <div className="min-w-0">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-md border border-indigo-500/20 shrink-0">
          {assignment.subjects?.course_code || 'N/A'}
        </span>
        <h4 className="font-bold text-slate-200 group-hover:text-white text-sm truncate">{assignment.title}</h4>
      </div>
      <p className="text-xs text-slate-400 font-medium">สัปดาห์ที่ {assignment.week_number || '-'}</p>
    </div>
    <div className="text-right shrink-0 ml-3">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">วันที่สั่ง</p>
      <p className="text-[11px] text-slate-300 font-medium bg-black/20 border border-white/5 px-2.5 py-1 rounded-lg shadow-inner">
        {formatDate(assignment.created_at)}
      </p>
    </div>
  </motion.div>
)

// ============================================================
// Main Component
// ============================================================
const AdminDashboard = () => {
  const { activeRoom } = useOutletContext() 
  const storedUser = JSON.parse(localStorage.getItem('se_user') || '{}')
  const isSuperAdmin = storedUser.role === 'super_admin'

  const { stats, assignments, loading, error, refetch } = useDashboardData(activeRoom) //[cite: 3]

  const [subjectFilter, setSubjectFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const subjectOptions = useMemo(() => {
    const set = new Set(assignments.map(a => a.subjects?.course_code).filter(Boolean))
    return Array.from(set).sort()
  }, [assignments])

  const filteredAssignments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return assignments
      .filter(a => subjectFilter === 'all' || a.subjects?.course_code === subjectFilter)
      .filter(a => term === '' || (a.title || '').toLowerCase().includes(term))
      .slice(0, 6)
  }, [assignments, subjectFilter, searchTerm]) //[cite: 3]

  const weeklyChartData = useMemo(() => {
    const map = new Map()
    assignments.forEach(a => {
      const wk = a.week_number || 0
      map.set(`สัปดาห์ ${wk}`, (map.get(`สัปดาห์ ${wk}`) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .slice(-8)
  }, [assignments])

  const subjectChartData = useMemo(() => {
    const map = new Map()
    assignments.forEach(a => {
      const label = a.subjects?.course_code || 'ไม่ระบุ'
      map.set(label, (map.get(label) || 0) + 1)
    })
    const sorted = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    
    if (sorted.length <= 5) return sorted
    const otherCount = sorted.slice(5).reduce((sum, d) => sum + d.value, 0)
    return [...sorted.slice(0, 5), { name: 'อื่น ๆ', value: otherCount }]
  }, [assignments])

  const thisWeekCount = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return assignments.filter(a => a.created_at && new Date(a.created_at) >= weekAgo).length
  }, [assignments])

  const avgPerSubject = useMemo(() => {
    if (!stats.subjects) return '0'
    return (stats.assignments / stats.subjects).toFixed(1)
  }, [stats.assignments, stats.subjects])

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่มีกำหนด'
    const d = new Date(dateString)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) + ' ' +
           d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 relative"
    >
      {/* Ambient Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Welcome Banner */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgb(0,0,0,0.2)] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-sm tracking-wide">
              ยินดีต้อนรับกลับมา, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{storedUser.full_name || storedUser.username}</span> 👋
            </h2>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span>
              ภาพรวมระบบ SE-JOB ({activeRoom === 'room1' ? 'เทียบโอน' : 'ปกติ 4 ปี'})
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="shrink-0 flex items-center gap-2 text-sm font-bold bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl border border-white/10 transition-colors disabled:opacity-50"
          >
            <FaSyncAlt className={loading ? 'animate-spin text-indigo-400' : 'text-indigo-400'} /> รีเฟรช
          </button>
        </div>
      </motion.div>

      {/* Stat Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatChip icon={FaUsers} label="ผู้ใช้งานทั้งหมด" value={stats.users} suffix="บัญชี" accent={ACCENTS.blue} loading={loading} />
        <StatChip icon={FaBook} label="รายวิชาในระบบ" value={stats.subjects} suffix="วิชา" accent={ACCENTS.emerald} loading={loading} />
        <StatChip icon={FaClipboardList} label="งานที่สั่งทั้งหมด" value={stats.assignments} suffix="ชิ้น" accent={ACCENTS.violet} loading={loading} />
        <StatChip icon={FaCalendarCheck} label="เทอมล่าสุด" value={stats.currentSemester} accent={ACCENTS.amber} loading={loading} small />
        <StatChip icon={FaFire} label="งาน 7 วันล่าสุด" value={thisWeekCount} suffix="ชิ้น" accent={ACCENTS.teal} loading={loading} />
        <StatChip icon={FaChartBar} label="เฉลี่ยงาน/วิชา" value={avgPerSubject} suffix="ชิ้น" accent={ACCENTS.rose} loading={loading} />
      </motion.div>

      {/* Charts Panel */}
      <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgb(0,0,0,0.2)] border border-white/5 relative overflow-hidden">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400 mb-1">ภาพรวมกิจกรรมด้วยกราฟ</p>
          <h3 className="text-xl font-bold text-white">จังหวะงานและสัดส่วนรายวิชา</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Bar Chart */}
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <FaChartBar className="text-teal-400" /> งานต่อสัปดาห์
            </p>
            <div className="h-[200px] w-full">
              {loading ? (
                <div className="w-full h-full flex justify-center items-center"><div className="w-8 h-8 border-4 border-white/10 border-t-teal-400 rounded-full animate-spin"></div></div>
              ) : weeklyChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">ยังไม่มีข้อมูลงานพอสำหรับสร้างกราฟ</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2DD4BF" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#0D9488" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomChartTooltip />} />
                    <Bar dataKey="count" fill="url(#barGlow)" radius={[6, 6, 6, 6]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div>
            <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <FaChartPie className="text-violet-400" /> สัดส่วนงานต่อรายวิชา
            </p>
            <div className="h-[200px] w-full flex items-center">
              {loading ? (
                <div className="w-full h-full flex justify-center items-center"><div className="w-8 h-8 border-4 border-white/10 border-t-violet-400 rounded-full animate-spin"></div></div>
              ) : subjectChartData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">ยังไม่มีข้อมูลรายวิชาให้แสดงกราฟ</div>
              ) : (
                <>
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomChartTooltip />} />
                        <Pie data={subjectChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} stroke="none" paddingAngle={5}>
                          {subjectChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 pl-4 pr-2 max-h-full overflow-y-auto custom-scrollbar">
                    <ul className="space-y-3">
                      {subjectChartData.map((d, i) => (
                        <li key={d.name} className="flex items-center gap-3 text-sm">
                          <span className="w-3 h-3 rounded-full shadow-inner shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                          <span className="text-slate-300 font-medium truncate flex-1">{d.name}</span>
                          <span className="text-white font-bold shrink-0">{d.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickMenu isSuperAdmin={isSuperAdmin} />
        </div>

        {/* Recent Assignments Filter & List */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgb(0,0,0,0.2)] border border-white/5 flex flex-col">
          <div className="p-6 border-b border-white/5 space-y-4 bg-gradient-to-b from-white/5 to-transparent rounded-t-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center drop-shadow-sm">
                <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 mr-3"><FaClock className="text-orange-400" /></div>
                งานที่สั่งล่าสุด
              </h3>
              <Link to="/admin/assignments" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center group">
                ดูทั้งหมด <FaArrowRight className="ml-1 text-xs group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่องาน..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-black/20 border border-white/10 focus:outline-none focus:border-indigo-500/50 text-white placeholder:text-slate-500 transition-colors shadow-inner"
                />
              </div>
              <div className="relative sm:w-48">
                <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-black/20 border border-white/10 focus:outline-none focus:border-indigo-500/50 text-white appearance-none cursor-pointer transition-colors shadow-inner"
                >
                  <option value="all" className="bg-slate-800">ทุกรายวิชา</option>
                  {subjectOptions.map(code => (
                    <option key={code} value={code} className="bg-slate-800">{code}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 min-h-[300px]">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}
              </div>
            ) : filteredAssignments.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-500 pb-10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <FaFilter className="text-2xl text-slate-600" />
                </div>
                <p className="text-sm">ไม่พบงานที่ตรงกับเงื่อนไข</p>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3">
                <AnimatePresence>
                  {filteredAssignments.map(a => (
                    <AssignmentRow key={a.assignment_id} assignment={a} formatDate={formatDate} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default AdminDashboard