import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // ตรวจสอบ Path ของ supabase.js ให้ตรงกับโปรเจคคุณ
import { open } from '@tauri-apps/plugin-shell';

export default function UpdateNotifier() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [downloadLink, setDownloadLink] = useState('');

  // ดึงค่า VITE_APP_VERSION จากไฟล์ .env (อย่าลืมไปตั้งค่าใน .env ด้วยนะครับ)
  const currentVersion = import.meta.env.VITE_APP_VERSION || "1.3.0";

  useEffect(() => {
    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    try {
      // ดึงข้อมูลเวอร์ชั่นล่าสุดจากตาราง app_settings
      const { data, error } = await supabase
        .from('app_settings')
        .select('latest_version, download_url')
        .single(); // ดึงแถวเดียว

      if (error) throw error;

      // ถ้าเวอร์ชั่นใน Supabase ไม่ตรงกับในเครื่องผู้ใช้ แปลว่ามีอัพเดท
      if (data && data.latest_version !== currentVersion) {
        setLatestVersion(data.latest_version);
        setDownloadLink(data.download_url);
        setHasUpdate(true);
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  };

  const handleUpdate = async () => {
    if (window.__TAURI_INTERNALS__) {
      await open(downloadLink);
    } else {
      window.open(downloadLink, '_blank');
    }
  };

  if (!hasUpdate) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white p-5 rounded-lg shadow-2xl border-l-4 border-blue-500 z-50 animate-bounce">
      <h3 className="font-bold text-lg text-gray-800">🚀 มีอัพเดทใหม่! (v{latestVersion})</h3>
      <p className="text-gray-500 text-sm mt-1 mb-3">เวอร์ชั่นปัจจุบันของคุณคือ v{currentVersion}</p>
      
      <div className="flex gap-2">
        <button 
          onClick={handleUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full font-medium"
        >
          ดาวน์โหลดเลย
        </button>
        <button 
          onClick={() => setHasUpdate(false)}
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 transition"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}