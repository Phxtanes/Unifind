/**
 * =========================================================================
 * 🔄 USER SESSION STORE (ตัวจัดการสถานะบทสนทนาโต้ตอบ FSM)
 * =========================================================================
 * ทำหน้าที่จัดเก็บสถานะบทสนทนา (FSM State) ชั่วคราวของ LINE Bot รายบุคคล
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

// ตัวเก็บเซสชันแชท LINE ชั่วคราว (In-memory)
const sessions = {};

// ดึงสถานะบทสนทนาปัจจุบันของผู้ใช้
function getState(lineUserId) {
  if (!lineUserId) return "IDLE";
  const session = sessions[lineUserId];
  if (!session) return "IDLE";

  // ล้างเซสชันหากไม่มีความเคลื่อนไหวเกิน 30 นาที (Session Timeout)
  if (Date.now() - session.updatedAt > 30 * 60 * 1000) {
    delete sessions[lineUserId];
    return "IDLE";
  }
  return session.state;
}

// อัปเดตสถานะบทสนทนา (เช่น เก็บ URL รูปภาพที่ส่งมาล่าสุด)
function setState(lineUserId, state, data = null) {
  if (!lineUserId) return;
  sessions[lineUserId] = {
    state: state,
    data: data,
    updatedAt: Date.now(),
  };
}

// ดึงข้อมูลรูปภาพหรือรายละเอียดที่ฝากไว้ในเซสชัน
function getData(lineUserId) {
  if (!lineUserId) return null;
  const session = sessions[lineUserId];
  if (!session) return null;
  return session.data;
}

// ล้างค่าสถานะเมื่อบันทึกข้อมูลเสร็จสิ้น
function clearState(lineUserId) {
  if (!lineUserId) return;
  delete sessions[lineUserId];
}

// ล้างเซสชันค้างชั่วคราวอัตโนมัติใน RAM ทุกๆ 10 นาที
setInterval(
  () => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const id in sessions) {
      if (now - sessions[id].updatedAt > 30 * 60 * 1000) {
        delete sessions[id];
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(
        `🧹 [Session Store] ล้างเซสชันแชทค้างชั่วคราวของนักศึกษาที่หมดอายุออกไปจำนวน ${cleanedCount} บัญชี`,
      );
    }
  },
  10 * 60 * 1000,
);

module.exports = {
  getState,
  setState,
  getData,
  clearState,
};
