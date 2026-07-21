import { useState, useEffect } from 'react'
import { FaBook, FaPlus, FaTrash, FaPen, FaSave } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import { useOutletContext } from 'react-router-dom' // 🟢

const AdminSubjects = () => {
  const { activeRoom } = useOutletContext(); // 🟢

  const daysOfWeek = ['ทั้งหมด', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์', 'ไม่ระบุ'];
  const [selectedDay, setSelectedDay] = useState('ทั้งหมด');
  
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({ course_code: '', course_name: '', instructor: '', credits: '', day_of_week: 'จันทร์' });
  const [loading, setLoading] = useState(true);
  
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const currentUser = JSON.parse(localStorage.getItem('se_user') || '{}');

  useEffect(() => {
    if (activeRoom) {
      fetchSubjects();
    }
  }, [activeRoom]);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('room_id', activeRoom) // 🟢 ดึงข้อมูลแยกห้อง
      .order('course_code', { ascending: true });
      
    if (!error && data) setSubjects(data);
    setLoading(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!formData.course_code || !formData.course_name) return;
    
    // 🟢 ฝัง room_id ลงฐานข้อมูล
    const insertData = { ...formData, room_id: activeRoom };

    const { error } = await supabase.from('subjects').insert([insertData]);
    if (!error) {
      sendDiscordNotify('จัดการรายวิชา', 'CREATE', `เพิ่มวิชา: ${formData.course_code} - ${formData.course_name} (${activeRoom})`, currentUser.username);
      setFormData({ course_code: '', course_name: '', instructor: '', credits: '', day_of_week: 'จันทร์' });
      fetchSubjects();
    } else {
      alert('เกิดข้อผิดพลาดในการเพิ่มรายวิชา: ' + error.message);
    }
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase.from('subjects').update(editData).eq('subject_id', editId).eq('room_id', activeRoom);
    if (!error) { 
      sendDiscordNotify('จัดการรายวิชา', 'UPDATE', `แก้ไขข้อมูลวิชา: ${editData.course_code} (${activeRoom})`, currentUser.username);
      setEditId(null); 
      fetchSubjects(); 
    } else {
      alert('เกิดข้อผิดพลาดในการแก้ไข: ' + error.message);
    }
  };

  const handleDelete = async (id, course_code) => {
    if (window.confirm('คุณต้องการลบรายวิชานี้ใช่หรือไม่?')) {
      const { error } = await supabase.from('subjects').delete().eq('subject_id', id).eq('room_id', activeRoom);
      if (!error) {
        sendDiscordNotify('จัดการรายวิชา', 'DELETE', `ลบวิชา: ${course_code} (${activeRoom})`, currentUser.username);
        fetchSubjects();
      }
    }
  };

  const filteredSubjects = (subjects || []).filter(sub => selectedDay === 'ทั้งหมด' || (sub.day_of_week || 'ไม่ระบุ') === selectedDay);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
          <FaBook className="text-indigo-600 dark:text-indigo-400 mr-3" /> จัดการรายวิชา
        </h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 transition-colors">
            <h5 className="font-bold text-slate-800 dark:text-white mb-4">เพิ่มวิชาใหม่</h5>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 cursor-pointer">
                {daysOfWeek.filter(d => d !== 'ทั้งหมด').map(day => (
                   <option key={day} value={day}>{day === 'ไม่ระบุ' ? 'ไม่ระบุ' : `วัน${day}`}</option>
                ))}
              </select>
              <input type="text" name="course_code" required value={formData.course_code} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" placeholder="รหัสวิชา" />
              <input type="text" name="course_name" required value={formData.course_name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" placeholder="ชื่อวิชา" />
              <input type="text" name="instructor" value={formData.instructor} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" placeholder="ชื่อผู้สอน" />
              <button type="submit" className="w-full flex justify-center bg-indigo-600 text-white font-semibold rounded-xl py-3 hover:bg-indigo-700 transition-colors">
                <FaPlus className="mr-2 mt-1" /> เพิ่มรายวิชา
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="flex space-x-2 overflow-x-auto mb-4 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            {daysOfWeek.map(day => (
              <button key={day} onClick={() => setSelectedDay(day)} className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${selectedDay === day ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                {day}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 w-40">รหัสวิชา</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">รายละเอียดวิชา</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 text-center w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                     <tr><td colSpan="3" className="text-center py-8 dark:text-slate-300">กำลังโหลด...</td></tr>
                  ) : filteredSubjects.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-10 text-slate-400">ไม่มีรายวิชาในห้องนี้</td></tr>
                  ) : filteredSubjects.map((sub) => (
                    <tr key={sub.subject_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                      <td className="py-4 px-5">
                        {editId === sub.subject_id ? (
                          <input type="text" name="course_code" value={editData.course_code || ''} onChange={handleEditChange} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-500" />
                        ) : <span className="font-bold text-indigo-600 dark:text-indigo-400">{sub.course_code}</span>}
                      </td>
                      <td className="py-4 px-5">
                        {editId === sub.subject_id ? (
                          <div className="space-y-2">
                            <input type="text" name="course_name" value={editData.course_name || ''} onChange={handleEditChange} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-500" placeholder="ชื่อวิชา" />
                            <div className="flex gap-2">
                              <input type="text" name="instructor" value={editData.instructor || ''} onChange={handleEditChange} className="w-1/2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-500" placeholder="ผู้สอน" />
                              
                              <select name="day_of_week" value={editData.day_of_week || 'ไม่ระบุ'} onChange={handleEditChange} className="w-1/2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white p-2 rounded-lg text-sm outline-none focus:border-indigo-500 cursor-pointer">
                                {daysOfWeek.filter(d => d !== 'ทั้งหมด').map(day => (
                                  <option key={day} value={day}>{day === 'ไม่ระบุ' ? 'ไม่ระบุ' : `วัน${day}`}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-slate-700 dark:text-white font-semibold">{sub.course_name}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 mt-1">
                              <span>อ. {sub.instructor || '-'}</span>
                              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                วัน{sub.day_of_week || 'ไม่ระบุ'}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {editId === sub.subject_id ? (
                            <button onClick={handleSaveEdit} className="w-8 h-8 flex items-center justify-center rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"><FaSave /></button>
                          ) : (
                            <button onClick={() => { setEditId(sub.subject_id); setEditData(sub); }} className="w-8 h-8 flex items-center justify-center rounded-full border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30"><FaPen className="text-xs" /></button>
                          )}
                          <button onClick={() => handleDelete(sub.subject_id, sub.course_code)} className="w-8 h-8 flex items-center justify-center rounded-full border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"><FaTrash className="text-xs" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AdminSubjects