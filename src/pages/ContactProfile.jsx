import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './ContactProfile.css';

const ContactProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    nickname: '',
    ig: '',
    facebook: '',
    tel: '',
    email: ''
  });

  useEffect(() => {
    // โหลดข้อมูลเก่ามาแสดง (ถ้ามี)
    const loadData = async () => {
      try {
        const userStr = localStorage.getItem('se_user');
        if (!userStr) return;
        
        const sessionData = JSON.parse(userStr);
        if (!sessionData?.user_id) return; // เช็ค user_id จาก Session
        
        const { data, error } = await supabase
          .from('users')
          .select('name, surname, nickname, ig, facebook, tel, email')
          .eq('user_id', sessionData.user_id)
          .single();
          
        if (data && !error) {
          setFormData({
            name: data.name || '',
            surname: data.surname || '',
            nickname: data.nickname || '',
            ig: data.ig || '',
            facebook: data.facebook || '',
            tel: data.tel || '',
            email: data.email || sessionData.email || ''
          });
        }
      } catch (err) {
        console.error('Load data error:', err);
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const { name, surname, nickname, ig, facebook, tel, email } = formData;
    
    if (!name || !surname || !nickname || !ig || !facebook || !tel || !email) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setLoading(true);
    try {
      // 1. ดึงข้อมูลจาก LocalStorage เพื่อหา user_id
      const userStr = localStorage.getItem('se_user');
      if (!userStr) {
        throw new Error('Session หมดอายุ กรุณาล็อกอินใหม่');
      }
      
      const sessionData = JSON.parse(userStr);
      
      // 2. เช็ค user_id ให้ชัวร์ว่าไม่เป็น null
      if (!sessionData || !sessionData.user_id) {
        throw new Error('ไม่พบ user_id ในระบบ');
      }
      
      // 3. ยิง Update เข้า Supabase ตรงๆ (อ้างอิงคอลัมน์ user_id)
      const { error } = await supabase
        .from('users')
        .update({ 
          name: name, 
          surname: surname, 
          nickname: nickname, 
          ig: ig, 
          facebook: facebook, 
          tel: tel, 
          email: email
        })
        .eq('user_id', sessionData.user_id);

      if (error) throw error;
      
      // 4. บันทึกเสร็จให้ไปหน้า portal
      navigate('/admin/portal');
      
    } catch (error) {
      console.error('Update Error:', error);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error.message || 'Unknown Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="liquid-glass-card">
        <h2 className="profile-title">อัปเดตข้อมูลการติดต่อ</h2>
        <p className="profile-subtitle">จำเป็นต้องกรอกข้อมูลให้ครบถ้วนก่อนเข้าใช้งานระบบหลังบ้าน</p>
        
        {errorMsg && <div className="profile-error">{errorMsg}</div>}
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>ชื่อจริง (Name)</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>นามสกุล (Surname)</label>
              <input type="text" name="surname" value={formData.surname} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>ชื่อเล่น (Nickname)</label>
            <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Instagram</label>
              <input type="text" name="ig" value={formData.ig} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Facebook</label>
              <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>เบอร์โทรศัพท์ (Tel)</label>
              <input type="tel" name="tel" value={formData.tel} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>อีเมล (Email)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="glass-submit-btn" disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'ยืนยันและเข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactProfile;