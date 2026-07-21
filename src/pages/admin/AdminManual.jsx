import { 
  FaBookOpen, FaUserPlus, FaCalendarAlt, FaTable, 
  FaClipboardList, FaChartPie, FaFolderOpen, 
  FaExclamationTriangle, FaCheckCircle, FaTrash, 
  FaUpload, FaLink, FaUserShield 
} from 'react-icons/fa'

const AdminManual = () => {
  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-10 text-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 pattern-grid-lg"></div>
        <FaBookOpen className="text-6xl mx-auto mb-4 text-indigo-200 relative z-10" />
        <h3 className="m-0 font-bold text-4xl mb-3 relative z-10">คู่มือการใช้งานระบบ SE-JOB</h3>
        <p className="text-indigo-100 opacity-90 text-lg relative z-10">เจาะลึกทุกฟังก์ชันแบบจับมือทำ (Step-by-Step)</p>
      </div>

      <div className="space-y-8">
        
        {/* Step 1 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center">
             <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mr-3">1</div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white">เริ่มต้นใช้งาน: ตั้งค่าโครงสร้างระบบ</h4>
          </div>
          <div className="p-6 text-slate-600 dark:text-slate-300 space-y-4">
             <p className="font-semibold text-slate-800 dark:text-white">ระบบนี้จำเป็นต้องมี "ปีการศึกษา" และ "รายวิชา" ก่อน ถึงจะสามารถสั่งงานได้</p>
             <ol className="list-decimal pl-5 space-y-3">
               <li>ไปที่เมนู <b>"จัดการภาค/เทอม"</b> กดเพิ่มปีการศึกษา (เช่น ปี 2568 เทอม 1)</li>
               <li>ไปที่เมนู <b>"จัดการรายวิชา"</b> กดเพิ่มรายวิชา โดยใส่รหัสวิชา ชื่อวิชา และชื่อผู้สอน
                 <br/><span className="text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">* ข้อมูลวิชาเหล่านี้จะไปโผล่เป็นตัวเลือกเวลาคุณจะสร้าง "งานใหม่" หรือสร้าง "ตารางเรียน"</span>
               </li>
               <li>ไปที่เมนู <b>"ตารางเรียน"</b> เพื่อกำหนดว่าวิชาไหน เรียนวันไหน เวลาอะไร (ข้อมูลนี้จะโชว์ให้ Guest เห็น)</li>
             </ol>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center">
             <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mr-3">2</div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white">การสั่งงาน และ การแนบไฟล์</h4>
          </div>
          <div className="p-6 text-slate-600 dark:text-slate-300 space-y-4">
             <div className="flex items-start">
               <FaClipboardList className="text-2xl text-blue-500 mt-1 mr-4 shrink-0" />
               <div>
                 <p className="mb-2">ไปที่เมนู <b>"งานภายในรายวิชา"</b> เพื่อดูงานทั้งหมดในระบบ</p>
                 <ul className="list-disc pl-5 space-y-2">
                   <li><b>สร้างงานใหม่:</b> กดปุ่ม "เพิ่มงานใหม่" เลือกวิชา กรอกชื่องาน และกำหนดเวลาส่ง (Due Date)</li>
                   <li><b>แนบไฟล์โจทย์:</b> ในหน้าสร้างงาน คุณสามารถแนบไฟล์ (PDF, Word, Zip) เพื่อให้นักศึกษาโหลดไปทำได้</li>
                   <li><b>แก้ไข/ลบ:</b> ทุกงานจะมีปุ่มแก้ไข (สีเหลือง) และปุ่มลบ (สีแดง) อยู่ด้านขวาสุด</li>
                 </ul>
               </div>
             </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-l-4 border-emerald-500 overflow-hidden">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center">
             <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mr-3">3</div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white">การเช็คชื่อคนส่งงาน (Manual Tracking)</h4>
          </div>
          <div className="p-6 text-slate-600 dark:text-slate-300 space-y-4">
             <p>เนื่องจากระบบนี้ <b>นักศึกษาส่งงานผ่านช่องทางอื่น (เช่น Google Drive, แจ้งอาจารย์โดยตรง)</b> คุณจึงต้องเข้ามาเช็คชื่อในระบบเองเพื่อให้กราฟสถิติอัปเดต</p>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
               <h5 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center"><FaChartPie className="mr-2 text-emerald-500"/> วิธีเช็คชื่อคนส่งงาน:</h5>
               <ol className="list-decimal pl-5 space-y-3">
                 <li>ไปที่เมนู <b>"ติดตามสถานะส่งงาน"</b></li>
                 <li>ค้นหางานที่ต้องการ แล้วกดปุ่ม <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">ดูรายชื่อและเช็คงาน</span></li>
                 <li>จะมีหน้าต่างรายชื่อเด้งขึ้นมา หากนักศึกษาคนไหนส่งงานแล้ว ให้กดปุ่ม <b>"ยังไม่ส่ง" (สีขาว/เทา)</b></li>
                 <li>ปุ่มจะเปลี่ยนเป็น <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-1 rounded-lg text-xs font-bold"><FaCheckCircle className="inline mr-1"/> ส่งงานแล้ว</span> (ระบบบันทึกทันที ไม่ต้องกด Save)</li>
                 <li>หากกดผิด สามารถกดซ้ำที่ปุ่มสีเขียวเพื่อ "ยกเลิก" การส่งงานได้</li>
               </ol>
             </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center">
             <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mr-3">4</div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white">คลังเอกสาร และ ลิ้งก์ส่งงาน</h4>
          </div>
          <div className="p-6 text-slate-600 dark:text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
               <h5 className="font-bold text-orange-600 dark:text-orange-400 mb-2 flex items-center"><FaFolderOpen className="mr-2"/> คลังเอกสารกลาง</h5>
               <p className="text-sm mb-3">ใช้แชร์ไฟล์ที่ไม่ใช่งาน เช่น Syllabus, ฟอร์มคำร้อง, หรือสไลด์สอน</p>
               <ul className="text-sm list-disc pl-4 space-y-1">
                 <li>แอดมินทุกคน <FaUpload className="inline text-sky-500 mx-1"/> อัปโหลดได้</li>
                 <li>เฉพาะ Super Admin เท่านั้นที่ <FaTrash className="inline text-red-500 mx-1"/> ลบไฟล์ได้</li>
               </ul>
             </div>
             <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
               <h5 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center"><FaLink className="mr-2"/> ลิ้งก์ส่งงาน</h5>
               <p className="text-sm">ใช้สำหรับแปะลิ้งก์ Google Drive, Classroom หรือกลุ่ม Line ประจำวิชา เพื่อให้นักศึกษากดเข้าไปส่งงานได้ง่ายๆ จากหน้าเว็บ</p>
             </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-l-4 border-red-500 overflow-hidden">
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-100 dark:border-red-900/50 flex items-center">
             <FaUserShield className="text-red-500 text-2xl mr-3" />
             <h4 className="font-bold text-xl text-slate-800 dark:text-white">สิทธิ์พิเศษสำหรับ Super Admin</h4>
          </div>
          <div className="p-6 text-slate-600 dark:text-slate-300 space-y-3 text-sm">
             <p>หากบัญชีของคุณเป็น <b>Super Admin</b> คุณจะเห็นเมนูหมวด <b>"ตั้งค่าระบบ"</b> เพิ่มขึ้นมา ซึ่งสามารถทำสิ่งเหล่านี้ได้:</p>
             <ul className="list-disc pl-5 space-y-2">
               <li><b>จัดการผู้ใช้งาน:</b> สร้างบัญชีให้แอดมินคนอื่น เปลี่ยนรหัสผ่าน หรือระงับบัญชี</li>
               <li><b>บันทึกกิจกรรมระบบ (Activity Log):</b> ดูประวัติว่าใครเข้ามา ลบงาน, เพิ่มวิชา, หรืออัปโหลดไฟล์ไปตอนไหนบ้าง (มีปุ่มล้างประวัติหากข้อมูลเยอะเกินไป)</li>
             </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
export default AdminManual