import { Link } from 'react-router-dom';
import { FaArrowLeft, FaFileContract } from 'react-icons/fa';

const License = ({ mode }) => {
  const isGuest = mode === 'guest';

  const content = (
    <div className="max-w-4xl mx-auto p-8 md:p-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 transition-all duration-300">
      <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="p-3.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl shadow-lg shadow-amber-500/30">
          <FaFileContract className="text-3xl" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">ข้อตกลงการใช้งาน และ ลิขสิทธิ์</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">License Agreement - SE-JOB System</p>
        </div>
      </div>
      
      <div className="space-y-8 leading-relaxed text-sm md:text-base">
        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">1</span>
            ข้อตกลงการใช้งาน (Terms of Use)
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            การเข้าใช้งานระบบ SE-JOB ถือว่าผู้ใช้งานตกลงและยอมรับเงื่อนไขในการใช้งานตามที่ระบบกำหนด ผู้ใช้งานต้องรับผิดชอบต่อกิจกรรมใดๆ ที่เกิดขึ้นภายใต้บัญชีของตนเอง และห้ามมิให้กระทำการใดๆ ที่อาจก่อให้เกิดความเสียหายต่อระบบ
          </p>
        </section>

        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">2</span>
            ลิขสิทธิ์ซอฟต์แวร์ (Copyright)
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            ซอฟต์แวร์ โค้ด การออกแบบ และส่วนประกอบต่างๆ ของระบบ SE-JOB เป็นลิขสิทธิ์ของ <strong>Pattaradanai Saiwongkham</strong> (ผู้พัฒนา) สงวนลิขสิทธิ์ตามกฎหมายทรัพย์สินทางปัญญา ห้ามมิให้ผู้ใดคัดลอก ดัดแปลง ทำซ้ำ หรือนำไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
          </p>
        </section>

        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">3</span>
            ข้อจำกัดความรับผิดชอบ (Limitation of Liability)
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            ระบบถูกจัดทำขึ้นเพื่ออำนวยความสะดวกในการจัดการเรียนการสอน ผู้พัฒนาจะไม่รับผิดชอบต่อความเสียหายใดๆ ไม่ว่าทางตรงหรือทางอ้อม ที่เกิดจากการใช้งานระบบ ความล่าช้าของเครือข่าย หรือการสูญหายของข้อมูล (แม้ว่าเราจะพยายามปกป้องข้อมูลอย่างดีที่สุดก็ตาม)
          </p>
        </section>

        <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">4</span>
            การยกเลิกสิทธิ์การใช้งาน
          </h2>
          <p className="text-slate-600 dark:text-slate-400 pl-8">
            ผู้ดูแลระบบ (Super Admin) สงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีผู้ใช้งานทันที หากตรวจพบว่าผู้ใช้งานละเมิดข้อตกลงและเงื่อนไขการใช้งานระบบนี้
          </p>
        </section>
      </div>
    </div>
  );

  if (isGuest) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117] flex flex-col font-prompt transition-colors duration-300 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto w-full pt-10 pb-12 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all font-semibold mb-8 group">
            <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" /> กลับสู่หน้าหลัก
          </Link>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default License;