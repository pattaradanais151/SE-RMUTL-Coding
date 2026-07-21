import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // เก็บค่าห้องที่เลือกไว้ใน localStorage เพื่อไม่ให้ค่าหายตอนรีเฟรชหน้าเว็บ
  const [activeRoom, setActiveRoom] = useState(localStorage.getItem('activeRoom') || null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      // เช็ก Session ว่ามีการล็อกอินอยู่หรือไม่
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        setLoading(false);
        return;
      }

      // ดึงข้อมูลสิทธิ์จากตาราง profiles (แก้ไขชื่อตารางตามจริงของคุณถ้าใช้ชื่ออื่น เช่น users)
      // สมมติว่าในฐานข้อมูลมีคอลัมน์ role ('admin', 'super_admin') และ allowed_rooms (['room1', 'room2'])
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, allowed_rooms')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setAdminProfile(profileData);
      }
    } catch (error) {
      console.error('Unexpected error in AdminContext:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeRoom = (roomId) => {
    setActiveRoom(roomId);
    localStorage.setItem('activeRoom', roomId);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setActiveRoom(null);
    setAdminProfile(null);
    localStorage.removeItem('activeRoom');
    navigate('/admin/login');
  };

  return (
    <AdminContext.Provider value={{ activeRoom, changeRoom, adminProfile, loading, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

// Hook สำหรับเรียกใช้งาน Context ได้ง่ายๆ
export const useAdmin = () => useContext(AdminContext);