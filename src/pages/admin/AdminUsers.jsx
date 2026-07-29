import { useState, useEffect } from 'react';
import { 
  FaUsersCog, FaUserPlus, FaTrash, FaUserShield, FaUser, 
  FaKey, FaSearch, FaFilter, FaExchangeAlt, FaUserLock, 
  FaUserCheck, FaBan, FaTimes 
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import bcrypt from 'bcryptjs';
import { sendDiscordNotify } from '../../utils/discord';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ username: '', password: '', role: 'admin', room_access: 'room1' });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState('admin');
  const [newRoomAccess, setNewRoomAccess] = useState('room1');
  const [roleLoading, setRoleLoading] = useState(false);

  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [suspendDays, setSuspendDays] = useState('1');
  const suspendOptions = [1, 3, 5, 7, 9, 15, 30, 60, 90];

  const userStr = localStorage.getItem('se_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // ดึงข้อมูลทั้งหมดรวมถึง name, surname มาด้วย
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const isSuspended = (suspendedUntil) => {
    if (!suspendedUntil) return false;
    return new Date(suspendedUntil) > new Date();
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) return;
    
    const { data: existUser } = await supabase.from('users').select('username').eq('username', formData.username).single();
    if (existUser) {
      alert('ชื่อผู้ใช้นี้มีในระบบแล้ว!');
      return;
    }

    const hashedPassword = bcrypt.hashSync(formData.password, 10);
    const { error } = await supabase.from('users').insert([{ 
      username: formData.username, 
      password_hash: hashedPassword, 
      role: formData.role,
      room_access: formData.room_access 
    }]);

    if (error) alert('สร้างบัญชีไม่สำเร็จ: ' + error.message);
    else {
      sendDiscordNotify('จัดการผู้ใช้งานระบบ', 'CREATE', `เพิ่มบัญชีใหม่: @${formData.username} (${formData.role}, ห้อง: ${formData.room_access})`, currentUser.username);
      alert('เพิ่มผู้ใช้ใหม่สำเร็จ!');
      setFormData({ username: '', password: '', role: 'admin', room_access: 'room1' });
      fetchUsers();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) return;
    setResetLoading(true);
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: logs } = await supabase.from('password_reset_logs')
        .select('*').eq('target_user_id', selectedUser.user_id).gte('reset_time', threeDaysAgo.toISOString());

      if (logs && logs.length >= 2) {
        alert('❌ ไม่สามารถเปลี่ยนรหัสผ่านได้! เนื่องจากผู้ใช้รายนี้ถูกเปลี่ยนรหัสผ่านครบกำหนด 2 ครั้งภายใน 3 วันแล้ว');
        setResetLoading(false); return;
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await supabase.from('users').update({ password_hash: hashedPassword }).eq('user_id', selectedUser.user_id);
      await supabase.from('password_reset_logs').insert([{ admin_id: currentUser?.user_id, target_user_id: selectedUser.user_id }]);
      
      sendDiscordNotify('จัดการผู้ใช้งานระบบ', 'UPDATE', `รีเซ็ตรหัสผ่านของบัญชี: @${selectedUser.username}`, currentUser.username);
      
      alert(`เปลี่ยนรหัสผ่านของ @${selectedUser.username} สำเร็จแล้ว!`);
      setSelectedUser(null); setNewPassword('');
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setRoleLoading(true);

    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: logs } = await supabase.from('role_change_logs')
        .select('*').eq('admin_id', currentUser?.user_id).gte('created_at', threeDaysAgo.toISOString());
      
      if (logs && logs.length >= 2) {
        alert('❌ คุณใช้สิทธิ์ปรับตำแหน่งเกินโควต้าแล้ว (2 ครั้ง / 3 วัน)');
        setRoleLoading(false); return;
      }

      if (currentUser?.role === 'admin' && newRole === 'super_admin') {
         alert('สิทธิ์ของคุณไม่สามารถปรับใครเป็น Super Admin ได้');
         setRoleLoading(false); return;
      }

      const { error: updateError } = await supabase.from('users').update({ 
        role: newRole,
        room_access: newRoomAccess
      }).eq('user_id', roleModalUser.user_id);

      if (updateError) throw updateError;

      await supabase.from('role_change_logs').insert([{
        admin_id: currentUser?.user_id,
        target_user_id: roleModalUser.user_id,
        old_role: roleModalUser.role,
        new_role: newRole
      }]);

      sendDiscordNotify('จัดการผู้ใช้งานระบบ', 'UPDATE', `ปรับสิทธิ์ @${roleModalUser.username} เป็น ${newRole} (ห้อง: ${newRoomAccess})`, currentUser.username);

      alert(`ปรับสิทธิ์และพื้นที่ของ @${roleModalUser.username} สำเร็จ!`);
      setRoleModalUser(null);
      fetchUsers();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setRoleLoading(false);
    }
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!suspendModalUser) return;

    const unbanDate = new Date();
    unbanDate.setDate(unbanDate.getDate() + parseInt(suspendDays));

    const { error } = await supabase
      .from('users')
      .update({ suspended_until: unbanDate.toISOString() })
      .eq('user_id', suspendModalUser.user_id);

    if (!error) {
      sendDiscordNotify('จัดการผู้ใช้งานระบบ', 'UPDATE', `ระงับบัญชี @${suspendModalUser.username} เป็นเวลา ${suspendDays} วัน`, currentUser.username);
      alert(`ระงับบัญชี @${suspendModalUser.username} เป็นเวลา ${suspendDays} วัน สำเร็จ`);
      setSuspendModalUser(null);
      fetchUsers();
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleUnsuspend = async (user) => {
    if (window.confirm(`คุณต้องการปลดแบน @${user.username} ใช่หรือไม่?`)) {
      const { error } = await supabase
        .from('users')
        .update({ suspended_until: null })
        .eq('user_id', user.user_id);
      if (!error) {
        sendDiscordNotify('จัดการผู้ใช้งานระบบ', 'UPDATE', `ปลดแบนบัญชี @${user.username}`, currentUser.username);
        fetchUsers();
      }
    }
  };

  const handleDelete = async (id, role, username) => {
    if (role === 'super_admin') { alert('ไม่อนุญาตให้ลบบัญชี Super Admin ได้!'); return; }
    if (window.confirm('คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่? (ย้อนกลับไม่ได้)')) {
      const { error } = await supabase.from('users').delete().eq('user_id', id);
      if (!error) {
        sendDiscordNotify('จัดการผู้ใช้งานระบบ', 'DELETE', `ลบบัญชีผู้ใช้งาน: @${username}`, currentUser.username);
        fetchUsers();
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const safeUsername = u.username || ''; 
    const fullName = `${u.name || ''} ${u.surname || ''}`.toLowerCase();
    const searchStr = (searchTerm || '').toLowerCase();
    
    const matchesSearch = safeUsername.toLowerCase().includes(searchStr) || fullName.includes(searchStr);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    // 🟢 เพิ่ม w-full และ overflow-x-hidden ป้องกันสไลด์ซ้าย-ขวา
    <div className="w-full max-w-7xl mx-auto relative animate-fade-in font-prompt overflow-x-hidden pb-12">
      
      {/* 🔮 Ambient Background Glows (ขังไว้ในกรอบ) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 mb-8">
        <h3 className="m-0 font-extrabold text-slate-800 dark:text-white text-2xl md:text-3xl flex items-center mb-2 tracking-tight">
          <FaUsersCog className="text-indigo-500 mr-3 drop-shadow-md" /> จัดการผู้ใช้งานระบบ
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base ml-10 md:ml-12">
          สิทธิ์เฉพาะ Super Admin ในการจัดการบัญชีผู้ดูแลและผู้ช่วยสอน
        </p>
      </div>

      {/* 📊 Stats Cards (ดีไซน์ใหม่แบบ Glassmorphism) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 relative z-10">
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">ผู้ใช้งานทั้งหมด</p>
            <h4 className="text-3xl font-black text-slate-800 dark:text-white">{users.length} <span className="text-base font-medium text-slate-500">บัญชี</span></h4>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl shadow-inner">
            <FaUsersCog />
          </div>
        </div>
        
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Super Admin</p>
            <h4 className="text-3xl font-black text-purple-600 dark:text-purple-400">{users.filter(u => u.role === 'super_admin').length} <span className="text-base font-medium text-slate-500">บัญชี</span></h4>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shadow-inner">
            <FaUserShield />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 dark:border-slate-700/50 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Admin (ผู้ช่วยสอน)</p>
            <h4 className="text-3xl font-black text-sky-600 dark:text-sky-400">{users.filter(u => u.role === 'admin').length} <span className="text-base font-medium text-slate-500">บัญชี</span></h4>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-2xl shadow-inner">
            <FaUser />
          </div>
        </div>
      </div>

      {/* 🛠️ Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10">
        
        {/* Left Col: Add User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 p-6 md:p-8 transition-all hover:shadow-lg">
            <h5 className="font-extrabold text-slate-800 dark:text-white mb-6 flex items-center text-xl">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-xl mr-3 shadow-md shadow-blue-500/20">
                <FaUserPlus size={16} />
              </div>
              เพิ่มบัญชีใหม่
            </h5>
            
            <form onSubmit={handleAddUser} className="space-y-5" autoComplete="off">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5 ml-1">ชื่อผู้ใช้ (Username)</label>
                <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5 ml-1">รหัสผ่าน (Password)</label>
                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5 ml-1">ระดับสิทธิ์ (Role)</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner">
                  <option value="admin">ผู้ช่วยสอน (Admin)</option>
                  {currentUser?.role === 'super_admin' && <option value="super_admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5 ml-1">สิทธิ์พื้นที่ (Room)</label>
                <select name="room_access" value={formData.room_access} onChange={handleChange} className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner">
                  <option value="room1">ห้อง 1 (เทียบโอน)</option>
                  <option value="room2">ห้อง 2 (ปกติ 4 ปี)</option>
                  <option value="all">เข้าได้ทุกห้อง (ทั้งหมด)</option>
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold rounded-xl py-3.5 hover:from-indigo-600 hover:to-blue-700 shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all transform hover:-translate-y-0.5">
                  <FaUserPlus className="mr-2" /> สร้างบัญชีใหม่
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Users Table */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden flex flex-col flex-1">
            
            {/* Search & Filter Bar */}
            <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อ, นามสกุล, Username..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <FaFilter className="text-slate-400 text-sm hidden sm:block" />
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)} 
                  className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer shadow-inner"
                >
                  <option value="all">ดูสิทธิ์ทั้งหมด</option>
                  <option value="super_admin">เฉพาะ Super Admin</option>
                  <option value="admin">เฉพาะ Admin</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto custom-scrollbar p-0">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-100/50 dark:bg-slate-700/30">
                  <tr>
                    <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">ผู้ใช้งาน</th>
                    <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">สิทธิ์ / พื้นที่</th>
                    <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center">สถานะ</th>
                    <th className="py-4 px-6 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {loading ? (
                    <tr><td colSpan="4" className="text-center py-16 dark:text-slate-400"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>กำลังโหลดข้อมูล...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-16 text-slate-500 dark:text-slate-400">ไม่พบผู้ใช้งานที่ตรงกับการค้นหา</td></tr>
                  ) : filteredUsers.map((u) => {
                    const currentlySuspended = isSuspended(u.suspended_until);
                    const isMe = currentUser?.username === u.username;
                    const displayName = u.name && u.surname ? `${u.name} ${u.surname}` : u.username;

                    return (
                      <tr key={u.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-700 shadow-sm ${currentlySuspended ? 'bg-red-500' : (u.role === 'super_admin' ? 'bg-indigo-600' : 'bg-slate-400')}`}>
                                  {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                                </div>
                              )}
                              {isMe && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-slate-800 dark:text-white truncate" title={displayName}>
                                {displayName}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                @{u.username} {isMe && <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">คุณ</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col items-start gap-1.5">
                            {u.role === 'super_admin' ? (
                              <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/50 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm"><FaUserShield className="mr-1.5" /> Super Admin</span>
                            ) : (
                              <span className="inline-flex items-center bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm"><FaUser className="mr-1.5" /> Admin</span>
                            )}
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              ห้อง: {u.room_access === 'room1' ? '1 (เทียบโอน)' : u.room_access === 'room2' ? '2 (ปกติ 4 ปี)' : u.room_access === 'all' ? 'เข้าได้ทั้งหมด' : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {currentlySuspended ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2.5 py-1 rounded border border-red-200 dark:border-red-800 shadow-sm flex items-center gap-1"><FaBan size={10}/> ถูกระงับ</span>
                              <span className="text-[10px] text-slate-500 mt-1">ถึง: {new Date(u.suspended_until).toLocaleDateString('th-TH')}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center text-emerald-500 dark:text-emerald-400 text-xs font-bold"><FaUserCheck className="mr-1" /> ปกติ</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => { setRoleModalUser(u); setNewRole(u.role); setNewRoomAccess(u.room_access || 'room1'); }} className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all shadow-sm" title="ปรับสิทธิ์และพื้นที่">
                              <FaExchangeAlt size={14} />
                            </button>
                            <button onClick={() => setSelectedUser(u)} className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all shadow-sm" title="รีเซ็ตรหัสผ่าน">
                              <FaKey size={14} />
                            </button>
                            
                            {isSuperAdmin && !isMe && (
                              currentlySuspended ? (
                                <button onClick={() => handleUnsuspend(u)} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="ปลดแบน">
                                  <FaUserCheck size={14} />
                                </button>
                              ) : (
                                <button onClick={() => setSuspendModalUser(u)} className="p-2 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all shadow-sm" disabled={u.role === 'super_admin'} title={u.role === 'super_admin' ? "ไม่สามารถแบน Super Admin ได้" : "ระงับบัญชี"}>
                                  <FaUserLock size={14} />
                                </button>
                              )
                            )}

                            <button onClick={() => handleDelete(u.user_id, u.role, u.username)} className={`p-2 rounded-lg border transition-all shadow-sm ${u.role === 'super_admin' ? 'bg-slate-50 border-slate-100 text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600 cursor-not-allowed' : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 hover:bg-red-500 hover:text-white'}`} disabled={u.role === 'super_admin'} title={u.role === 'super_admin' ? "ห้ามลบ Super Admin" : "ลบผู้ใช้"}>
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 🔮 Modals (Glassmorphism Style) */}
      
      {/* Reset Password Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setResetLoading ? null : setSelectedUser(null)}></div>
          <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-600/50 p-8 transform transition-all animate-fade-in">
            <h4 className="font-extrabold text-slate-800 dark:text-white text-xl mb-2 flex items-center">
              <div className="p-2 bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg mr-3 shadow-sm"><FaKey size={16} /></div>
              รีเซ็ตรหัสผ่าน
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              ตั้งรหัสผ่านใหม่ให้กับ <b>@{selectedUser.username}</b> <br/><span className="text-red-500 text-xs">* จำกัดสิทธิ์แก้ไข 2 ครั้ง / 3 วัน</span>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <input type="password" required minLength="6" placeholder="รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={() => setSelectedUser(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={resetLoading} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-500/30 disabled:opacity-50 transition-all flex items-center">
                  {resetLoading ? 'กำลังบันทึก...' : 'ยืนยันรหัสผ่านใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRoleLoading ? null : setRoleModalUser(null)}></div>
          <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-600/50 p-8 transform transition-all animate-fade-in">
            <h4 className="font-extrabold text-slate-800 dark:text-white text-xl mb-2 flex items-center">
              <div className="p-2 bg-sky-100 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400 rounded-lg mr-3 shadow-sm"><FaExchangeAlt size={16} /></div>
              ปรับระดับสิทธิ์และพื้นที่
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              ตั้งค่าสิทธิ์ให้ <b>@{roleModalUser.username}</b> <br/><span className="text-red-500 text-xs">* ปรับได้ระดับเดียวกันหรือต่ำกว่า (2 ครั้ง / 3 วัน)</span>
            </p>
            <form onSubmit={handleChangeRole} className="space-y-5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 ml-1">ระดับสิทธิ์ (Role)</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-4 py-3 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-sky-500 shadow-inner">
                  <option value="admin">ผู้ช่วยสอน (Admin)</option>
                  {currentUser?.role === 'super_admin' && <option value="super_admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 ml-1">พื้นที่ดูแล (Room Access)</label>
                <select value={newRoomAccess} onChange={(e) => setNewRoomAccess(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-4 py-3 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-sky-500 shadow-inner">
                  <option value="room1">ห้อง 1 (เทียบโอน)</option>
                  <option value="room2">ห้อง 2 (ปกติ 4 ปี)</option>
                  <option value="all">เข้าได้ทุกห้อง (ทั้งหมด)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={() => setRoleModalUser(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={roleLoading} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-blue-500/30 disabled:opacity-50 transition-all">
                  {roleLoading ? 'กำลังบันทึก...' : 'ยืนยันการปรับสิทธิ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSuspendModalUser(null)}></div>
          <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-600/50 p-8 overflow-hidden transform transition-all animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500"></div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-xl mb-2 flex items-center mt-2">
              <div className="p-2 bg-orange-100 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400 rounded-lg mr-3 shadow-sm"><FaUserLock size={16} /></div>
              ระงับบัญชีผู้ใช้งาน
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              ผู้ใช้ <b>@{suspendModalUser.username}</b> จะไม่สามารถเข้าสู่ระบบหลังบ้านได้ตามระยะเวลาที่คุณกำหนด
            </p>
            
            <form onSubmit={handleSuspend} className="space-y-5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 ml-1">เลือกระยะเวลา (วัน)</label>
                <select 
                  value={suspendDays} 
                  onChange={(e) => setSuspendDays(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl px-4 py-3 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-orange-500 shadow-inner"
                >
                  {suspendOptions.map(day => (
                    <option key={day} value={day}>{day} วัน</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={() => setSuspendModalUser(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">ยกเลิก</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-500/30 transition-all flex items-center">
                  <FaBan className="mr-2"/> ยืนยันการแบน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers;