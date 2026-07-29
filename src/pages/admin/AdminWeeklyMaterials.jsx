import { useState, useEffect, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendDiscordNotify } from '../../utils/discord';
import ExternalLink from '../../components/ExternalLink';
import {
  FaPlus, FaEdit, FaTrash, FaFilePdf, FaFilePowerpoint,
  FaVideo, FaLink, FaFolderOpen, FaSpinner, FaFileAlt,
  FaLayerGroup, FaCalendarAlt, FaGraduationCap, FaSearch,
  FaExclamationTriangle
} from 'react-icons/fa';

const TYPE_META = {
  slide: {
    icon: FaFilePowerpoint,
    label: 'สไลด์',
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    solid: 'from-orange-400 to-orange-500',
  },
  sheet: {
    icon: FaFilePdf,
    label: 'ใบงาน',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    solid: 'from-blue-400 to-blue-500',
  },
  video: {
    icon: FaVideo,
    label: 'วิดีโอ',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-500/20',
    solid: 'from-rose-400 to-rose-500',
  },
  link: {
    icon: FaLink,
    label: 'ลิงก์',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-500/20',
    solid: 'from-emerald-400 to-emerald-500',
  },
};

const getTypeInfo = (type) => TYPE_META[type] || TYPE_META.link;

const AdminWeeklyMaterials = () => {
  const { activeRoom } = useOutletContext(); 

  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterSemester, setFilterSemester] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [search, setSearch] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('se_user') || '{}');

  useEffect(() => {
    if (activeRoom) {
      fetchInitialData();
    }
  }, [activeRoom]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: semData } = await supabase.from('semesters').select('*').eq('room_id', activeRoom).order('academic_year', { ascending: false });
      if (semData) {
        setSemesters(semData);
        if (semData.length > 0) {
          const activeSem = semData.find(s => s.is_active) || semData[0];
          setFilterSemester(activeSem.semester_id);
        }
      }

      const { data: subData } = await supabase.from('subjects').select('*').eq('room_id', activeRoom).order('course_code', { ascending: true });
      if (subData) setSubjects(subData);

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && activeRoom) fetchMaterials();
  }, [filterSemester, filterSubject, loading, activeRoom]);

  const fetchMaterials = async () => {
    try {
      let query = supabase.from('course_materials').select(`
        *,
        semesters (*),
        subjects (course_code, course_name)
      `)
      .eq('room_id', activeRoom)
      .order('week_number', { ascending: true });

      if (filterSemester) query = query.eq('semester_id', filterSemester);
      if (filterSubject) query = query.eq('subject_id', filterSubject);

      const { data, error } = await query;
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('course_materials').delete().eq('id', deleteTarget.id).eq('room_id', activeRoom);
      if (error) throw error;
      sendDiscordNotify('ข้อมูล Sheet Data (เอกสาร)', 'DELETE', `ลบเอกสาร: ${deleteTarget.title} (${activeRoom})`, currentUser.username);
      setDeleteTarget(null);
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('เกิดข้อผิดพลาดในการลบเอกสาร: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const visibleMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => (m.title || '').toLowerCase().includes(q));
  }, [materials, search]);

  const weekGroups = useMemo(() => {
    const grouped = {};
    visibleMaterials.forEach((item) => {
      const wk = item.week_number ?? 0;
      if (!grouped[wk]) grouped[wk] = [];
      grouped[wk].push(item);
    });
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map((w) => ({ week: w, items: grouped[w] }));
  }, [visibleMaterials]);

  const latestWeek = weekGroups.length ? weekGroups[weekGroups.length - 1].week : null;

  const stats = useMemo(() => ({
    total: materials.length,
    weeks: new Set(materials.map((m) => m.week_number)).size,
    subjects: new Set(materials.map((m) => m.subject_id)).size,
  }), [materials]);

  if (loading) return (
    <div className="flex justify-center items-center h-[70vh] text-slate-500 dark:text-slate-400 font-prompt">
      <FaSpinner className="animate-spin text-3xl text-indigo-500 mr-3" />
      กำลังโหลดข้อมูล...
    </div>
  );

  return (
    // 🟢 ใส่ overflow-x-hidden ป้องกันสไลด์ซ้าย-ขวา 100%
    <div className="w-full max-w-7xl mx-auto relative animate-fade-in font-prompt overflow-x-hidden pb-12">
      
      {/* 🔮 Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[120px]"></div>
      </div>

      {/* 📝 Header Section */}
      <div className="relative z-10 mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-2 uppercase tracking-wide">
            <FaLayerGroup /> จัดการเนื้อหารายสัปดาห์
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-500/30">
              <FaFolderOpen size={20} />
            </div>
            ข้อมูล Sheet Data (เอกสาร)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 ml-[52px]">
            รวมใบงาน สไลด์ และเอกสารประกอบการสอนของแต่ละสัปดาห์ไว้ในที่เดียว
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <StatChip icon={FaLayerGroup} value={stats.total} label="เอกสารทั้งหมด" color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-100 dark:bg-indigo-500/20" />
            <StatChip icon={FaCalendarAlt} value={stats.weeks} label="สัปดาห์ที่มีข้อมูล" color="text-sky-600 dark:text-sky-400" bg="bg-sky-100 dark:bg-sky-500/20" />
            <StatChip icon={FaGraduationCap} value={stats.subjects} label="วิชาที่สอน" color="text-purple-600 dark:text-purple-400" bg="bg-purple-100 dark:bg-purple-500/20" />
          </div>
          <Link
            to="/admin/AdminWeeklyMaterials/create"
            className="w-full sm:w-auto flex-shrink-0 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <FaPlus /> เพิ่มงานใหม่
          </Link>
        </div>
      </div>

      {/* 🔍 Filter Section */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-5 md:p-6 rounded-3xl border border-white/50 dark:border-slate-700/50 mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col md:flex-row gap-5">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">กรองตามเทอม</label>
          <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer shadow-inner text-sm">
            <option value="">-- ดูเอกสารทุกเทอม --</option>
            {semesters.map(s => (
              <option key={s.semester_id} value={s.semester_id}>ปี {s.academic_year} / ภาค {s.term_type} {s.is_active ? '(ปัจจุบัน)' : ''}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">กรองตามวิชา</label>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer shadow-inner text-sm">
            <option value="">-- ดูเอกสารทุกวิชา --</option>
            {subjects.map(s => (
              <option key={s.subject_id} value={s.subject_id}>{s.course_code} - {s.course_name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">ค้นหาชื่อเอกสาร</label>
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์ชื่อเอกสาร..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white pl-11 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner text-sm"
            />
          </div>
        </div>
      </div>

      {/* 🗓️ Timeline Section */}
      <div className="relative z-10">
        {weekGroups.length === 0 ? (
          <EmptyState hasAnyData={materials.length > 0} />
        ) : (
          <div className="relative ml-4 md:ml-8 border-l-2 border-indigo-100 dark:border-slate-700 space-y-12 pb-10">
            
            {weekGroups.map(({ week, items }) => (
              <div key={week} className="relative pl-6 md:pl-10">
                {/* Timeline Marker */}
                <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-4 ring-slate-50 dark:ring-[#0f172a] ${week === latestWeek ? 'bg-gradient-to-br from-indigo-500 to-violet-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  {week}
                </div>

                {/* Week Header */}
                <div className="flex items-center gap-3 mb-4 -mt-1">
                  <h2 className="font-extrabold text-xl text-slate-800 dark:text-white">สัปดาห์ที่ {week}</h2>
                  {week === latestWeek && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                      ล่าสุด
                    </span>
                  )}
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {items.length} รายการ
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => {
                    const typeInfo = getTypeInfo(item.material_type);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <div
                        key={item.id}
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col relative overflow-hidden group"
                      >
                        {/* Top Color Accent Line */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${typeInfo.solid}`}></div>

                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border border-white/20 dark:border-slate-600/50 ${typeInfo.bg} ${typeInfo.text}`}>
                            <TypeIcon /> {typeInfo.label}
                          </span>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/admin/AdminWeeklyMaterials/edit/${item.id}`}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-500/30"
                              title="แก้ไข"
                            >
                              <FaEdit size={14} />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30"
                              title="ลบ"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">
                              {item.subjects?.course_code}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.subjects?.course_name}
                            </p>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 mt-2 mb-4">
                            {item.title}
                          </p>
                        </div>

                        {/* Attachments */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50 mt-auto">
                          {item.file_url && (
                            <ExternalLink href={item.file_url} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-600">
                              <FaLink size={10} /> เปิดลิงก์ที่แนบ
                            </ExternalLink>
                          )}
                          {item.attached_file_url && (
                            <ExternalLink href={item.attached_file_url} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors border border-slate-200 dark:border-slate-600">
                              <FaFileAlt size={10} /> โหลดเอกสาร
                            </ExternalLink>
                          )}
                          {!item.file_url && !item.attached_file_url && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">ยังไม่แนบไฟล์หรือลิงก์</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔴 Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl border border-white/20 dark:border-slate-700 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-5 border-4 border-white dark:border-slate-800 shadow-sm">
              <FaExclamationTriangle className="text-rose-500 text-2xl" />
            </div>
            <h3 className="font-extrabold text-xl text-slate-800 dark:text-white mb-2">ยืนยันการลบเอกสาร</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              ต้องการลบ <br/><b className="text-slate-700 dark:text-slate-300">"{deleteTarget.title}"</b><br/> ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-md shadow-rose-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                ลบเอกสาร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component ย่อย
function StatChip({ icon: Icon, value, label, color, bg }) {
  return (
    <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-xl px-4 py-2.5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_15px_rgb(0,0,0,0.1)]">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`${color} text-lg`} />
      </div>
      <div className="leading-tight">
        <p className="font-black text-slate-800 dark:text-white text-lg">{value}</p>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ hasAnyData }) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-700/50 p-12 text-center shadow-sm">
      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaFolderOpen className="text-4xl text-indigo-300 dark:text-indigo-500/50" />
      </div>
      {hasAnyData ? (
        <>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">ไม่พบเอกสารที่ตรงกับการค้นหา</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองดูอีกครั้ง</p>
        </>
      ) : (
        <>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">ยังไม่มีการเพิ่มเอกสารประกอบการเรียน</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">เริ่มต้นสร้างเอกสารชิ้นแรกสำหรับห้องเรียนนี้ได้เลย</p>
          <Link
            to="/admin/AdminWeeklyMaterials/create"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition-all transform hover:-translate-y-0.5"
          >
            <FaPlus /> เพิ่มเอกสารใหม่
          </Link>
        </>
      )}
    </div>
  );
}

export default AdminWeeklyMaterials;