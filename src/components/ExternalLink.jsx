import React from 'react';
import { open } from '@tauri-apps/plugin-shell';

export default function ExternalLink({ href, children, className, ...props }) {
  const handleClick = async (e) => {
    // 🟢 เช็คว่ารันบนแอป Desktop (Tauri) หรือไม่
    if (window.__TAURI_INTERNALS__) {
      e.preventDefault(); // บล็อกไม่ให้โหลดในหน้าจอแอป
      try {
        await open(href); // โยนไปให้เบราว์เซอร์ของเครื่องทำงานแทน
      } catch (error) {
        console.error("Failed to open link in Tauri:", error);
      }
    }
    // 🟢 ถ้ารันบนเว็บ Vercel (ไม่มี Tauri)
    // เราจะไม่ใช้ e.preventDefault() ปล่อยให้แท็ก <a> ของ HTML จัดการดาวน์โหลดตามธรรมชาติเลยครับ!
  };

  return (
    <a 
      href={href} 
      onClick={handleClick} 
      className={className} 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props}
    >
      {children}
    </a>
  );
}