import { useState, useEffect } from 'react'
import { FaFolderOpen, FaUpload, FaDownload, FaTrash, FaFileAlt, FaInfoCircle, FaSpinner } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { sendDiscordNotify } from '../../utils/discord'
import { useOutletContext } from 'react-router-dom'
import ExternalLink from '../../components/ExternalLink';

const AdminResourceCenter = () => {
  const { activeRoom } = useOutletContext(); 
  
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  const storedUser = JSON.parse(localStorage.getItem('se_user') || '{}')
  const isSuperAdmin = storedUser.role === 'super_admin'

  useEffect(() => {
    if (activeRoom) {
      fetchResources()
    }
  }, [activeRoom])

  const fetchResources = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('room_id', activeRoom)
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
      room_id: activeRoom
    }])

    setUploading(false)
    if (!dbError) {
      fetchResources()
      await supabase.from('system_logs').insert([{ 
        username: storedUser.username, 
        action: 'CREATE', 
        details: `อัปโหลดเอกสารกลาง: ${file.name}`,
        room_id: activeRoom
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
      await supabase.from('resources').delete().eq('resource_id', id).eq('room_id', activeRoom)
      fetchResources()
      await supabase.from('system_logs').insert([{ 
        username: storedUser.username, 
        action: 'DELETE', 
        details: `ลบเอกสารกลาง: ${fileName}`,
        room_id: activeRoom
      }])
      sendDiscordNotify('คลังเอกสารกลาง', 'DELETE', `ลบเอกสาร: ${fileName} (${activeRoom})`, storedUser.username)
    }
  }

  // ฟังก์ชันแยกสี Badge ตามประเภทไฟล์
  const getFileTypeStyle = (type) => {
    const t = (type || '').toUpperCase();
    if (['PDF'].includes(t)) return 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30';
    if (['DOC', 'DOCX'].includes(t)) return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
    if (['XLS', 'XLSX', 'CSV'].includes(t)) return 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30';
    if (['PPT', 'PPTX'].includes(t)) return 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30';
    if (['ZIP', 'RAR', '7Z'].includes(t)) return 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30';
    // ค่าเริ่มต้น (เช่น PKT, TXT ฯลฯ)
    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
  };

  return (
    // 🟢 บังคับ w-full และ overflow-x-hidden ป้องกันการเลื่อนซ้ายขวาเด็ดขาด
    <div className="w-full max-w-7xl mx-auto relative animate-fade-in font-prompt overflow-x-hidden pb-12">
      
      {/* 🔮 Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      {/* 📝 Header Section */}
      <div className="relative z-10 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <h3 className="m-0 font-extrabold text-slate-800 dark:text-white text-2xl md:text-3xl flex items-center mb-2 tracking-tight">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl mr-3 shadow-lg shadow-indigo-500/30">
              <FaFolderOpen size={20} />
            </div>
            คลังเอกสารกลาง
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base ml-[52px] flex items-center">
            <FaInfoCircle className="mr-1.5 opacity-70"/> ทุกคนอัปโหลดได้ แต่สิทธิ์ลบเป็นของ Super Admin เท่านั้น
          </p>
        </div>

        <label className={`flex items-center justify-center text-white font-bold rounded-xl px-6 py-3.5 shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer w-full md:w-auto ${
          uploading 
            ? 'bg-slate-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/30'
        }`}>
          {uploading ? <FaSpinner className="mr-2 animate-spin" /> : <FaUpload className="mr-2" />} 
          {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสารใหม่'}
          <input type="file" className="hidden" disabled={uploading} onChange={handleFileUpload} />
        </label>
      </div>

      {/* 🗂️ Data Table Card */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden min-h-[400px] flex flex-col">
        
        <div className="flex-1 p-0 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-100/50 dark:bg-slate-700/30">
              <tr>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">ชื่อเอกสาร</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 w-32 text-center">ชนิด</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 w-32 text-center">ขนาด</th>
                <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center w-32">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-500 dark:text-slate-400">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    กำลังโหลดเอกสาร...
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-400 dark:text-slate-500">
                    <FaFolderOpen className="text-6xl mx-auto mb-4 opacity-20" />
                    ยังไม่มีการอัปโหลดเอกสารในห้องนี้
                  </td>
                </tr>
              ) : resources.map(res => (
                <tr key={res.resource_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="py-4 px-6 flex items-center font-semibold text-slate-800 dark:text-slate-200">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-4 shrink-0 text-slate-400 border border-slate-200 dark:border-slate-600 group-hover:scale-105 transition-transform">
                      <FaFileAlt size={16} />
                    </div>
                    <span className="truncate max-w-[300px] md:max-w-md lg:max-w-lg" title={res.name}>
                      {res.name}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold border shadow-sm ${getFileTypeStyle(res.type)}`}>
                      {res.type || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {res.size}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ExternalLink 
                        href={res.file_url} 
                        className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all shadow-sm"
                        title="ดาวน์โหลด"
                      >
                        <FaDownload size={14} />
                      </ExternalLink>
                      
                      {isSuperAdmin ? (
                        <button 
                          onClick={() => handleDelete(res.resource_id, res.name)} 
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          title="ลบเอกสาร"
                        >
                          <FaTrash size={14} />
                        </button>
                      ) : (
                        // Placeholder ให้ UI สมดุลกรณีเป็นแค่ Admin
                        <div className="w-[34px]"></div>
                      )}
                    </div>
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

export default AdminResourceCenter;