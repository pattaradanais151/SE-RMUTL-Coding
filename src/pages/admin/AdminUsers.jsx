import { useState, useEffect } from 'react'
import { FaUsersCog, FaUserPlus, FaTrash, FaUserShield, FaUser, FaKey, FaSearch, FaFilter, FaExchangeAlt, FaUserLock, FaUserCheck, FaBan, FaTimes } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import bcrypt from 'bcryptjs'
import { sendDiscordNotify } from '../../utils/discord'

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🟢 เพิ่ม room_access
  const [formData, setFormData] = useState({ username: '', password: '', role: 'admin', room_access: 'room1' });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState('admin');
  const [newRoomAccess, setNewRoomAccess] = useState('room1'); // 🟢 ตัวเลือกห้องเวลาเปลี่ยนสิทธิ์
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
    // 🟢 Insert room_access ลงฐานข้อมูล
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

      // 🟢 Update ทั้ง role และ room_access
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
    const matchesSearch = safeUsername.toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h3 className="m-0 font-bold text-slate-800 dark:text-white text-2xl flex items-center mb-1"><FaUsersCog className="text-indigo-600 dark:text-indigo-400 mr-3" /> จัดการผู้ใช้งานระบบ</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm m-0">สิทธิ์เฉพาะ Super Admin ในการจัดการบัญชีผู้ดูแลและผู้ช่วยสอน</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-sm">
          <div className="text-sm opacity-80">ผู้ใช้งานทั้งหมด</div>
          <div className="text-2xl font-bold">{users.length} บัญชี</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-sm">
          <div className="text-sm opacity-80">Super Admin</div>
          <div className="text-2xl font-bold">{users.filter(u => u.role === 'super_admin').length} บัญชี</div>
        </div>
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-4 text-white shadow-sm">
          <div className="text-sm opacity-80">Admin (ผู้ช่วยสอน)</div>
          <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length} บัญชี</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mb-6 transition-colors">
            <h5 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center"><FaUserPlus className="mr-2 text-indigo-500" /> เพิ่มบัญชีใหม่</h5>
            <form onSubmit={handleAddUser} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1">ชื่อผู้ใช้ (Username)</label>
                <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1">รหัสผ่าน (Password)</label>
                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1">ระดับสิทธิ์ (Role)</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="admin">ผู้ช่วยสอน (Admin)</option>
                  {currentUser?.role === 'super_admin' && <option value="super_admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>}
                </select>
              </div>
              {/* 🟢 Dropdown พื้นที่ */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1">สิทธิ์พื้นที่ (Room)</label>
                <select name="room_access" value={formData.room_access} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="room1">ห้อง 1 (เทียบโอน)</option>
                  <option value="room2">ห้อง 2 (ปกติ 4 ปี)</option>
                  <option value="all">เข้าได้ทุกห้อง (ทั้งหมด)</option>
                </select>
              </div>

              <button type="submit" className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-xl py-3 mt-4 hover:bg-indigo-700 transition-all">
                <FaUserPlus className="mr-2" /> สร้างบัญชี
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between transition-colors">
            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-3.5 text-slate-400 text-sm" />
              <input type="text" placeholder="ค้นหาชื่อผู้ใช้งาน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <FaFilter className="text-slate-400 text-sm" />
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-3 py-2 text-sm outline-none cursor-pointer">
                <option value="all">สิทธิ์ทั้งหมด</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow h-full overflow-hidden flex flex-col transition-colors">
            <div className="p-0 flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">ผู้ใช้งาน</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">สิทธิ์ / พื้นที่</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 text-center">สถานะ</th>
                    <th className="py-4 px-5 text-sm uppercase font-semibold text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="text-center py-8 dark:text-slate-300">กำลังโหลด...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-slate-400">ไม่พบข้อมูล</td></tr>
                  ) : filteredUsers.map((u) => {
                    const currentlySuspended = isSuspended(u.suspended_until);
                    const isMe = currentUser?.username === u.username;

                    return (
                      <tr key={u.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                        <td className="py-4 px-5 font-bold text-slate-700 dark:text-white flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${currentlySuspended ? 'bg-red-500' : (u.role === 'super_admin' ? 'bg-indigo-600' : 'bg-slate-400')}`}>
                              {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div>
                            <div>{u.username} {isMe && <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md ml-1 font-normal">คุณ</span>}</div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col items-start gap-1">
                            {u.role === 'super_admin' ? (
                              <span className="inline-flex items-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-md"><FaUserShield className="mr-1.5" /> Super Admin</span>
                            ) : (
                              <span className="inline-flex items-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-md"><FaUser className="mr-1.5" /> Admin</span>
                            )}
                            {/* 🟢 แสดงพื้นที่ของแอดมินคนนั้น */}
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                              {u.room_access === 'room1' ? 'ห้อง 1 (เทียบโอน)' : u.room_access === 'room2' ? 'ห้อง 2 (ปกติ 4 ปี)' : u.room_access === 'all' ? 'ทั้งหมด (All)' : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          {currentlySuspended ? (
                            <div className="flex flex-col items-center">
                              <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded border border-red-200 dark:border-red-800">ถูกระงับสิทธิ์</span>
                              <span className="text-[10px] text-slate-400 mt-1">ถึง: {new Date(u.suspended_until).toLocaleDateString('th-TH')}</span>
                            </div>
                          ) : (
                            <span className="text-emerald-500 text-xs font-bold"><FaUserCheck className="inline mr-1" /> ปกติ</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center flex items-center justify-center gap-1.5">
                          <button onClick={() => { setRoleModalUser(u); setNewRole(u.role); setNewRoomAccess(u.room_access || 'room1'); }} className="w-8 h-8 flex items-center justify-center rounded-md border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white transition-colors" title="ปรับสิทธิ์และพื้นที่">
                            <FaExchangeAlt className="text-xs" />
                          </button>
                          <button onClick={() => setSelectedUser(u)} className="w-8 h-8 flex items-center justify-center rounded-md border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors" title="รีเซ็ตรหัสผ่าน">
                            <FaKey className="text-xs" />
                          </button>
                          
                          {isSuperAdmin && !isMe && (
                            currentlySuspended ? (
                              <button onClick={() => handleUnsuspend(u)} className="w-8 h-8 flex items-center justify-center rounded-md border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors" title="ปลดแบน">
                                <FaUserCheck className="text-xs" />
                              </button>
                            ) : (
                              <button onClick={() => setSuspendModalUser(u)} className="w-8 h-8 flex items-center justify-center rounded-md border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white transition-colors" disabled={u.role === 'super_admin'} title={u.role === 'super_admin' ? "ไม่สามารถแบน Super Admin ได้" : "ระงับบัญชี"}>
                                <FaUserLock className="text-xs" />
                              </button>
                            )
                          )}

                          <button onClick={() => handleDelete(u.user_id, u.role, u.username)} className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${u.role === 'super_admin' ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'border-red-200 dark:border-red-900 text-red-500 hover:bg-red-500 hover:text-white'}`} disabled={u.role === 'super_admin'} title="ลบผู้ใช้">
                            <FaTrash className="text-xs" />
                          </button>
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

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-2 flex items-center"><FaKey className="mr-2 text-amber-500" /> รีเซ็ตรหัสผ่าน</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">เปลี่ยนรหัสผ่านสำหรับ <b>@{selectedUser.username}</b> <br/><span className="text-red-500 text-xs">* จำกัดสิทธิ์แก้ไข 2 ครั้ง/ 3 วัน</span></p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <input type="password" required minLength="6" placeholder="รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSelectedUser(null)} className="w-1/2 border dark:border-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-xl py-2 text-sm hover:bg-slate-200">ยกเลิก</button>
                <button type="submit" disabled={resetLoading} className="w-1/2 bg-indigo-600 text-white font-semibold rounded-xl py-2 text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {resetLoading ? 'กำลังบันทึก...' : 'ยืนยัน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-2 flex items-center"><FaExchangeAlt className="mr-2 text-sky-500" /> ปรับระดับสิทธิ์และพื้นที่</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">สำหรับบัญชี <b>@{roleModalUser.username}</b> <br/><span className="text-red-500 text-xs">* ปรับได้ระดับเดียวกันหรือต่ำกว่า (2 ครั้ง / 3 วัน)</span></p>
            <form onSubmit={handleChangeRole} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">ระดับสิทธิ์ (Role)</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer">
                  <option value="admin">ผู้ช่วยสอน (Admin)</option>
                  {currentUser?.role === 'super_admin' && <option value="super_admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>}
                </select>
              </div>
              {/* 🟢 ตัวเลือกเปลี่ยนพื้นที่ (Room Access) */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">พื้นที่ดูแล (Room Access)</label>
                <select value={newRoomAccess} onChange={(e) => setNewRoomAccess(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer">
                  <option value="room1">ห้อง 1 (เทียบโอน)</option>
                  <option value="room2">ห้อง 2 (ปกติ 4 ปี)</option>
                  <option value="all">เข้าได้ทุกห้อง (ทั้งหมด)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setRoleModalUser(null)} className="w-1/2 border dark:border-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-xl py-2 text-sm hover:bg-slate-200">ยกเลิก</button>
                <button type="submit" disabled={roleLoading} className="w-1/2 bg-sky-600 text-white font-semibold rounded-xl py-2 text-sm hover:bg-sky-700 disabled:opacity-50">
                  {roleLoading ? 'กำลังบันทึก...' : 'ยืนยันการปรับสิทธิ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {suspendModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500"></div>
            <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-2 flex items-center mt-2"><FaUserLock className="mr-2 text-orange-500 text-xl" /> ระงับบัญชีผู้ใช้งาน</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">ผู้ใช้ <b>@{suspendModalUser.username}</b> จะไม่สามารถเข้าสู่ระบบหลังบ้านได้ตามระยะเวลาที่คุณกำหนด</p>
            
            <form onSubmit={handleSuspend} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">เลือกระยะเวลา (วัน)</label>
                <select 
                  value={suspendDays} 
                  onChange={(e) => setSuspendDays(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-xl px-4 py-3 outline-none cursor-pointer focus:border-orange-500"
                >
                  {suspendOptions.map(day => (
                    <option key={day} value={day}>{day} วัน</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setSuspendModalUser(null)} className="w-1/2 border dark:border-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button type="submit" className="w-1/2 bg-orange-500 text-white font-bold rounded-xl py-2.5 text-sm hover:bg-orange-600 shadow-md transition-colors flex items-center justify-center">
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

export default AdminUsers