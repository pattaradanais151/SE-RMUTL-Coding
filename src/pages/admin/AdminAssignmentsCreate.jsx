import { useState, useEffect } from 'react'
import { useNavigate, Link, useOutletContext } from 'react-router-dom' // 🟢
import { FaClipboardList, FaArrowLeft, FaSave, FaUpload } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'

const AdminAssignmentsCreate = () => {
  const { activeRoom } = useOutletContext(); // 🟢 รับค่า activeRoom
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (activeRoom) {
      fetchDropdownData();
    }
  }, [activeRoom]); // 🟢 ดึงข้อมูลใหม่เมื่อเปลี่ยนห้อง

  const fetchDropdownData = async () => {
    // 🟢 ดึงรายวิชาและภาคเรียน เฉพาะของห้องที่เลือกอยู่
    const { data: subData } = await supabase.from('subjects').select('*').eq('room_id', activeRoom).order('course_code', { ascending: true });
    const { data: semData } = await supabase.from('semesters').select('*').eq('room_id', activeRoom).order('academic_year', { ascending: false });
    
    if (subData) setSubjects(subData);
    if (semData) {
      setSemesters(semData);
      const activeSem = semData.find(s => s.is_active);
      if (activeSem) setFormData(prev => ({ ...prev, semester_id: activeSem.semester_id }));
    }
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
    let file_url = null;

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const safeFileName = `assignment_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('assignments').upload(safeFileName, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('assignments').getPublicUrl(safeFileName);
        file_url = publicUrlData.publicUrl;
      }

      // 🟢 ฝัง room_id ลงไปในฐานข้อมูลตอน Insert
      const insertData = { ...formData, file_url, room_id: activeRoom };
      const { error: insertError } = await supabase.from('assignments').insert([insertData]);
      if (insertError) throw insertError;

      sendDiscordNotify('งานภายในรายวิชา', 'CREATE', `สร้างงานใหม่: ${formData.title} (${activeRoom})`, currentUser.username);

      alert('สร้างงานใหม่สำเร็จ!');
      navigate('/admin/assignments');
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/assignments" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-transparent dark:border-slate-700">
          <FaArrowLeft />
        </Link>
        <div>
          <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
             สร้างงานใหม่
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm m-0">เพิ่มข้อมูลและรายละเอียดงานเข้าสู่ระบบ</p>
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
             <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500" placeholder="เช่น รายงานบทที่ 1" />
          </div>

          <div>
             <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">รายละเอียดงาน (Description)</label>
             <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500" placeholder="อธิบายรายละเอียด คำสั่ง หรือเงื่อนไขของงาน..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">วันและเวลากำหนดส่ง *</label>
                <input type="datetime-local" name="due_date" required value={formData.due_date} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500" />
             </div>
             <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2 flex items-center"><FaUpload className="mr-2"/> ไฟล์แนบประกอบการสั่งงาน</label>
                <input type="file" onChange={handleFileChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-100 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 cursor-pointer text-sm" />
             </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />
          
          <div className="flex gap-4 justify-end">
            <Link to="/admin/assignments" className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">ยกเลิก</Link>
            <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center">
              <FaSave className="mr-2" /> {loading ? 'กำลังบันทึก...' : 'บันทึกงานใหม่'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default AdminAssignmentsCreate