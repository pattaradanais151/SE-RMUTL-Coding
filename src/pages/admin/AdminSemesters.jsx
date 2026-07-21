import { useState, useEffect } from 'react'
import { FaCalendarAlt, FaPlus, FaTrash, FaCheckCircle, FaCircle, FaPen, FaSave } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import { useOutletContext } from 'react-router-dom' // 🟢

const AdminSemesters = () => {
  const { activeRoom } = useOutletContext(); // 🟢
  const [semesters, setSemesters] = useState([]);
  const [formData, setFormData] = useState({ academic_year: '', term_type: '1', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const currentUser = JSON.parse(localStorage.getItem('se_user') || '{}');

  useEffect(() => {
    if (activeRoom) fetchSemesters();
  }, [activeRoom]);

  const fetchSemesters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .eq('room_id', activeRoom) // 🟢 กรองตามห้อง
      .order('academic_year', { ascending: false }); 
    if (!error && data) setSemesters(data);
    setLoading(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

const handleAddSemester = async (e) => {
    e.preventDefault();
    if (!formData.academic_year) return;
    const isFirst = semesters.length === 0;
    const insertData = { ...formData, is_active: isFirst, room_id: activeRoom };
    if (!insertData.start_date) delete insertData.start_date;
    if (!insertData.end_date) delete insertData.end_date;

    const { error } = await supabase.from('semesters').insert([insertData]);
    
    if (!error) {
      sendDiscordNotify('จัดการภาค/เทอม', 'CREATE', `เพิ่มภาคเรียนใหม่: ปี ${formData.academic_year} ภาค ${formData.term_type} (${activeRoom})`, currentUser.username);
      setFormData({ academic_year: '', term_type: '1', start_date: '', end_date: '' });
      fetchSemesters();
    } else {
      // 🟢 เพิ่มส่วนนี้เข้าไปเพื่อให้ระบบแจ้งเตือนหน้าเว็บทันที
      console.error('Insert Error:', error);
      alert('ไม่สามารถเพิ่มข้อมูลได้: ข้อมูลอาจซ้ำ หรือ ' + error.message);
    }
  };

  const handleSaveEdit = async () => {
    const updateData = { ...editData };
    if (!updateData.start_date) updateData.start_date = null;
    if (!updateData.end_date) updateData.end_date = null;
    const { error } = await supabase.from('semesters').update(updateData).eq('semester_id', editId).eq('room_id', activeRoom);
    if (!error) {
      sendDiscordNotify('จัดการภาค/เทอม', 'UPDATE', `แก้ไขข้อมูลภาคเรียน: ปี ${editData.academic_year} ภาค ${editData.term_type} (${activeRoom})`, currentUser.username);
      setEditId(null);
      fetchSemesters();
    }
  };

  const handleSetActiveTerm = async (semesterId, academic_year, term_type) => {
    try {
      const { data: activeSems } = await supabase.from('semesters').select('semester_id').eq('is_active', true).eq('room_id', activeRoom); // 🟢 ปิด is_active แค่ในห้องนี้
      
      if (activeSems && activeSems.length > 0) {
        for (const sem of activeSems) {
          await supabase.from('semesters').update({ is_active: false }).eq('semester_id', sem.semester_id).eq('room_id', activeRoom);
        }
      }
      
      const { error } = await supabase.from('semesters').update({ is_active: true }).eq('semester_id', semesterId).eq('room_id', activeRoom);
      
      if (error) throw error;
      sendDiscordNotify('จัดการภาค/เทอม', 'UPDATE', `ตั้งเป็นเทอมหลัก: ปี ${academic_year} ภาค ${term_type} (${activeRoom})`, currentUser.username);
      fetchSemesters();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนเทอมหลัก: ' + error.message);
    }
  };

  const handleDelete = async (id, academic_year, term_type) => {
    if (window.confirm('คุณต้องการลบข้อมูลภาคการศึกษานี้ใช่หรือไม่?')) {
      const { error } = await supabase.from('semesters').delete().eq('semester_id', id).eq('room_id', activeRoom);
      if (!error) {
        sendDiscordNotify('จัดการภาค/เทอม', 'DELETE', `ลบภาคเรียน: ปี ${academic_year} ภาค ${term_type} (${activeRoom})`, currentUser.username);
        fetchSemesters();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
          <FaCalendarAlt className="text-indigo-600 dark:text-indigo-400 mr-3" /> จัดการภาค/เทอม
        </h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 transition-colors border border-transparent dark:border-slate-700">
            <h5 className="font-bold text-slate-800 dark:text-white mb-4">เพิ่มภาค/เทอม</h5>
            <form onSubmit={handleAddSemester} className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold mb-1">ปีการศึกษา</label>
                <input type="text" name="academic_year" required value={formData.academic_year} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" placeholder="เช่น 2569" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold mb-1">ภาคเรียน</label>
                <select name="term_type" value={formData.term_type} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                  <option value="Summer">ภาคเรียนฤดูร้อน (Summer)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold mb-1">วันเปิดเทอม</label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-white rounded-xl p-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-xs font-semibold mb-1">วันปิดเทอม</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-white rounded-xl p-2 text-xs outline-none" />
                </div>
              </div>

              <button type="submit" className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-xl py-3 mt-2 hover:bg-indigo-700 transition-colors">
                <FaPlus className="mr-2" /> เพิ่มข้อมูลภาคเรียน
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow h-full overflow-hidden flex flex-col transition-colors border border-transparent dark:border-slate-700">
            <div className="p-0 flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">ปีการศึกษา / ภาค</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">ช่วงเวลาเรียน</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 text-center">สถานะใช้งาน</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 text-center w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="text-center py-8 dark:text-slate-300">กำลังโหลด...</td></tr>
                  ) : semesters.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400">ไม่มีข้อมูลภาคเรียนในห้องนี้</td></tr>
                  ) : semesters.map((sem) => {
                      const isValidStart = sem.start_date && !isNaN(new Date(sem.start_date).getTime());
                      const isValidEnd = sem.end_date && !isNaN(new Date(sem.end_date).getTime());
                      const isEditing = editId === sem.semester_id;
                      
                      const activeRowClass = sem.is_active ? 'bg-green-50 dark:bg-green-900/10 border-l-4 border-l-green-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30';

                      return (
                        <tr key={sem.semester_id} className={`border-b border-slate-100 dark:border-slate-700 ${activeRowClass}`}>
                          <td className="py-4 px-5">
                            {isEditing ? (
                              <div className="flex gap-2 items-center">
                                <span className="text-sm font-semibold dark:text-white">ปี</span>
                                <input type="text" name="academic_year" value={editData.academic_year || ''} onChange={handleEditChange} className="border dark:border-slate-600 bg-transparent dark:text-white p-1.5 rounded-lg w-20 text-sm outline-none" />
                                <span className="text-sm font-semibold dark:text-white">/</span>
                                <select name="term_type" value={editData.term_type || ''} onChange={handleEditChange} className="border dark:border-slate-600 bg-transparent dark:text-white p-1.5 rounded-lg text-sm outline-none">
                                  <option value="1">1</option><option value="2">2</option><option value="Summer">Summer</option>
                                </select>
                              </div>
                            ) : (
                              <div className="font-bold text-slate-700 dark:text-white">
                                ปี {sem.academic_year} <span className="text-slate-500 dark:text-slate-400 font-normal">/ ภาค {sem.term_type}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-5 text-slate-600 dark:text-slate-300 text-sm">
                            {isEditing ? (
                              <div className="flex flex-col gap-1.5 w-32">
                                <input type="date" name="start_date" value={editData.start_date || ''} onChange={handleEditChange} className="border dark:border-slate-600 bg-transparent dark:text-white p-1 rounded text-[11px] outline-none" />
                                <input type="date" name="end_date" value={editData.end_date || ''} onChange={handleEditChange} className="border dark:border-slate-600 bg-transparent dark:text-white p-1 rounded text-[11px] outline-none" />
                              </div>
                            ) : (
                              isValidStart && isValidEnd ? (
                                <span>{new Date(sem.start_date).toLocaleDateString('th-TH', {day:'numeric', month:'short'})} - {new Date(sem.end_date).toLocaleDateString('th-TH', {day:'numeric', month:'short'})}</span>
                              ) : <span className="text-slate-400 font-mono text-xs">ไม่ได้ระบุช่วงเวลา</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-center">
                            {sem.is_active ? (
                              <span className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-green-200 dark:border-green-800">
                                <FaCheckCircle className="mr-1" /> เทอมหลัก
                              </span>
                            ) : (
                              <button onClick={() => handleSetActiveTerm(sem.semester_id, sem.academic_year, sem.term_type)} disabled={isEditing} className={`inline-flex items-center bg-white dark:bg-slate-700 border dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer'}`}>
                                <FaCircle className="mr-1 text-slate-300 dark:text-slate-500 text-[10px]" /> ตั้งเป็นเทอมหลัก
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isEditing ? (
                                <button onClick={handleSaveEdit} className="w-8 h-8 rounded-full border border-emerald-200 text-emerald-600 flex items-center justify-center"><FaSave/></button>
                              ) : (
                                <button onClick={() => { setEditId(sem.semester_id); setEditData(sem); }} className="w-8 h-8 rounded-full border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center"><FaPen className="text-xs"/></button>
                              )}
                              <button onClick={() => handleDelete(sem.semester_id, sem.academic_year, sem.term_type)} disabled={sem.is_active || isEditing} className={`w-8 h-8 rounded-full border flex items-center justify-center ${sem.is_active || isEditing ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'border-red-200 dark:border-red-900 text-red-500'}`}>
                                <FaTrash className="text-xs" />
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
        </div>
      </div>
    </div>
  )
}
export default AdminSemesters