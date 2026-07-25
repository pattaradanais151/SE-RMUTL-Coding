import { useState, useEffect, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendDiscordNotify } from '../../utils/discord';
import ExternalLink from '../../components/ExternalLink'; // 🟢 นำเข้า ExternalLink
import {
  FaPlus, FaEdit, FaTrash, FaFilePdf, FaFilePowerpoint,
  FaVideo, FaLink, FaFolderOpen, FaSpinner, FaFileAlt,
  FaLayerGroup, FaCalendarAlt, FaGraduationCap, FaSearch,
  FaExclamationTriangle, FaTimes, FaCheck,
} from 'react-icons/fa';

const TYPE_META = {
  slide: {
    icon: FaFilePowerpoint,
    label: 'สไลด์',
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-500/10',
    solid: '#F97316',
  },
  sheet: {
    icon: FaFilePdf,
    label: 'ใบงาน',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-500/10',
    solid: '#3B82F6',
  },
  video: {
    icon: FaVideo,
    label: 'วิดีโอ',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-500/10',
    solid: '#F43F5E',
  },
  link: {
    icon: FaLink,
    label: 'ลิงก์',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-500/10',
    solid: '#10B981',
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
          // เลือกเทอมที่เป็นปัจจุบันก่อน ถ้าไม่มีให้เลือกอันแรกสุด
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

  if (loading) return <div className="flex justify-center items-center h-[70vh]"><FaSpinner className="animate-spin text-4xl text-indigo-500" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-prompt animate-rise">
      <style>{`
        @keyframes wmFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .wm-fade-up { animation: wmFadeUp .45s ease both; }
        @keyframes wmPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.18), 0 0 0 0 rgba(99,102,241,0.45); }
          50% { box-shadow: 0 0 0 7px rgba(99,102,241,0.22), 0 0 0 11px rgba(99,102,241,0.06); }
        }
        .wm-pulse { animation: wmPulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .wm-fade-up, .wm-pulse { animation: none !important; } }
      `}</style>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-2">
            <FaLayerGroup /> จัดการเนื้อหารายสัปดาห์
          </p>
          <h1 className="text-2xl md:text-[1.85rem] font-bold text-slate-800 dark:text-white flex items-center gap-3 drop-shadow-sm">
            <FaFolderOpen className="text-indigo-500 flex-shrink-0" />
            <span>
              ข้อมูล{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-300 bg-clip-text text-transparent">
                Sheet Data
              </span>{' '}
              (เอกสาร)
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            รวมใบงาน สไลด์ และเอกสารประกอบการสอนของแต่ละสัปดาห์ไว้ในที่เดียว
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-3">
            <StatChip icon={FaLayerGroup} value={stats.total} label="เอกสารทั้งหมด" />
            <StatChip icon={FaCalendarAlt} value={stats.weeks} label="สัปดาห์ที่มีข้อมูล" />
            <StatChip icon={FaGraduationCap} value={stats.subjects} label="วิชาที่สอน" />
          </div>
          <Link
            to="/admin/AdminWeeklyMaterials/create"
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <FaPlus /> เพิ่มงานใหม่
          </Link>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/40 dark:border-slate-700/50 mb-8 flex flex-col md:flex-row gap-4 shadow-lg shadow-slate-200/50 dark:shadow-none">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">กรองตามเทอม</label>
          <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
            <option value="">-- ดูเอกสารทุกเทอม --</option>
            {/* 🟢 แก้ไขการดึงชื่อมาแสดงให้ถูกต้อง */}
            {semesters.map(s => (
              <option key={s.semester_id} value={s.semester_id}>ปี {s.academic_year} / ภาค {s.term_type} {s.is_active ? '(ปัจจุบัน)' : ''}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">กรองตามวิชา</label>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
            <option value="">-- ดูเอกสารทุกวิชา --</option>
            {subjects.map(s => (
              <option key={s.subject_id} value={s.subject_id}>{s.course_code} - {s.course_name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">ค้นหาชื่อเอกสาร</label>
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์ชื่อเอกสาร..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {weekGroups.length === 0 ? (
        <EmptyState hasAnyData={materials.length > 0} />
      ) : (
        <div className="relative pl-9 md:pl-12">
          <div className="absolute left-[13px] md:left-[17px] top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-indigo-400 to-indigo-100 dark:from-indigo-500 dark:to-slate-800" />
          <div className="space-y-10">
            {weekGroups.map(({ week, items }) => (
              <div key={week} className="relative wm-fade-up">
                <div
                  className={`absolute -left-9 md:-left-12 top-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md ${week === latestWeek ? 'wm-pulse' : ''}`}
                >
                  {week}
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <h2 className="font-bold text-lg text-slate-800 dark:text-white">สัปดาห์ที่ {week}</h2>
                  {week === latestWeek && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                      ล่าสุด
                    </span>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500">{items.length} รายการ</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item) => {
                    const typeInfo = getTypeInfo(item.material_type);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <div
                        key={item.id}
                        className="relative overflow-hidden bg-white/80 dark:bg-[#161B22]/80 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-4"
                      >
                        <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: typeInfo.solid }} />
                        <div className="flex items-start justify-between gap-2 pl-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${typeInfo.bg} ${typeInfo.text}`}>
                            <TypeIcon /> {typeInfo.label}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Link
                              to={`/admin/AdminWeeklyMaterials/edit/${item.id}`}
                              className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-200/50 dark:border-amber-500/20"
                            >
                              <FaEdit size={13} />
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-200/50 dark:border-rose-500/20"
                            >
                              <FaTrash size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="pl-2">
                          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.subjects?.course_code}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 truncate">{item.subjects?.course_name}</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">{item.title}</p>
                        </div>

                        <div className="pl-2 flex flex-wrap gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-white/5">
                          {/* 🟢 เปลี่ยนเป็น ExternalLink */}
                          {item.file_url && (
                            <ExternalLink href={item.file_url} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                              <FaLink size={10} /> ลิงก์แนบ
                            </ExternalLink>
                          )}
                          {item.attached_file_url && (
                            <ExternalLink href={item.attached_file_url} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                              <FaFileAlt size={10} /> ไฟล์เอกสาร
                            </ExternalLink>
                          )}
                          {!item.file_url && !item.attached_file_url && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">ยังไม่แนบไฟล์หรือลิงก์</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-white/40 dark:border-slate-700/50">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-rose-500" size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1.5">ยืนยันการลบเอกสาร</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              ต้องการลบ "{deleteTarget.title}" ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash size={12} />}
                ลบเอกสาร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function StatChip({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-xl px-3.5 py-2 shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
        <Icon className="text-indigo-600 dark:text-indigo-400 text-sm" />
      </div>
      <div className="leading-tight">
        <p className="font-bold text-slate-800 dark:text-white text-sm">{value}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ hasAnyData }) {
  return (
    <div className="bg-white/80 dark:bg-[#161B22]/80 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/50 px-6 py-20 text-center shadow-xl shadow-slate-200/40 dark:shadow-none">
      <FaFolderOpen className="text-5xl mx-auto mb-4 opacity-20 text-indigo-500" />
      {hasAnyData ? (
        <>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">ไม่พบเอกสารที่ตรงกับการค้นหา</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">ลองเปลี่ยนคำค้นหรือปรับตัวกรองดูอีกครั้ง</p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">ยังไม่มีการเพิ่มเอกสารประกอบการเรียนในห้องนี้</p>
          <Link
            to="/admin/AdminWeeklyMaterials/create"
            className="inline-flex items-center gap-2 mt-5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition-all"
          >
            <FaPlus /> เพิ่มงานใหม่
          </Link>
        </>
      )}
    </div>
  );
}

export default AdminWeeklyMaterials;