const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const aiHelper = require('./src/utils/aiHelper');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const userMessage = "มีใครเจอแก้วน้ำสีดำมีพวงกุญแจรูปดาวสีเหลืองติดอยู่ด้วยมั้ยครับ";

const prompt = `คุณคือ AI ระบบบันทึกแจ้งของหายของ Unifind
จงวิเคราะห์ข้อความแจ้งของหายภาษาไทยด้านล่างนี้ แล้วสกัดโครงสร้างข้อมูลออกมาในรูปแบบ JSON เท่านั้น ห้ามมีข้อความนำหน้าหรือตามหลังเด็ดขาด:
ข้อความผู้ใช้: "${userMessage}"

โครงสร้าง JSON:
{
  "item_name": "ชื่อสิ่งของเด่นๆ สั้นๆ กระชับ (เช่น 'กุญแจรถ Toyota', 'โทรศัพท์ iPhone', 'ร่มสีฟ้า' - ห้ามเป็นคำกว้างๆ เช่น 'ของหาย')",
  "category_id": [ใส่ตัวเลข ID หมวดหมู่ที่เหมาะสมที่สุด: 1 (เอกสาร/บัตร), 2 (กระเป๋า/เป้), 3 (โทรศัพท์/ไอแพด/อุปกรณ์ไอที), 4 (กุญแจ/พวงกุญแจ), 5 (เครื่องประดับ/อื่นๆ)],
  "place": "ระบุสถานที่ทำหายสั้นๆ (เช่น 'อาคาร 24 ชั้น 2', 'โรงอาหารหลัก' - หากไม่ระบุเลยให้ใส่ 'ไม่ระบุ')",
  "floor": "ระบุเฉพาะเลขชั้นเป็นสตริง เช่น '2', '3' (หากไม่ระบุชั้นให้เว้นว่างเป็น '')",
  "description": "รายละเอียดเพิ่มเติม เช่น เคสสีชมพู, พวงกุญแจหมีน้อย (หากไม่มีระบุให้เป็น '')"
}`;

async function run() {
  try {
    console.log("Testing generateContentWithFallback for report extraction...");
    const response = await aiHelper.generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" },
      taskType: "extraction",
    });
    console.log("✅ Success! Response text:", response.text.trim());
  } catch (err) {
    console.error("❌ Failed:", err.message || err);
    if (err.stack) console.error(err.stack);
  }
}

run();
