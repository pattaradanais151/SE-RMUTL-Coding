import { useState, useEffect } from 'react';
import { FaHistory, FaUserShield, FaTrash, FaExclamationTriangle, FaClock, FaUser } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import './AdminActivityLog.css';

const AdminActivityLog = () => {
  const { activeRoom } = useOutletContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeRoom) {
      fetchLogs();
    }
  }, [activeRoom]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      // แก้ไข: ดึงข้อมูลห้องปัจจุบัน + ข้อมูลส่วนกลาง ('all') + ข้อมูลระบบที่ไม่มีห้อง (null)
      .or(`room_id.eq.${activeRoom},room_id.eq.all,room_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) setLogs(data);
    setLoading(false);
  };

  const handleDeleteLog = async (id) => {
    if (window.confirm('คุณต้องการลบบันทึกกิจกรรมนี้ใช่หรือไม่?')) {
      // แก้ไข: ลบด้วย log_id อย่างเดียว ไม่ต้องล็อค room_id เพื่อให้ลบประวัติของ Global ได้ด้วย
      await supabase.from('system_logs').delete().eq('log_id', id);
      fetchLogs();
    }
  };

  const handleClearAllLogs = async () => {
    if (window.confirm(`คำเตือน: คุณต้องการลบบันทึกกิจกรรม "ทั้งหมด" ที่แสดงอยู่นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!`)) {
      // แก้ไข: ลบข้อมูลตามเงื่อนไขที่แสดงผลอยู่บนหน้าจอ
      await supabase.from('system_logs').delete().or(`room_id.eq.${activeRoom},room_id.eq.all,room_id.is.null`);
      fetchLogs();
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('th-TH', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }) + ' น.';
  };

  const getActionClass = (action) => {
    switch(action) {
      case 'CREATE': return 'badge-create';
      case 'DELETE': return 'badge-delete';
      case 'UPDATE': return 'badge-update';
      default: return 'badge-default';
    }
  };

  return (
    <div className="activity-log-wrapper font-prompt">
      <div className="log-header-section">
        <div className="log-title-area">
          <h3 className="log-title">
            <FaHistory className="icon-title" /> บันทึกกิจกรรมระบบ (System Log)
          </h3>
          <p className="log-subtitle">
            <FaUserShield className="icon-shield"/> (สิทธิ์การเข้าถึง: Super Admin เท่านั้น)
          </p>
        </div>
        <button onClick={handleClearAllLogs} className="btn-clear-all">
          <FaExclamationTriangle className="mr-2" /> ล้างประวัติทั้งหมด
        </button>
      </div>

      <div className="log-glass-container">
        {loading ? (
           <div className="log-loading">
              <div className="spinner"></div>
              <span>กำลังดึงข้อมูลกิจกรรม...</span>
           </div>
        ) : logs.length === 0 ? (
           <div className="log-empty">ยังไม่มีบันทึกกิจกรรมในระบบ</div>
        ) : (
          <div className="log-timeline">
            {logs.map(log => (
              <div key={log.log_id} className="log-item-card">
                <div className="log-item-main">
                  <div className="log-meta-top">
                    <span className={`log-badge ${getActionClass(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="log-username"><FaUser className="mr-1"/> @{log.username}</span>
                  </div>
                  <p className="log-details">{log.details}</p>
                </div>
                
                <div className="log-item-actions">
                  <span className="log-time"><FaClock className="mr-1"/> {formatDate(log.created_at)}</span>
                  <button onClick={() => handleDeleteLog(log.log_id)} className="btn-delete-log">
                    <FaTrash /> ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminActivityLog;