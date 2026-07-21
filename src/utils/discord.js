export const sendDiscordNotify = async (moduleName, action, details, username) => {
  // นำ Webhook URL ที่ก๊อปปี้มาใส่ตรงนี้ (แนะนำให้เก็บในไฟล์ .env ในอนาคต)
  const webhookUrl = "https://discord.com/api/webhooks/1526160003432583220/dnd-BOPyG16qkO8bzKtDclvxGy4Quk5lX7Vm994HjcsxYdtvXW5kQ2COVjWpMZfO0u7g";

  if (!webhookUrl) return;

  // กำหนดสีและข้อความตามประเภทการกระทำ
  let color = 3447003; // สีฟ้า (สำหรับการอัปเดต)
  let actionText = "📝 อัปเดตข้อมูล";

  if (action === 'CREATE') {
    color = 5763719; // สีเขียว
    actionText = "✅ เพิ่มข้อมูลใหม่";
  } else if (action === 'DELETE') {
    color = 15548997; // สีแดง
    actionText = "❌ ลบข้อมูล";
  }

  // สร้างรูปแบบข้อความ (Embed)
  const embed = {
    title: `แจ้งเตือนระบบ: ${moduleName}`,
    color: color,
    fields: [
      { name: "การกระทำ", value: actionText, inline: true },
      { name: "ผู้ดำเนินการ", value: username || "System", inline: true },
      { name: "รายละเอียด", value: details, inline: false }
    ],
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error("ไม่สามารถส่งการแจ้งเตือน Discord ได้:", error);
  }
};