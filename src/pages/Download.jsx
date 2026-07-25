import React from 'react';
import { Link } from 'react-router-dom';
import { FaWindows, FaApple, FaLinux, FaArrowLeft } from 'react-icons/fa';
import ExternalLink from '../components/ExternalLink';

const Download = () => {
  // 🟢 ลิงก์ตรงไปหาไฟล์ .msi ใน Supabase Storage ของคุณ
  const downloadUrl = "https://mbzxfdpnvwwtudkfbrqw.supabase.co/storage/v1/object/public/app-installers/SE-JOB%20RMUTL_1.3.2_x64_en-US.msi";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center pt-20 p-6 font-prompt transition-colors duration-300">
      <div className="max-w-5xl w-full space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-400">
            ดาวน์โหลด SE Gen.4 Desktop App
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            อัปเกรดประสบการณ์การจัดการเรียนการสอนของคุณให้ลื่นไหลยิ่งขึ้นบนคอมพิวเตอร์ของคุณ รองรับระบบปฏิบัติการหลักทั้งหมด
          </p>
        </div>

        {/* Download Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {/* Windows */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center space-y-6 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shadow-inner">
              <FaWindows className="w-10 h-10" />
            </div>
            <div className="space-y-2 flex-grow">
              <h2 className="text-2xl font-bold">Windows</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">รองรับ Windows 10 และ 11 (64-bit)</p>
            </div>
            {/* 🟢 ใช้ ExternalLink เพื่อบังคับเปิด Browser เครื่อง */}
            <ExternalLink 
              href={downloadUrl}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center"
            >
              ดาวน์โหลด (.MSI)
            </ExternalLink>
          </div>

          {/* macOS */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center space-y-6 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full flex items-center justify-center shadow-inner">
              <FaApple className="w-11 h-11 mb-1" />
            </div>
            <div className="space-y-2 flex-grow">
              <h2 className="text-2xl font-bold">macOS</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">รองรับ macOS 10.15+ (Intel & Apple Silicon)</p>
            </div>
            <button 
              disabled
              className="w-full py-3 px-4 bg-gray-400 dark:bg-gray-700 text-white rounded-xl font-semibold cursor-not-allowed opacity-80"
            >
              เร็วๆนี้ Coming Soon
            </button>
          </div>

          {/* Linux */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center space-y-6 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 rounded-full flex items-center justify-center shadow-inner">
              <FaLinux className="w-10 h-10" />
            </div>
            <div className="space-y-2 flex-grow">
              <h2 className="text-2xl font-bold">Linux</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ubuntu, Debian, Fedora และอื่นๆ</p>
            </div>
            <button 
              disabled
              className="w-full py-3 px-4 bg-gray-400 dark:bg-gray-700 text-white rounded-xl font-semibold cursor-not-allowed opacity-80"
            >
              เร็วๆนี้ Coming Soon
            </button>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center pt-8 pb-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
          >
            <FaArrowLeft />
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Download;