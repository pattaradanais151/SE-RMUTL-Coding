import { Routes, Route } from 'react-router-dom'

// --- นำเข้าระบบแจ้งเตือนอัพเดท ---
import UpdateNotifier from './components/UpdateNotifier'

// 🟢 นำเข้าระบบจัดการ Profile และ Guard (ที่เพิ่มใหม่)
import AdminProtectedRoute from './components/AdminProtectedRoute'
import ContactProfile from './pages/ContactProfile'

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

// หน้าประกาศข่าวสาร
import AdminAnnouncements from './pages/admin/AdminAnnouncements'

// 🟢 นำเข้าหน้ารายชื่อเพื่อนแอดมิน
import AdminContacts from './pages/admin/AdminContacts'

// นำเข้าไฟล์ Privacy Policy และ License
import PrivacyPolicy from './pages/PrivacyPolicy'
import License from './pages/License'

function App() {
  return (
    <>
      {/* ระบบแจ้งเตือนอัพเดท */}
      <UpdateNotifier />

      <Routes>
        {/* ฝั่งผู้เยี่ยมชม (Guest) */}
        <Route path="/" element={<GuestIndex />} />
        <Route path="/download" element={<Download />} />
        
        {/* นโยบายและข้อตกลงสำหรับ Guest Mode */}
        <Route path="/privacy-policy" element={<PrivacyPolicy mode="guest" />} />
        <Route path="/license" element={<License mode="guest" />} />

        {/* หน้า Login (ไม่มี Sidebar) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 🟢 หน้า Contact Profile (บังคับกรอกข้อมูลก่อนเข้าใช้งาน) */}
        <Route path="/contact-profile" element={<ContactProfile />} />
        
        {/* 🟢 หน้า Portal สำหรับเลือกห้อง หุ้มด้วย Guard ตรวจสอบ Profile */}
        <Route 
          path="/admin/portal" 
          element={
            <AdminProtectedRoute>
              <AdminPortal />
            </AdminProtectedRoute>
          } 
        />

        {/* 🟢 ฝั่ง Admin (มี Sidebar และ Navbar ควบคุมห้อง) หุ้มด้วย Guard ตรวจสอบ Profile เช่นกัน */}
        <Route 
          path="/admin" 
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
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

          {/* 🟢 หน้าโปรไฟล์เพื่อนแอดมิน */}
          <Route path="contacts" element={<AdminContacts />} />

          {/* โปรไฟล์และอื่นๆ */}
          <Route path="profile" element={<AdminProfile />} />

          {/* นโยบายและข้อตกลงสำหรับ Admin Mode (ฝังใน Layout) */}
          <Route path="privacy-policy" element={<PrivacyPolicy mode="admin" />} />
          <Route path="license" element={<License mode="admin" />} />
        </Route>
      </Routes>
    </>
  )
}

export default App