import { 
  FaBookOpen, FaUserPlus, FaCalendarAlt, FaTable, 
  FaClipboardList, FaChartPie, FaFolderOpen, 
  FaExclamationTriangle, FaCheckCircle, FaTrash, 
  FaUpload, FaLink, FaUserShield 
} from 'react-icons/fa'

const AdminManual = () => {
  return (
    // 🟢 ใส่ overflow-x-hidden และ w-full เพื่อป้องกันสไลด์ซ้ายขวาเด็ดขาด
    <div className="w-full max-w-5xl mx-auto relative animate-fade-in font-prompt overflow-x-hidden pb-12 px-4 sm:px-6 lg:px-8">
      
      {/* 🔮 Ambient Background Glows (ขังไว้ในกรอบไม่ให้ล้นจอ) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      {/* 📚 Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-[2.5rem] p-10 md:p-16 shadow-[0_20px_50px_rgba(79,70,229,0.3)] mb-12 flex flex-col items-center text-center group">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 bg-white/20 p-5 rounded-3xl backdrop-blur-md mb-6 shadow-inner border border-white/30 group-hover:scale-110 transition-transform duration-500">
           <FaBookOpen className="text-5xl md:text-6xl text-white drop-shadow-md" />
        </div>
        
        <h1 className="relative z-10 text-3xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
          คู่มือการใช้งานระบบ SE-JOB
        </h1>
        <p className="relative z-10 text-indigo-100 text-base md:text-lg font-medium max-w-2xl">
          เจาะลึกทุกฟังก์ชันแบบจับมือทำ (Step-by-Step) เพื่อการบริหารจัดการชั้นเรียนที่ราบรื่นและมีประสิทธิภาพ
        </p>
      </div>

      <div className="space-y-8 relative z-10">
        
        {/* Step 1 */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="bg-slate-50/80 dark:bg-slate-900/50 px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">1</div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">เริ่มต้นใช้งาน: ตั้งค่าโครงสร้างระบบ</h4>
          </div>
          <div className="p-6 md:p-8 text-slate-600 dark:text-slate-300 space-y-5">
             <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
               <p className="font-bold text-indigo-800 dark:text-indigo-300">💡 ระบบนี้จำเป็นต้องมี "ปีการศึกษา" และ "รายวิชา" ก่อน ถึงจะสามารถสั่งงานได้</p>
             </div>
             <ol className="list-decimal pl-6 space-y-4 marker:text-indigo-500 marker:font-bold">
               <li>ไปที่เมนู <b className="text-slate-800 dark:text-slate-200">"จัดการภาค/เทอม"</b> กดเพิ่มปีการศึกษา (เช่น ปี 2568 เทอม 1)</li>
               <li>ไปที่เมนู <b className="text-slate-800 dark:text-slate-200">"จัดการรายวิชา"</b> กดเพิ่มรายวิชา โดยใส่รหัสวิชา ชื่อวิชา และชื่อผู้สอน
                 <div className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                   * ข้อมูลวิชาเหล่านี้จะไปโผล่เป็นตัวเลือกเวลาคุณจะสร้าง "งานใหม่" หรือสร้าง "ตารางเรียน"
                 </div>
               </li>
               <li>ไปที่เมนู <b className="text-slate-800 dark:text-slate-200">"ตารางเรียน"</b> เพื่อกำหนดว่าวิชาไหน เรียนวันไหน เวลาอะไร (ข้อมูลนี้จะโชว์ให้ Guest เห็น)</li>
             </ol>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="bg-slate-50/80 dark:bg-slate-900/50 px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">2</div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">การสั่งงาน และ การแนบไฟล์</h4>
          </div>
          <div className="p-6 md:p-8 text-slate-600 dark:text-slate-300">
             <div className="flex flex-col md:flex-row items-start gap-6">
               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl shrink-0 border border-blue-100 dark:border-blue-800/30">
                 <FaClipboardList className="text-4xl text-blue-500" />
               </div>
               <div className="space-y-3 flex-1">
                 <p className="text-lg">ไปที่เมนู <b className="text-slate-800 dark:text-slate-200">"งานภายในรายวิชา"</b> เพื่อดูงานทั้งหมดในระบบ</p>
                 <ul className="space-y-3 mt-4">
                   <li className="flex gap-3">
                     <span className="text-blue-500 mt-1">●</span>
                     <span><b className="text-slate-800 dark:text-slate-200">สร้างงานใหม่:</b> กดปุ่ม "เพิ่มงานใหม่" เลือกวิชา กรอกชื่องาน และกำหนดเวลาส่ง (Due Date)</span>
                   </li>
                   <li className="flex gap-3">
                     <span className="text-blue-500 mt-1">●</span>
                     <span><b className="text-slate-800 dark:text-slate-200">แนบไฟล์โจทย์:</b> ในหน้าสร้างงาน คุณสามารถแนบไฟล์ (PDF, Word, Zip) เพื่อให้นักศึกษาโหลดไปทำได้</span>
                   </li>
                   <li className="flex gap-3">
                     <span className="text-blue-500 mt-1">●</span>
                     <span><b className="text-slate-800 dark:text-slate-200">แก้ไข/ลบ:</b> ทุกงานจะมีปุ่มแก้ไข (สีเหลือง) และปุ่มลบ (สีแดง) อยู่ด้านขวาสุด</span>
                   </li>
                 </ul>
               </div>
             </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-teal-500"></div>
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 px-6 py-5 border-b border-emerald-100/50 dark:border-emerald-900/30 flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">3</div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">การเช็คชื่อคนส่งงาน (Manual Tracking)</h4>
          </div>
          <div className="p-6 md:p-8 text-slate-600 dark:text-slate-300 space-y-6">
             <p className="text-base leading-relaxed">
               เนื่องจากระบบนี้ <b className="text-slate-800 dark:text-slate-200">นักศึกษาส่งงานผ่านช่องทางอื่น (เช่น Google Drive, แจ้งอาจารย์โดยตรง)</b> คุณจึงต้องเข้ามาเช็คชื่อในระบบเองเพื่อให้กราฟสถิติอัปเดต
             </p>
             
             <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
               <h5 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center text-lg">
                 <FaChartPie className="mr-3 text-emerald-500 text-xl"/> วิธีเช็คชื่อคนส่งงาน:
               </h5>
               <ol className="list-decimal pl-6 space-y-3 marker:text-emerald-500 marker:font-bold">
                 <li>ไปที่เมนู <b className="text-slate-800 dark:text-slate-200">"ติดตามสถานะส่งงาน"</b></li>
                 <li>ค้นหางานที่ต้องการ แล้วกดปุ่ม <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm inline-block mx-1">ดูรายชื่อและเช็คงาน</span></li>
                 <li>จะมีหน้าต่างรายชื่อเด้งขึ้นมา หากนักศึกษาคนไหนส่งงานแล้ว ให้กดปุ่ม <b className="text-slate-800 dark:text-slate-200">"ยังไม่ส่ง" (สีขาว/เทา)</b></li>
                 <li>ปุ่มจะเปลี่ยนเป็น <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50 px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center mx-1"><FaCheckCircle className="mr-1"/> ส่งงานแล้ว</span> (ระบบบันทึกทันที ไม่ต้องกด Save)</li>
                 <li>หากกดผิด สามารถกดซ้ำที่ปุ่มสีเขียวเพื่อ "ยกเลิก" การส่งงานได้</li>
               </ol>
             </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
          <div className="bg-slate-50/80 dark:bg-slate-900/50 px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">4</div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">คลังเอกสาร และ ลิ้งก์ส่งงาน</h4>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-orange-50/80 dark:bg-orange-900/20 p-6 rounded-3xl border border-orange-100 dark:border-orange-900/30 hover:shadow-md transition-shadow">
               <h5 className="font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center text-lg">
                 <FaFolderOpen className="mr-3 text-xl"/> คลังเอกสารกลาง
               </h5>
               <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                 ใช้แชร์ไฟล์ที่ไม่ใช่งาน เช่น Syllabus, ฟอร์มคำร้อง, หรือสไลด์สอน
               </p>
               <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                 <li className="flex items-center gap-2"><FaUpload className="text-sky-500 shrink-0"/> แอดมินทุกคนอัปโหลดได้</li>
                 <li className="flex items-center gap-2"><FaTrash className="text-red-500 shrink-0"/> เฉพาะ Super Admin เท่านั้นที่ลบไฟล์ได้</li>
               </ul>
             </div>
             
             <div className="bg-indigo-50/80 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 hover:shadow-md transition-shadow">
               <h5 className="font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center text-lg">
                 <FaLink className="mr-3 text-xl"/> ลิ้งก์ส่งงาน
               </h5>
               <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                 ใช้สำหรับแปะลิ้งก์ Google Drive, Classroom หรือกลุ่ม Line ประจำวิชา เพื่อให้นักศึกษากดเข้าไปส่งงานได้ง่ายๆ จากหน้าเว็บฝั่งผู้เข้าชม
               </p>
             </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-400 to-red-600"></div>
          <div className="bg-rose-50/50 dark:bg-rose-900/10 px-6 py-5 border-b border-rose-100/50 dark:border-rose-900/30 flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-red-600 text-white flex items-center justify-center shadow-md shrink-0">
               <FaUserShield size={20} />
             </div>
             <h4 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">สิทธิ์พิเศษสำหรับ Super Admin</h4>
          </div>
          <div className="p-6 md:p-8 text-slate-600 dark:text-slate-300 space-y-4">
             <p className="text-base">
               หากบัญชีของคุณเป็น <b className="text-slate-800 dark:text-slate-200">Super Admin</b> คุณจะเห็นเมนูหมวด <b className="text-slate-800 dark:text-slate-200">"ตั้งค่าระบบ"</b> เพิ่มขึ้นมา ซึ่งสามารถทำสิ่งเหล่านี้ได้:
             </p>
             <ul className="space-y-3 mt-4">
               <li className="flex gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                 <FaUserPlus className="text-xl text-rose-500 shrink-0 mt-0.5" />
                 <div>
                   <b className="text-slate-800 dark:text-slate-200 block mb-1">จัดการผู้ใช้งาน:</b> 
                   <span>สร้างบัญชีให้แอดมินคนอื่น เปลี่ยนรหัสผ่าน หรือระงับบัญชี (Ban)</span>
                 </div>
               </li>
               <li className="flex gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                 <FaExclamationTriangle className="text-xl text-amber-500 shrink-0 mt-0.5" />
                 <div>
                   <b className="text-slate-800 dark:text-slate-200 block mb-1">บันทึกกิจกรรมระบบ (Activity Log):</b> 
                   <span>ดูประวัติว่าใครเข้ามา ลบงาน, เพิ่มวิชา, หรืออัปโหลดไฟล์ไปตอนไหนบ้าง (มีปุ่มล้างประวัติหากข้อมูลเยอะเกินไป)</span>
                 </div>
               </li>
             </ul>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminManual