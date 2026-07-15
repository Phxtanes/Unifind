const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const aiHelper = require('./src/utils/aiHelper');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const userMessage = "มีใครเจอแก้วน้ำสีดำมีพวงกุญแจรูปดาวสีเหลืองติดอยู่ด้วยมั้ยครับ";

const prompt = `คุณคือผู้ช่วย AI ประเมินความเฉพาะเจาะจงของรายละเอียดของหายในระบบ Unifind
หน้าที่ของคุณคือตรวจสอบข้อความของผู้ใช้ภาษาไทยว่ามีการระบุรายละเอียดสิ่งของ "เฉพาะเจาะจงเพียงพอ" หรือไม่ เพื่อที่จะสามารถระบุตัวตนและตรวจสอบของได้ง่ายขึ้น (เช่น ยี่ห้อ/รุ่น, สี, ลักษณะเด่น, หรือจุดสังเกตเฉพาะตัว)

เกณฑ์การตัดสิน:
1. หากผู้ใช้ระบุเพียงประเภทสิ่งของกว้างๆ เช่น "โทรศัพท์", "กระเป๋า", "กุญแจ", "ร่ม", "หูฟัง", "บัตร" โดยไม่มีการระบุ "สี", "รุ่น/ยี่ห้อ", หรือ "ลักษณะเฉพาะอื่นใดเพิ่มเติมเลย" ให้ถือว่า "ไม่เฉพาะเจาะจงพอ (isSpecific: false)"
2. หากผู้ใช้ระบุรายละเอียดเพิ่มเติม เช่น "โทรศัพท์ iPhone 15 สีดำ", "กระเป๋าตังสีน้ำตาลยี่ห้อ Coach", "กุญแจรถ Honda มีพวงกุญแจหมี", "ร่มสีแดงลายจุด" ให้ถือว่า "เฉพาะเจาะจงเพียงพอ (isSpecific: true)"

ข้อความของผู้ใช้ที่ต้องการตรวจสอบ: "${userMessage}"

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น ห้ามมีคำอธิบายอื่นเด็ดขาด:
{
  "isSpecific": true หรือ false,
  "reason": "คำอธิบายภาษาไทยสั้นๆ"
}`;

async function run() {
  try {
    console.log("Testing generateContentWithFallback for specificity prompt...");
    const response = await aiHelper.generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    console.log("✅ Success! Response text:", response.text.trim());
  } catch (err) {
    console.error("❌ Failed:", err.message || err);
    if (err.stack) console.error(err.stack);
  }
}

run();
