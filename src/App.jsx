import { Routes, Route } from 'react-router-dom'

// หน้าฝั่งผู้เข้าชม
import GuestIndex from './pages/GuestIndex'
import Download from './pages/Download'


// หน้าเข้าสู่ระบบและหน้าเลือกห้อง
import AdminLogin from './pages/admin/AdminLogin'
import AdminPortal from './pages/admin/AdminPortal';

// โครงสร้างหลัก (Sidebar & Navbar)
import AdminLayout from './components/AdminLayout'

// หน้าจัดการระบบต่างๆ
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSubjects from './pages/admin/AdminSubjects'
import AdminSemesters from './pages/admin/AdminSemesters'
import AdminSchedules from './pages/admin/AdminSchedules'
import AdminAssignments from './pages/admin/AdminAssignments'
import AdminAssignmentsCreate from './pages/admin/AdminAssignmentsCreate'
import AdminAssignmentsEdit from './pages/admin/AdminAssignmentsEdit'
import AdminLinks from './pages/admin/AdminLinks'
import AdminUsers from './pages/admin/AdminUsers'
import AdminProfile from './pages/admin/AdminProfile'

import AdminSubmissionTracking from './pages/admin/AdminSubmissionTracking'
import AdminResourceCenter from './pages/admin/AdminResourceCenter'
import AdminActivityLog from './pages/admin/AdminActivityLog'
import AdminManual from './pages/admin/AdminManual'

// งานภายในรายวิชา (ชีท/สไลด์)
import AdminWeeklyMaterials from './pages/admin/AdminWeeklyMaterials'
import AdminWeeklyMaterialsCreate from './pages/admin/AdminWeeklyMaterialsCreate'
import AdminWeeklyMaterialsEdit from './pages/admin/AdminWeeklyMaterialsEdit'

// หน้า Statement สำหรับตรวจสอบการโอนเงิน
import AdminStatement from './pages/admin/AdminStatement'

// 🟢 หน้าประกาศข่าวสาร
import AdminAnnouncements from './pages/admin/AdminAnnouncements'

// นำเข้าไฟล์ Privacy Policy และ License
import PrivacyPolicy from './pages/PrivacyPolicy'
import License from './pages/License'

function App() {
  return (
    <Routes>
      {/* ฝั่งผู้เยี่ยมชม (Guest) */}
      <Route path="/" element={<GuestIndex />} />
      <Route path="/download" element={<Download />} />
      
      {/* นโยบายและข้อตกลงสำหรับ Guest Mode */}
      <Route path="/privacy-policy" element={<PrivacyPolicy mode="guest" />} />
      <Route path="/license" element={<License mode="guest" />} />

      {/* หน้า Login (ไม่มี Sidebar) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* หน้า Portal สำหรับเลือกห้องก่อนเข้า Dashboard (ไม่มี Sidebar) */}
      <Route path="/admin/portal" element={<AdminPortal />} />

      {/* ฝั่ง Admin (มี Sidebar และ Navbar ควบคุมห้อง) */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* หน้าแรกของ Admin */}
        <Route index element={<AdminDashboard />} /> 
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* จัดการระบบ (Super Admin) */}
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="semesters" element={<AdminSemesters />} />
        <Route path="subjects" element={<AdminSubjects />} />
        
        {/* บันทึกกิจกรรมระบบ */}
        <Route path="activity-log" element={<AdminActivityLog />} />

        {/* ระบบตรวจสอบการโอนเงิน (Statement) */}
        <Route path="statement" element={<AdminStatement />} />
        
        {/* การจัดการงานและตารางเรียน */}
        <Route path="schedules" element={<AdminSchedules />} />
        <Route path="submission-tracking" element={<AdminSubmissionTracking />} />
        
        {/* งานภายในรายวิชา (Assignments สั่งงาน/ส่งงาน) */}
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="assignments/create" element={<AdminAssignmentsCreate />} />
        <Route path="assignments/edit/:id" element={<AdminAssignmentsEdit />} />
        
        {/* งานภายในรายวิชา (ชีท/สไลด์/ลิงก์แนบ) */}
        <Route path="AdminWeeklyMaterials" element={<AdminWeeklyMaterials />} />
        <Route path="AdminWeeklyMaterials/create" element={<AdminWeeklyMaterialsCreate />} />
        <Route path="AdminWeeklyMaterials/edit/:id" element={<AdminWeeklyMaterialsEdit />} />

        <Route path="links" element={<AdminLinks />} />

        {/* คลังเอกสาร และ คู่มือ */}
        <Route path="resource-center" element={<AdminResourceCenter />} />
        <Route path="manual" element={<AdminManual />} />

        {/* โปรไฟล์และอื่นๆ */}
        <Route path="profile" element={<AdminProfile />} />

        {/* นโยบายและข้อตกลงสำหรับ Admin Mode (ฝังใน Layout) */}
        <Route path="privacy-policy" element={<PrivacyPolicy mode="admin" />} />
        <Route path="license" element={<License mode="admin" />} />
      </Route>
    </Routes>
  )
}

export default App