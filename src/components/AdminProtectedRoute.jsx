import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AdminProtectedRoute = ({ children }) => {
  const [isProfileComplete, setIsProfileComplete] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const userStr = localStorage.getItem('se_user');
      if (!userStr) {
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      const sessionData = JSON.parse(userStr);

      // เช็ค user_id จาก session
      if (!sessionData?.user_id) {
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      // ตรวจสอบข้อมูล profile
      const { data: profile, error } = await supabase
        .from('users') 
        .select('name, surname, nickname, ig, facebook, tel, email')
        .eq('user_id', sessionData.user_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase Error:', error);
      }

      // เช็คว่ามีข้อมูลครบทั้ง 7 ฟิลด์หรือไม่
      const hasAllInfo = !!(
        profile?.name && 
        profile?.surname && 
        profile?.nickname && 
        profile?.ig && 
        profile?.facebook && 
        profile?.tel && 
        profile?.email
      );

      setIsProfileComplete(hasAllInfo);
    } catch (error) {
      console.error('Error checking profile:', error);
      setIsProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-[#38bdf8] font-bold font-prompt">
        กำลังตรวจสอบข้อมูลโปรไฟล์...
      </div>
    );
  }

  // ไม่ครบ เด้งไปหน้าฟอร์ม
  if (!isProfileComplete) {
    return <Navigate to="/contact-profile" replace />;
  }

  // ครบแล้ว เข้าหลังบ้านได้
  return children;
};

export default AdminProtectedRoute;