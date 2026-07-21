// src/utils/timezone.js
export const getBangkokTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  // เช็คว่ารูปแบบวันที่ถูกต้องหรือไม่ ถ้าพังให้คืนค่า 'ไม่ระบุเวลา' แทนหน้าขาว
  if (isNaN(date.getTime())) return 'ไม่ระบุเวลา';
  
  return date.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const getBangkokISO = (dateString = new Date()) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return new Date().toISOString();
  
  const tzOffset = 7 * 60; // Bangkok UTC+7
  const localTime = new Date(date.getTime() + tzOffset * 60000);
  return localTime.toISOString().slice(0, 19).replace('T', ' ');
};