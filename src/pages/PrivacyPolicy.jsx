import { Link } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

const PrivacyPolicy = ({ mode }) => {
  const isGuest = mode === 'guest';

  const content = (
    <div className="max-w-4xl mx-auto p-8 md:p-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 transition-all duration-300">
      <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
          <FaShieldAlt className="text-3xl" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Privacy Policy - SE-JOB System</p>
        </div>
      </div>
      
      <div className="space-y-8 leading-relaxed text-sm md:text-base">
        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">1</span>
            การเก็บรวบรวมข้อมูลส่วนบุคคล
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            ระบบ SE-JOB มีการเก็บรวบรวมข้อมูลส่วนบุคคลของผู้ใช้งาน ได้แก่ ชื่อผู้ใช้งาน (Username), รหัสผ่าน (ที่ถูกเข้ารหัส), รูปภาพโปรไฟล์ (ถ้ามี) และข้อมูลอื่น ๆ ที่เกี่ยวข้องกับการจัดการเรียนการสอนและส่งงาน
          </p>
        </section>

        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">2</span>
            วัตถุประสงค์ของการใช้ข้อมูล
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            ข้อมูลที่ถูกจัดเก็บจะถูกนำไปใช้เพื่อวัตถุประสงค์ในการระบุตัวตนผู้เข้าใช้งานระบบ การจัดการสิทธิ์การเข้าถึงข้อมูล การแสดงผลตารางเรียนและงาน และเพื่อประสิทธิผลในการจัดการระบบของแอดมินเท่านั้น
          </p>
        </section>

        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">3</span>
            การเปิดเผยข้อมูล
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            ระบบไม่มีนโยบายในการเปิดเผย แจกจ่าย หรือขายข้อมูลส่วนบุคคลของคุณให้กับบุคคลที่สาม หรือหน่วยงานภายนอก ยกเว้นในกรณีที่ได้รับความยินยอมจากคุณ หรือเป็นการปฏิบัติตามกฎหมาย
          </p>
        </section>

        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">4</span>
            ความปลอดภัยของข้อมูล
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            เราใช้มาตรการรักษาความปลอดภัยทางเทคนิคและทางกายภาพที่เหมาะสม เพื่อปกป้องข้อมูลส่วนบุคคลของคุณจากการเข้าถึง การใช้งาน หรือการเปิดเผยโดยไม่ได้รับอนุญาต (เช่น การใช้งาน Session Timeout และการเข้ารหัสรหัสผ่าน)
          </p>
        </section>
        
        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">5</span>
            การปรับปรุงนโยบาย
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            เราอาจมีการปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว หากมีการเปลี่ยนแปลงที่สำคัญ เราจะแจ้งให้คุณทราบผ่านทางหน้าเว็บไซต์หลัก
          </p>
        </section>
      </div>
    </div>
  );

  if (isGuest) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] flex flex-col font-prompt transition-colors duration-300 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto w-full pt-10 pb-12 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all font-semibold mb-8 group">
            <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> กลับสู่หน้าหลัก
          </Link>
          {content}
        </div>
      </div>
    );
  }

  // ถ้าเป็น Admin จะคืนค่าแค่ส่วน Content เลยเพื่อให้อยู่ใน Layout กลาง
  return content;
};

export default PrivacyPolicy;