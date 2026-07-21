import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link, useOutletContext } from 'react-router-dom' // 🟢
import { FaArrowLeft, FaSave, FaUpload, FaFileAlt } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'

const AdminAssignmentsEdit = () => {
  const { id } = useParams(); 
  const { activeRoom } = useOutletContext(); // 🟢 รับค่า activeRoom
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('se_user') || '{}');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    subject_id: '',
    semester_id: ''
  });
  const [file, setFile] = useState(null);
  const [currentFileUrl, setCurrentFileUrl] = useState('');

  useEffect(() => {
    if (activeRoom) {
      fetchData();
    }
  }, [id, activeRoom]); // 🟢 ดึงข้อมูลใหม่เมื่อ activeRoom เปลี่ยน

  const fetchData = async () => {
    setInitialLoading(true);
    // 🟢 ดึงข้อมูลตัวเลือกลง Dropdown ตามห้องที่เลือก
    const { data: subData } = await supabase.from('subjects').select('*').eq('room_id', activeRoom).order('course_code', { ascending: true });
    const { data: semData } = await supabase.from('semesters').select('*').eq('room_id', activeRoom).order('academic_year', { ascending: false });
    if (subData) setSubjects(subData);
    if (semData) setSemesters(semData);

    // 🟢 ดึงข้อมูลงานโดยระบุ room_id เพื่อความปลอดภัย
    const { data: assignmentData, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('assignment_id', id)
      .eq('room_id', activeRoom)
      .single();
    
    if (assignmentData && !error) {
      let localDatetimeStr = '';
      if (assignmentData.due_date) {
         localDatetimeStr = assignmentData.due_date.replace(/(Z|\+00:00)$/, '').substring(0, 16);
      }

      setFormData({
        title: assignmentData.title || '',
        description: assignmentData.description || '',
        due_date: localDatetimeStr,
        subject_id: assignmentData.subject_id || '',
        semester_id: assignmentData.semester_id || ''
      });
      setCurrentFileUrl(assignmentData.file_url || '');
    } else {
      alert('ไม่พบข้อมูลงาน หรือคุณไม่มีสิทธิ์เข้าถึงในห้องนี้');
      navigate('/admin/assignments');
    }
    setInitialLoading(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subject_id || !formData.semester_id || !formData.due_date) {
      alert('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }

    setLoading(true);
    let final_file_url = currentFileUrl;

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const safeFileName = `assignment_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('assignments').upload(safeFileName, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('assignments').getPublicUrl(safeFileName);
        final_file_url = publicUrlData.publicUrl;
      }

      // 🟢 บันทึกการแก้ไข (เงื่อนไข update eq ต้องตรงกับ activeRoom)
      const updateData = { ...formData, file_url: final_file_url };
      const { error: updateError } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('assignment_id', id)
        .eq('room_id', activeRoom); // 🟢 ป้องกันการแก้ไขข้อมูลข้ามห้อง
        
      if (updateError) throw updateError;

      sendDiscordNotify('งานภายในรายวิชา', 'UPDATE', `แก้ไขงาน: ${formData.title} (${activeRoom})`, currentUser.username);

      alert('แก้ไขงานสำเร็จ!');
      navigate('/admin/assignments');
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-10 text-center text-slate-500 dark:text-slate-400">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/assignments" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <FaArrowLeft />
        </Link>
        <div>
          <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
             แก้ไขงาน (Edit)
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm m-0">อัปเดตรายละเอียดและกำหนดการ</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 md:p-8 transition-colors border border-transparent dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">รายวิชา *</label>
                <select name="subject_id" required value={formData.subject_id} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="">-- เลือกรายวิชา --</option>
                  {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.course_code} - {s.course_name}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">ภาคการศึกษา *</label>
                <select name="semester_id" required value={formData.semester_id} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="">-- เลือกภาคการศึกษา --</option>
                  {semesters.map(s => <option key={s.semester_id} value={s.semester_id}>ปี {s.academic_year} / ภาค {s.term_type} {s.is_active ? '(ปัจจุบัน)' : ''}</option>)}
                </select>
             </div>
          </div>

          <div>
             <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">ชื่องาน (หัวข้อ) *</label>
             <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500" />
          </div>

          <div>
             <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">รายละเอียดงาน (Description)</label>
             <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">วันและเวลากำหนดส่ง *</label>
                <input type="datetime-local" name="due_date" required value={formData.due_date} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500" />
             </div>
             <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2 flex items-center"><FaUpload className="mr-2"/> อัปโหลดไฟล์ใหม่ (แทนที่ไฟล์เดิม)</label>
                <input type="file" onChange={handleFileChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-100 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 cursor-pointer text-sm mb-2" />
                {currentFileUrl && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FaFileAlt className="text-indigo-400" /> <a href={currentFileUrl} target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">ดูไฟล์แนบปัจจุบัน</a>
                  </div>
                )}
             </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />
          
          <div className="flex gap-4 justify-end">
            <Link to="/admin/assignments" className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">ยกเลิก</Link>
            <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center">
              <FaSave className="mr-2" /> {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default AdminAssignmentsEdit