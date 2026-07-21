import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCookieBite } from 'react-icons/fa';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าผู้ใช้เคยจัดการคุกกี้ไปแล้วหรือยัง
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pb-6 md:pb-8 pointer-events-none animate-fade-in font-prompt">
      <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 pointer-events-auto transition-colors duration-300">
        
        <div className="flex-1 text-slate-800 dark:text-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <FaCookieBite className="text-xl flex-shrink-0" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              นโยบายคุกกี้ (Cookie Policy)
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            เว็บไซต์นี้มีการจัดเก็บคุกกี้เพื่อเพิ่มประสิทธิภาพและประสบการณ์ที่ดีในการใช้งานเว็บไซต์ รวมถึงเพื่อวิเคราะห์ข้อมูลการเข้าใช้งาน ระบบจะเก็บข้อมูลเมื่อคุณอนุญาตเท่านั้น คุณสามารถศึกษารายละเอียดเพิ่มเติมได้ที่{' '}
            <Link to="/privacy-policy" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>

        <div className="flex flex-row gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={handleDecline}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-all duration-300"
          >
            ปฏิเสธ
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 text-white font-semibold text-sm hover:from-indigo-700 hover:to-violet-600 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            ยอมรับทั้งหมด
          </button>
        </div>

      </div>
    </div>
  );
};

export default CookieConsent;