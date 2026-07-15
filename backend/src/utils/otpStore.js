// เก็บข้อมูลรหัส OTP ชั่วคราวสำหรับการผูกบัญชี LINE: { [lineUserId]: { email, studentId, role, otp, expiresAt } }
const pendingOtps = {};

// สุ่มสร้างรหัส OTP เลข 6 หลัก
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// สร้างข้อมูลและรหัส OTP เพื่อส่งอีเมลยืนยันตัวตน (อายุใช้งาน 5 นาที)
function createPending(lineUserId, details) {
  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // กำหนดหมดอายุใน 5 นาที (5 นาที * 60 วินาที * 1000 มิลลิวินาที)

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

// ดึงข้อมูลรหัส OTP ปัจจุบัน (เช็กอายุใช้งานว่าหมดอายุหรือไม่)
function getPending(lineUserId) {
  const record = pendingOtps[lineUserId];
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    delete pendingOtps[lineUserId];
    return null;
  }
  return record;
}

// ล้างข้อมูลรหัส OTP เมื่อยืนยันตัวตนสำเร็จ
function clearPending(lineUserId) {
  delete pendingOtps[lineUserId];
}

// เคลียร์รหัส OTP ที่หมดอายุค้างใน RAM ทุกๆ 10 นาที
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
