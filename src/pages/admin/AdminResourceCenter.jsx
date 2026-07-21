import { useState, useEffect } from 'react'
import { FaFolderOpen, FaUpload, FaDownload, FaTrash, FaFileAlt, FaInfoCircle } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import { useOutletContext } from 'react-router-dom' // 🟢

const AdminResourceCenter = () => {
  const { activeRoom } = useOutletContext(); // 🟢 รับค่าห้อง
  
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  const storedUser = JSON.parse(localStorage.getItem('se_user') || '{}')
  const isSuperAdmin = storedUser.role === 'super_admin'

  useEffect(() => {
    if (activeRoom) {
      fetchResources()
    }
  }, [activeRoom]) // 🟢 โหลดใหม่เมื่อสลับห้อง

  const fetchResources = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('room_id', activeRoom) // 🟢 กรองตามห้อง
      .order('created_at', { ascending: false })
    if (!error && data) setResources(data)
    setLoading(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    // แยก Path ย่อยตามห้อง เพื่อความเป็นระเบียบใน Storage
    const filePath = `public/${activeRoom}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('resources').upload(filePath, file)
    
    if (uploadError) {
      alert(`อัปโหลดล้มเหลว: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('resources').getPublicUrl(filePath)
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB'

    const { error: dbError } = await supabase.from('resources').insert([{
      name: file.name,
      type: fileExt.toUpperCase(),
      size: fileSizeMB,
      file_url: publicUrlData.publicUrl,
      room_id: activeRoom // 🟢 ฝังห้องลงฐานข้อมูล
    }])

    setUploading(false)
    if (!dbError) {
      fetchResources()
      await supabase.from('system_logs').insert([{ 
        username: storedUser.username, 
        action: 'CREATE', 
        details: `อัปโหลดเอกสารกลาง: ${file.name}`,
        room_id: activeRoom // 🟢 บันทึก Log ลงห้องด้วย
      }])
      sendDiscordNotify('คลังเอกสารกลาง', 'CREATE', `อัปโหลดเอกสาร: ${file.name} (${activeRoom})`, storedUser.username)
    } else {
      alert('บันทึกข้อมูลล้มเหลว: ' + dbError.message)
    }
  }

  const handleDelete = async (id, fileName) => {
    if (!isSuperAdmin) {
      alert('คุณไม่มีสิทธิ์ลบเอกสารนี้ (เฉพาะ Super Admin เท่านั้น)');
      return;
    }
    if (window.confirm(`ยืนยันการลบเอกสาร "${fileName}" ใช่หรือไม่?`)) {
      await supabase.from('resources').delete().eq('resource_id', id).eq('room_id', activeRoom) // 🟢 ป้องกันข้ามห้อง
      fetchResources()
      await supabase.from('system_logs').insert([{ 
        username: storedUser.username, 
        action: 'DELETE', 
        details: `ลบเอกสารกลาง: ${fileName}`,
        room_id: activeRoom // 🟢
      }])
      sendDiscordNotify('คลังเอกสารกลาง', 'DELETE', `ลบเอกสาร: ${fileName} (${activeRoom})`, storedUser.username)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center">
            <FaFolderOpen className="text-indigo-600 dark:text-indigo-400 mr-3" /> คลังเอกสารกลาง
          </h3>
          <p className="text-slate-500 text-sm mt-1 flex items-center"><FaInfoCircle className="mr-1"/> ทุกคนอัปโหลดได้ แต่สิทธิ์ลบเป็นของ Super Admin เท่านั้น</p>
        </div>
        <label className={`flex items-center text-white font-semibold rounded-xl px-5 py-2.5 shadow-sm cursor-pointer transition-colors ${uploading ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          <FaUpload className="mr-2" /> {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสารใหม่'}
          <input type="file" className="hidden" disabled={uploading} onChange={handleFileUpload} />
        </label>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 border-b dark:border-slate-700">ชื่อเอกสาร</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 border-b dark:border-slate-700 w-24">ชนิด</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 border-b dark:border-slate-700 w-28">ขนาด</th>
                <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 border-b dark:border-slate-700 text-center w-32">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="py-10 text-center text-slate-500 dark:text-slate-400">กำลังโหลดเอกสาร...</td></tr>
              ) : resources.length === 0 ? (
                <tr><td colSpan="4" className="py-10 text-center text-slate-400">ยังไม่มีเอกสารในห้องนี้</td></tr>
              ) : resources.map(res => (
                <tr key={res.resource_id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-4 px-5 flex items-center font-medium text-slate-800 dark:text-white">
                    <FaFileAlt className="text-slate-400 mr-3 text-xl shrink-0" /> <span className="truncate">{res.name}</span>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400 text-sm">{res.type}</td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400 text-sm">{res.size}</td>
                  <td className="py-4 px-5 text-center flex items-center justify-center">
                    <a href={res.file_url} target="_blank" rel="noreferrer" className="inline-block text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 p-2 rounded-lg mr-2 transition-colors"><FaDownload /></a>
                    {isSuperAdmin && (
                      <button onClick={() => handleDelete(res.resource_id, res.name)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"><FaTrash /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default AdminResourceCenter