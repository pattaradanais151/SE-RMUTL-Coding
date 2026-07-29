import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FaUserCircle, FaInstagram, FaFacebook, FaPhoneAlt, FaEnvelope, FaSearch, FaUserTie } from 'react-icons/fa';

const AdminContacts = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, role, avatar_url, name, surname, nickname, ig, facebook, tel, email')
        .order('role', { ascending: false }) // ให้ super_admin ขึ้นก่อน
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ค้นหาจากชื่อ นามสกุล ชื่อเล่น หรือ username
  const filteredUsers = users.filter(u => {
    const searchStr = searchTerm.toLowerCase();
    const fullName = `${u.name || ''} ${u.surname || ''}`.toLowerCase();
    const nickname = (u.nickname || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    return fullName.includes(searchStr) || nickname.includes(searchStr) || username.includes(searchStr);
  });

  return (
    // เพิ่ม w-full และ overflow-x-hidden เพื่อป้องกันการเลื่อนซ้าย-ขวาเด็ดขาด
    <div className="w-full max-w-7xl mx-auto relative animate-fade-in font-prompt overflow-x-hidden pb-10">
      
      {/* Ambient Background Glows (ถูกขังไว้ในกรอบ ไม่ให้ทะลุจอ) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-sky-500/10 dark:bg-sky-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 space-y-6">
        
        {/* Header & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
              <FaUserTie size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">รายชื่อแอดมิน</h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                ข้อมูลการติดต่อของเพื่อนๆ ในทีม (Admin & Super Admin)
              </p>
            </div>
          </div>
          
          <div className="relative w-full lg:w-80">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ชื่อเล่น..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none dark:text-white transition-all shadow-inner text-sm md:text-base font-medium"
            />
          </div>
        </div>

        {/* Contact Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 dark:text-slate-400">
            <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
            <p className="font-semibold">กำลังโหลดข้อมูลเพื่อนๆ...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-32 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-sm">
            <FaUserCircle className="text-6xl mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">ไม่พบรายชื่อแอดมินที่ค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <div 
                key={user.user_id} 
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-md hover:shadow-xl border border-white/50 dark:border-slate-700/50 transition-all duration-300 hover:-translate-y-1.5 flex flex-col group"
              >
                
                {/* Profile Top */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-slate-600 shadow-md flex-shrink-0 bg-slate-100 dark:bg-slate-700 group-hover:scale-105 transition-transform duration-300">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="overflow-hidden flex-1">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate">
                      {user.name && user.surname ? `${user.name} ${user.surname}` : user.username}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        user.role === 'super_admin' 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700/50 dark:text-indigo-400' 
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                      }`}>
                        {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                      {user.nickname && (
                         <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 truncate">
                           ({user.nickname})
                         </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info (จัด Layout ให้ดูโล่งตาขึ้น) */}
                <div className="space-y-2 mt-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FaInstagram size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate select-all">
                      {user.ig || <span className="text-slate-400 font-normal italic">ไม่ระบุ</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FaFacebook size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate select-all">
                      {user.facebook || <span className="text-slate-400 font-normal italic">ไม่ระบุ</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FaPhoneAlt size={12} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate select-all">
                      {user.tel || <span className="text-slate-400 font-normal italic">ไม่ระบุ</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FaEnvelope size={12} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate select-all">
                      {user.email || <span className="text-slate-400 font-normal italic">ไม่ระบุ</span>}
                    </span>
                  </div>

                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContacts;