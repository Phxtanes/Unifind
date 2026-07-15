const nodemailer = require("nodemailer");

// ตรวจสอบว่าระบบ SMTP ถูกกำหนดค่าในไฟล์ .env ครบถ้วนหรือไม่
const isSmtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

let transporter = null;

if (isSmtpConfigured) {
  // กำหนดค่าการทำงานของ Nodemailer SMTP Client
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true สำหรับพอร์ต 465, false สำหรับพอร์ตอื่นๆ (เช่น 587)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log("[SMTP] Transporter initialized successfully");
} else {
  // แสดงคำเตือนบน Server log และทำงานในโหมด Fallback เพื่อไม่ให้ระบบ OTP ขัดข้องระหว่างการพัฒนา
  console.warn(
    "[SMTP] SMTP configurations missing. Falling back to terminal console logs for OTP.",
  );
}

/**
 * ฟังก์ชันหลักสำหรับส่งอีเมลรหัสยืนยันตัวตน (OTP) ไปยังอีเมลผู้ใช้
 * @param {string} email - อีเมลมหาวิทยาลัยปลายทางที่ต้องการส่งรหัส OTP
 * @param {string} otp - รหัสยืนยันตัวตน 6 หลัก
 */
async function sendOtpEmail(email, otp) {
  const subject = `Unifind Code: ${otp}`;

  // โครงสร้างหน้าตาอีเมลแบบ HTML (UTCC Theme - ปรับปรุงเพื่อเลี่ยง Spam Filter)
  const htmlContent = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 15px;">
                <h2 style="color: #0f172a; margin: 0;">Unifind Lost & Found</h2>
                <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">UTCC Lost and Found System</p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 15px;" />
            
            <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                สวัสดีครับ/ค่ะ,<br /><br />
                รหัสสำหรับการผูกบัญชี LINE กับระบบตามหาของหาย Unifind ของคุณคือ:
            </p>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0;">
                <div style="font-size: 28px; font-weight: bold; color: #4f46e5; letter-spacing: 2px;">${otp}</div>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">*รหัสนี้มีอายุการใช้งาน 5 นาที</p>
            </div>
            
            <p style="color: #ef4444; font-size: 12px; margin: 15px 0;">
                *หากคุณไม่ได้เป็นผู้ส่งคำขอ กรุณามองข้ามอีเมลนี้
            </p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 20px; margin-bottom: 15px;" />
            
            <p style="font-size: 11px; text-align: center; color: #94a3b8; margin: 0;">
                กองกิจการนักศึกษา มหาวิทยาลัยหอการค้าไทย (UTCC)
            </p>
        </div>
    `;

  // ตรวจสอบว่าสามารถใช้งาน SMTP ได้หรือไม่
  if (transporter) {
    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM || `"Unifind UTCC" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: htmlContent,
      });
      console.log(`[SMTP] Verification email sent successfully to: ${email}`);
    } catch (error) {
      console.error(
        "[SMTP] Failed to send email via SMTP, falling back to console log:",
        error,
      );
      printOtpToConsole(email, otp);
    }
  } else {
    printOtpToConsole(email, otp);
  }
}

/**
 * จำลองการปริ้นต์รหัส OTP ลงหน้าจอ Console (ใช้สำหรับการทดสอบในสภาพแวดล้อม Local)
 * @param {string} email - อีเมลปลายทาง
 * @param {string} otp - รหัส OTP 6 หลัก
 */
function printOtpToConsole(email, otp) {
  console.log("\n==================================================");
  console.log(`📧 [MOCK EMAIL FALLBACK]`);
  console.log(`To: ${email}`);
  console.log(`Subject: Verification Code`);
  console.log(`OTP Code: ${otp}`);
  console.log("==================================================\n");
}

module.exports = {
  sendOtpEmail,
};
