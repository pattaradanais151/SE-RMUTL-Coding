import { useState, useEffect } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendDiscordNotify } from '../../utils/discord';
import {
  FaArrowLeft, FaFileAlt, FaLink, FaCloudUploadAlt, FaSpinner,
  FaCalendarAlt, FaLayerGroup, FaFilePdf, FaFilePowerpoint, FaVideo,
  FaCheck, FaTimes,
} from 'react-icons/fa';

const TYPE_OPTIONS = [
  { value: 'slide', label: 'สไลด์นำเสนอ', desc: 'ไฟล์ PowerPoint / Slides', icon: FaFilePowerpoint, solid: '#F97316', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-400 dark:border-orange-500/50', text: 'text-orange-600 dark:text-orange-400' },
  { value: 'sheet', label: 'ชีท/ใบงาน', desc: 'เอกสาร PDF หรือใบงาน', icon: FaFilePdf, solid: '#3B82F6', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-400 dark:border-blue-500/50', text: 'text-blue-600 dark:text-blue-400' },
  { value: 'video', label: 'วิดีโอ', desc: 'คลิปสอนหรือบันทึกการสอน', icon: FaVideo, solid: '#F43F5E', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-400 dark:border-rose-500/50', text: 'text-rose-600 dark:text-rose-400' },
  { value: 'link', label: 'ลิงก์อื่นๆ', desc: 'แบบฟอร์ม หรือลิงก์ภายนอก', icon: FaLink, solid: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-400 dark:border-emerald-500/50', text: 'text-emerald-600 dark:text-emerald-400' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
        <Icon size={15} />
      </div>
      <div>
        <p className="font-bold text-sm text-slate-800 dark:text-white">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

const AdminWeeklyMaterialsCreate = () => {
  const navigate = useNavigate();
  const { activeRoom } = useOutletContext(); // 🟢 รับค่าห้องปัจจุบัน
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('se_user') || '{}');

  const [formData, setFormData] = useState({
    semester_id: '',
    subject_id: '',
    week_number: 1,
    title: '',
    material_type: 'slide',
    file_url: '',
    attached_file_url: ''
  });

  useEffect(() => {
    if (activeRoom) {
      fetchDropdownData();
    }
  }, [activeRoom]);

  const fetchDropdownData = async () => {
    // 🟢 ดึงข้อมูลเทอมโดยกรองตามห้อง
    const { data: semData, error: semError } = await supabase
      .from('semesters')
      .select('*')
      .eq('room_id', activeRoom)
      .order('academic_year', { ascending: false });
      
    if (semError) console.error("Semesters error:", semError);
    if (semData) {
      setSemesters(semData);
      if (semData.length > 0) {
        // เลือกเทอมที่ Active ก่อน ถ้าไม่มีให้เลือกอันแรกสุด
        const activeSem = semData.find(s => s.is_active) || semData[0];
        setFormData(prev => ({ ...prev, semester_id: activeSem.semester_id }));
      }
    }

    // 🟢 ดึงข้อมูลวิชาโดยกรองตามห้อง
    const { data: subData, error: subError } = await supabase
      .from('subjects')
      .select('*')
      .eq('room_id', activeRoom)
      .order('course_code', { ascending: true });
      
    if (subError) console.error("Subjects error:", subError);
    if (subData) {
      setSubjects(subData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragIn = (e) => { handleDrag(e); if (e.dataTransfer.items && e.dataTransfer.items.length) setDragActive(true); };
  const handleDragOut = (e) => { handleDrag(e); setDragActive(false); };
  const handleDrop = (e) => {
    handleDrag(e);
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      setFileToUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.semester_id || !formData.subject_id || !formData.title) {
      alert('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }
    
    setSubmitting(true);
    try {
      let finalAttachedUrl = formData.attached_file_url;

      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${formData.semester_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('materials').upload(filePath, fileToUpload);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(filePath);
        finalAttachedUrl = publicUrl;
      }

      // 🟢 ฝัง room_id ลงไปในฐานข้อมูลตอน Insert
      const payload = { ...formData, attached_file_url: finalAttachedUrl, room_id: activeRoom };
      const { error } = await supabase.from('course_materials').insert([payload]);

      if (error) throw error;
      
      sendDiscordNotify('ข้อมูล Sheet Data (เอกสาร)', 'CREATE', `เพิ่มเอกสารใหม่: ${formData.title} (${activeRoom})`, currentUser.username);
      
      navigate('/admin/AdminWeeklyMaterials');

    } catch (error) {
      console.error('Error saving material:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto font-prompt animate-rise">
      <div className="mb-6">
        <Link to="/admin/AdminWeeklyMaterials" className="group inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-4">
          <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> กลับไปหน้าเอกสาร
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3 drop-shadow-sm">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/30">
            <FaFileAlt size={18} />
          </div>
          <span>
            เพิ่ม<span className="bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-300 bg-clip-text text-transparent">งานใหม่</span>
          </span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 ml-[52px]">เพิ่มเอกสารประกอบการเรียนสำหรับสัปดาห์ที่ต้องการ</p>
      </div>

      <div className="bg-white dark:bg-[#161B22] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section: context */}
          <div>
            <SectionHeader icon={FaCalendarAlt} title="บริบทของเอกสาร" subtitle="เทอม สัปดาห์ และรายวิชาที่เอกสารนี้เกี่ยวข้อง" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">เทอมการศึกษา <span className="text-rose-500">*</span></label>
                <select name="semester_id" value={formData.semester_id} onChange={handleInputChange} required className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1c2128] text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                  <option value="">-- เลือกเทอม --</option>
                  {/* 🟢 แก้ไขการแสดงผลชื่อเทอม */}
                  {semesters.map(s => (
                    <option key={s.semester_id} value={s.semester_id}>
                      ปี {s.academic_year} / ภาค {s.term_type} {s.is_active ? '(ปัจจุบัน)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">สัปดาห์ที่เรียน <span className="text-rose-500">*</span></label>
                <input type="number" min="1" max="25" name="week_number" value={formData.week_number} onChange={handleInputChange} required className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1c2128] text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">รายวิชา <span className="text-rose-500">*</span></label>
                <select name="subject_id" value={formData.subject_id} onChange={handleInputChange} required className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1c2128] text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                  <option value="">-- เลือกวิชา --</option>
                  {subjects.map(s => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.course_code} {s.course_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: type */}
          <div>
            <SectionHeader icon={FaLayerGroup} title="ประเภทเอกสาร" subtitle="เลือกรูปแบบของเอกสารที่จะเพิ่ม" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TYPE_OPTIONS.map((opt) => {
                const active = formData.material_type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, material_type: opt.value }))}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all ${active ? `${opt.border} ${opt.bg} shadow-md` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'}`}
                  >
                    {active && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: opt.solid }}>
                        <FaCheck className="text-white" size={9} />
                      </span>
                    )}
                    <opt.icon className={`text-2xl mb-2 ${opt.text}`} />
                    <p className="font-semibold text-sm text-slate-800 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: details */}
          <div>
            <SectionHeader icon={FaFileAlt} title="รายละเอียดเอกสาร" subtitle="ชื่อที่จะแสดงให้ผู้เรียนเห็น" />
            <input
              type="text" name="title" value={formData.title} onChange={handleInputChange} required
              placeholder="พิมพ์หัวข้องานหรือชื่อเอกสาร..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1c2128] text-slate-900 dark:text-white px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Section: attachments */}
          <div>
            <SectionHeader icon={FaCloudUploadAlt} title="ไฟล์แนบ" subtitle="แนบลิงก์ภายนอก และ/หรือ อัปโหลดไฟล์จากเครื่อง" />

            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">ลิงก์ไฟล์แนบ (Google Drive, YouTube ฯลฯ)</label>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaLink className="text-slate-400" />
              </div>
              <input type="url" name="file_url" value={formData.file_url} onChange={handleInputChange} placeholder="https://..." className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1c2128] text-slate-900 dark:text-white pl-11 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" />
            </div>

            <div
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.01]' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400'}`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FaCloudUploadAlt size={20} />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">ลากไฟล์มาวางที่นี่ หรือ</p>
                <label className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline">
                  เลือกไฟล์จากเครื่อง
                  <input type="file" onChange={handleFileChange} className="hidden" />
                </label>

                {fileToUpload && (
                  <div className="mt-2 flex items-center gap-2 bg-white dark:bg-[#1c2128] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <FaFileAlt className="text-indigo-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[200px]">{fileToUpload.name}</span>
                    <span className="text-slate-400 flex-shrink-0">{formatBytes(fileToUpload.size)}</span>
                    <button type="button" onClick={() => setFileToUpload(null)} className="text-slate-400 hover:text-rose-500 ml-1 flex-shrink-0">
                      <FaTimes size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Link to="/admin/AdminWeeklyMaterials" className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              ยกเลิก
            </Link>
            <button type="submit" disabled={submitting} className="px-8 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-700 hover:to-violet-600 shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-50">
              {submitting ? <><FaSpinner className="animate-spin" /> กำลังบันทึก...</> : <><FaCheck size={13} /> บันทึกข้อมูล</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminWeeklyMaterialsCreate;