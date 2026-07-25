import React from 'react';
import { open } from '@tauri-apps/plugin-shell';

export default function ExternalLink({ href, children, className, ...props }) {
  const handleClick = async (e) => {
    e.preventDefault(); // ป้องกันไม่ให้เว็บเปลี่ยนหน้า หรือพยายามโหลดใน Webview

    // เช็คว่ารันบน Tauri Desktop App หรือไม่
    if (window.__TAURI_INTERNALS__) {
      try {
        await open(href); // เด้งไปเปิดเบราว์เซอร์ของเครื่อง (Chrome/Edge/Safari)
      } catch (error) {
        console.error("Failed to open link in Tauri:", error);
      }
    } else {
      // ถ้ารันบนเว็บปกติ ให้เปิดแท็บใหม่
      window.open(href, '_blank');
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}