const userRequests = {};

// ขนาดหน้าต่างเวลา: 60 วินาที (1 นาที)
const WINDOW_MS = 60 * 1000;
// จำนวนครั้งสูงสุดที่อนุญาตต่อหน้าต่างเวลา
const MAX_REQUESTS = 6;

/**
 * ตรวจสอบและบันทึกประวัติการเรียกใช้งานเพื่อเช็ก Rate Limit รายคน
 * @param {string} lineUserId - ไอดีผู้ใช้ LINE
 * @returns {boolean} true หากทำรายการเกินกำหนด (Rate Limited), false หากผ่านสิทธิ์ปกติ
 */
function isRateLimited(lineUserId) {
  if (!lineUserId) return false;
  const now = Date.now();

  if (!userRequests[lineUserId]) {
    userRequests[lineUserId] = [];
  }

  // กรองคัดเวลาที่เก่าเกิน 1 นาทีออกจากประวัติ
  userRequests[lineUserId] = userRequests[lineUserId].filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  // ตรวจสอบว่าจำนวนครั้งใน 1 นาทีเกินกำหนดหรือไม่
  if (userRequests[lineUserId].length >= MAX_REQUESTS) {
    return true;
  }

  // บันทึกเวลาคำขอล่าสุดลงประวัติ
  userRequests[lineUserId].push(now);
  return false;
}

// เคลียร์ความจำที่ไม่มีความเคลื่อนไหวทุกๆ 10 นาทีเพื่อประหยัด RAM
setInterval(
  () => {
    const now = Date.now();
    for (const id in userRequests) {
      userRequests[id] = userRequests[id].filter(
        (timestamp) => now - timestamp < WINDOW_MS,
      );
      if (userRequests[id].length === 0) {
        delete userRequests[id];
      }
    }
  },
  10 * 60 * 1000,
);

module.exports = {
  isRateLimited,
};
