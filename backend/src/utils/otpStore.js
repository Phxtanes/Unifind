/**
 * =========================================================================
 * ⏱️ IN-MEMORY OTP STORE (ระบบจัดเก็บรหัส OTP ในหน่วยความจำชั่วคราว)
 * =========================================================================
 * ทำหน้าที่สร้าง จัดเก็บ ตรวจสอบ และลบชั่วคราวรหัส OTP (อายุ 5 นาที) สำหรับการผูกบัญชี LINE
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const crypto = require("crypto");

// เก็บข้อมูลรหัส OTP ชั่วคราวสำหรับการผูกบัญชี LINE: { [lineUserId]: { email, studentId, role, otp, expiresAt } }
const pendingOtps = {};

/**
 * สุ่มสร้างรหัส OTP เลขจำนวนเต็ม 6 หลักที่ปลอดภัย (Cryptographically Secure 100,000 - 999,999)
 * @returns {string} รหัส OTP 6 หลัก
 */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * สร้างข้อมูลและรหัส OTP เพื่อส่งอีเมลยืนยันตัวตน (กำหนดอายุใช้งาน 5 นาที)
 * @param {string} lineUserId - LINE User ID
 * @param {object} details - ข้อมูลบทบาทและอีเมลของผู้สมัคร
 * @returns {string} รหัส OTP ที่สร้างได้
 */
function createPending(lineUserId, details) {
  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // หมดอายุใน 5 นาที

  pendingOtps[lineUserId] = {
    email: details.email,
    studentId: details.studentId,
    role: details.role,
    otp: otp,
    expiresAt: expiresAt,
  };

  console.log(
    `[OTP] Created OTP ${otp} for LINE User ${lineUserId} (${details.email}) expiring at ${new Date(expiresAt).toISOString()}`,
  );
  return otp;
}

/**
 * ดึงข้อมูลรหัส OTP ปัจจุบัน (ตรวจสอบความสมบูรณ์และอายุใช้งาน)
 * @param {string} lineUserId - LINE User ID
 * @returns {object|null} ข้อมูล OTP หรือ null หากหมดอายุ/ไม่พบ
 */
function getPending(lineUserId) {
  const record = pendingOtps[lineUserId];
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    delete pendingOtps[lineUserId];
    return null;
  }
  return record;
}

/**
 * ล้างข้อมูลรหัส OTP เมื่อยืนยันตัวตนสำเร็จ
 * @param {string} lineUserId - LINE User ID
 */
function clearPending(lineUserId) {
  delete pendingOtps[lineUserId];
}

// ระบบทำความสะอาดล้างรหัส OTP ที่หมดอายุค้างใน RAM ทุกๆ 10 นาที
setInterval(
  () => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const lineUserId in pendingOtps) {
      if (now > pendingOtps[lineUserId].expiresAt) {
        delete pendingOtps[lineUserId];
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(
        `🧹 [OTP Store] ล้างประวัติรหัส OTP ที่หมดอายุค้างอยู่ในหน่วยความจำออกไปจำนวน ${cleanedCount} รายการ`,
      );
    }
  },
  10 * 60 * 1000,
);

module.exports = {
  createPending,
  getPending,
  clearPending,
};