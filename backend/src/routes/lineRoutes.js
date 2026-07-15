/**
 * =========================================================================
 * 📌 Unifind LINE Bot Router & Hybrid AI System
 * =========================================================================
 * ไฟล์นี้ทำหน้าที่เป็นตัวจัดการระบบ LINE Webhook, การผูกบัญชีผู้ใช้,
 * การบันทึกและสืบค้นข้อมูลของหาย (Lost & Found), รวมถึงการใช้ Gemini AI
 * ในการจัดประเภทผู้ใช้, ค้นหาแบบมีความหมาย (Semantic Search), และคุยทั่วไป
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const { GoogleGenAI, Type } = require("@google/genai");

// นำเข้าการตั้งค่าและฐานข้อมูล
const supabase = require("../config/supabase");
const lineBindings = require("../config/lineBindings");
const localDb = require("../config/localDb");

// นำเข้าตัวช่วยระบบบริการ (Utilities & Services)
const aiHelper = require("../utils/aiHelper");
const otpStore = require("../utils/otpStore");
const emailService = require("../utils/emailService");
const userSessionStore = require("../utils/userSessionStore");
const rateLimiter = require("../utils/rateLimiter");

const router = express.Router();

// เริ่มต้นระบบ Gemini AI ด้วย GoogleGenAI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* =========================================================================
 * 🛠️ 1. HELPER FUNCTIONS & MAPPINGS (ฟังก์ชันช่วยเหลือและการแปลงข้อมูล)
 * ========================================================================= */

/**
 * ดึงชื่อสถานที่จำลองกรณีฐานข้อมูล Supabase ออฟไลน์
 * @param {number} locId - รหัสสถานที่
 * @returns {string} ชื่อสถานที่ภาษาไทย
 */
function getMockLocationName(locId) {
  const names = {
    1: "อาคาร 24",
    2: "อาคาร 6",
    3: "โรงอาหาร",
    4: "ห้องสมุด",
  };
  return names[locId] || "ไม่ระบุสถานที่";
}

/**
 * ดึงชื่อหมวดหมู่สิ่งของตาม ID
 * @param {number} categoryId - รหัสหมวดหมู่
 * @returns {string} ชื่อหมวดหมู่ภาษาไทย
 */
const getCategoryName = (categoryId) => {
  const mapping = {
    1: "เอกสาร",
    2: "กระเป๋า",
    3: "โทรศัพท์",
    4: "กุญแจ",
    5: "เครื่องประดับ",
  };
  return mapping[categoryId] || "อื่นๆ";
};

/**
 * ดึงข้อความระบุสถานที่ของสิ่งของ โดยตรวจสอบจากความสมบูรณ์ของโครงสร้างข้อมูล
 * @param {object} item - ข้อมูลสิ่งของ
 * @returns {string} ข้อความสถานที่และชั้น (ถ้ามี)
 */
const getLocationNameText = (item) => {
  let locName = "ไม่ระบุสถานที่";

  if (item.Location && item.Location.location_name) {
    locName = item.Location.location_name;
  } else if (item.location_name) {
    locName = item.location_name;
  } else if (item.location_id) {
    locName = getMockLocationName(item.location_id);
  }

  if (item.floor) {
    const floorStr = String(item.floor).trim();
    if (floorStr && !locName.includes(`ชั้น ${floorStr}`)) {
      locName += ` ชั้น ${floorStr}`;
    }
  }

  return locName;
};

/**
 * ตรวจสอบความสุ่ม (ความสุ่มสลับการทักทาย)
 * @param {Array} array - รายการข้อความที่ต้องการสุ่มเลือก
 * @returns {*} ข้อความที่สุ่มได้
 */
const getRandomResponse = (array) =>
  array[Math.floor(Math.random() * array.length)];

// ข้อความแนะนำการใช้งานระบบเริ่มต้น (สำหรับผู้ที่ยังไม่ได้ผูกบัญชี)
const welcomeAndGuideMessage = `ยินดีต้อนรับเข้าสู่ Unifind นะครับผม! 🎉 ช่องทางช่วยตามหาของหายและรับแจ้งเตือนสำหรับชาว UTCC \n\nกรุณาผูกบัญชีผู้ใช้เพื่อความปลอดภัยและเปิดสิทธิ์ใช้งานระบบตามหาของหาย โดยพิมพ์ส่งอีเมลมหาวิทยาลัยของคุณเข้ามาในแชทนี้เพื่อทำการผูกบัญชีได้เลยครับ 🎓💼`;

// ข้อความแนะนำการใช้งานสำหรับผู้ที่ผูกบัญชีเรียบร้อยแล้ว
const welcomeAlreadyBoundMessage = `ยินดีต้อนรับเข้าสู่ Unifind นะครับผม! 🎉 บัญชีของคุณผูกเรียบร้อยแล้ว\n\nคุณสามารถใช้งานได้ง่ายๆ ดังนี้ครับ:\n• 🔍 พิมพ์ข้อความค้นหา เช่น "มีใครเจอกระเป๋าสีดำบ้างไหม"\n• 📝 พิมพ์แจ้งของหายเพื่อให้ระบบคอยเฝ้าระวัง เช่น "ทำร่มสีแดงหายแถวตึก 24 ชั้น 3"\n• 📸 ส่งรูปภาพสิ่งของที่ต้องการตรวจจับและค้นหาคู่แมตช์ในคลังเก็บของหาย`;

/* =========================================================================
 * 🤖 2. GEMINI AI CORE FUNCTIONS (ส่วนงานสมองกล AI - Gemini)
 * ========================================================================= */

/**
 * ตรวจสอบความเฉพาะเจาะจงของรายละเอียดของหายที่ผู้ใช้แจ้ง (Color, Brand, Identifier)
 * @param {string} userMessage - ข้อความแจ้งของหายที่ผู้ใช้พิมพ์เข้ามา
 * @returns {Promise<object>} ผลวิเคราะห์ { isSpecific: boolean, reason: string }
 */
async function checkSpecificity(userMessage) {
  const prompt = `คุณคือผู้ช่วย AI ประเมินความเฉพาะเจาะจงของรายละเอียดของหายในระบบ Unifind
หน้าที่ของคุณคือตรวจสอบข้อความของผู้ใช้ภาษาไทยว่ามีการระบุรายละเอียดสิ่งของ "เฉพาะเจาะจงเพียงพอ" หรือไม่ เพื่อที่จะสามารถระบุตัวตนและตรวจสอบของได้ง่ายขึ้น (เช่น ยี่ห้อ/รุ่น, สี, ลักษณะเด่น, หรือจุดสังเกตเฉพาะตัว)

เกณฑ์การตัดสิน:
1. หากผู้ใช้ระบุเพียงประเภทสิ่งของกว้างๆ เช่น "โทรศัพท์", "กระเป๋า", "กุญแจ", "ร่ม", "หูฟัง", "บัตร" โดยไม่มีการระบุ "สี", "รุ่น/ยี่ห้อ", หรือ "ลักษณะเฉพาะอื่นใดเพิ่มเติมเลย" ให้ถือว่า "ไม่เฉพาะเจาะจงพอ (isSpecific: false)"
2. หากผู้ใช้ระบุรายละเอียดเพิ่มเติม เช่น "โทรศัพท์ iPhone 15 สีดำ", "กระเป๋าตังสีน้ำตาลยี่ห้อ Coach", "กุญแจรถ Honda มีพวงกุญแจหมี", "ร่มสีแดงลายจุด" ให้ถือว่า "เฉพาะเจาะจงเพียงพอ (isSpecific: true)"

ตัวอย่างที่ไม่ผ่าน (isSpecific: false):
- "ทำโทรศัพท์หายครับ"
- "มีใครเจอกระเป๋าสตางค์บ้างไหม"
- "ลืมกุญแจไว้"
- "ตามหาหูฟังที่ทำหล่น"
- "ร่มหายแถวตึก 24" (มีแต่สถานที่ ไม่มีรายละเอียดลักษณะของร่ม)

ตัวอย่างที่ผ่าน (isSpecific: true):
- "ไอแพดสีขาวเคสการ์ตูนหาย"
- "กุญแจรถ Toyota"
- "กระเป๋าเป้สีน้ำเงินยี่ห้อ Adidas"
- "หูฟัง Airpods เคสสีเหลือง"

ข้อความของผู้ใช้ที่ต้องการตรวจสอบ: "${userMessage}"

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น ห้ามมีคำอธิบายอื่นเด็ดขาด:
{
  "isSpecific": true หรือ false,
  "reason": "คำอธิบายภาษาไทยสั้นๆ ที่เป็นมิตรและเป็นกันเอง บอกผู้ใช้ว่าข้อมูลกว้างเกินไปและแนะแนวทางว่าควรระบุอะไรเพิ่ม เช่น ยี่ห้อ รุ่น หรือสี เพื่อค้นหาหรือบันทึกได้แม่นยำยิ่งขึ้น เช่น 'น้องบอทคิดว่ารายละเอียดของหายยังกว้างเกินไปนิดนึงครับ เพื่อความแม่นยำในการตามหา รบกวนระบุสี รุ่น หรือลักษณะพิเศษเพิ่มเติมอีกสักนิดได้ไหมครับ 😊'"
}`;

  try {
    const response = await aiHelper.generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" },
      taskType: "classification",
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Error checking specificity:", e);
    // Fallback ในกรณี AI ผิดพลาด ให้ผ่านไปก่อนเพื่อไม่ให้ระบบสะดุด
    return { isSpecific: true, reason: "" };
  }
}

/* =========================================================================
 * ✉️ 3. LINE MESSAGE UTILITIES (ส่วนเชื่อมต่อกับ LINE Messaging API)
 * ========================================================================= */

/**
 * ส่งข้อความแบบ Reply ไปหาผู้ใช้ LINE
 * @param {string} replyToken - โทเค็นตอบกลับสำหรับคำขอนั้น
 * @param {Array} messages - อาร์เรย์ของข้อความที่ต้องการส่งกลับ
 */
async function replyToLine(replyToken, messages) {
  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken: replyToken,
        messages: messages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      },
    );
  } catch (error) {
    console.error(
      "LINE Reply Error:",
      error.response ? error.response.data : error.message,
    );
  }
}

/**
 * ส่งข้อความแบบ Push (ส่งข้อความรุก) ไปหาผู้ใช้ LINE รายบุคคล
 * @param {string} lineUserId - LINE User ID ของผู้รับ
 * @param {Array} messages - อาร์เรย์ของข้อความที่ต้องการส่ง
 */
async function pushToLine(lineUserId, messages) {
  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: lineUserId,
        messages: messages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      },
    );
    console.log(`✉️ LINE Push Sent successfully to: ${lineUserId}`);
  } catch (error) {
    console.error(
      "LINE Push Error:",
      error.response ? error.response.data : error.message,
    );
  }
}

/**
 * ฟังก์ชันกลางสำหรับเลือกส่งข้อความแบบอัตโนมัติ (Reply หรือ Push)
 * @param {object} dest - ปลายทางที่ต้องการส่ง { replyToken, lineUserId }
 * @param {Array} messages - ข้อความที่จะส่ง
 */
async function sendLineMessage(dest, messages) {
  if (!dest) return;
  if (typeof dest === "string") {
    await replyToLine(dest, messages);
  } else if (dest.replyToken) {
    await replyToLine(dest.replyToken, messages);
  } else if (dest.lineUserId) {
    await pushToLine(dest.lineUserId, messages);
  }
}

/**
 * ดึงไฟล์ภาพที่ผู้ใช้ส่งใน LINE OA มาแปลงเป็น Buffer เพื่อใช้ส่งต่อให้ Gemini Multimodal
 * @param {string} messageId - รหัสข้อความรูปภาพจาก LINE
 * @returns {Promise<object>} โครงสร้างข้อมูล inlineData เพื่อส่งให้ Gemini
 */
async function getLineImageBuffer(messageId) {
  const response = await axios({
    method: "get",
    url: `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    responseType: "arraybuffer",
  });
  return {
    inlineData: {
      data: Buffer.from(response.data).toString("base64"),
      mimeType: "image/jpeg",
    },
  };
}

/* =========================================================================
 * 📱 4. LINE FLEX MESSAGE BUILDERS (ตัวประกอบโครงสร้าง Flex Message)
 * ========================================================================= */

/**
 * สร้าง Flex Message แสดงผลผูกบัญชีสำเร็จ
 * @param {string} role - บทบาทของผู้ใช้ (STUDENT / STAFF)
 * @param {object} details - รายละเอียดบัญชี { studentId, email }
 * @returns {object} โครงสร้าง Flex Message JSON สำหรับ LINE
 */
function buildBindingSuccessFlexMessage(role, details) {
  let rows = [];
  if (role === "STUDENT") {
    if (details.studentId) {
      rows.push({
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "รหัสนักศึกษาที่ผูก:",
            color: "#888888",
            size: "sm",
            flex: 4,
          },
          {
            type: "text",
            text: details.studentId,
            color: "#333333",
            size: "sm",
            weight: "bold",
            flex: 6,
          },
        ],
      });
    }
    rows.push({
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "อีเมลที่ผูก:",
          color: "#888888",
          size: "sm",
          flex: 4,
        },
        {
          type: "text",
          text: details.email,
          color: "#333333",
          size: "sm",
          weight: "bold",
          wrap: true,
          flex: 6,
        },
      ],
    });
  } else if (role === "STAFF") {
    rows.push({
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "อีเมลที่ผูก:",
          color: "#888888",
          size: "sm",
          flex: 4,
        },
        {
          type: "text",
          text: details.email,
          color: "#333333",
          size: "sm",
          weight: "bold",
          wrap: true,
          flex: 6,
        },
      ],
    });
  }

  const welcomeText = `ยินดีต้อนรับครับ! ตอนนี้บัญชี LINE ของคุณผูกกับอีเมลเรียบร้อยแล้ว ต่อจากนี้ถ้ามีใครเก็บของที่คล้ายกับของหายของคุณได้ ผมจะรีบส่งข้อความมาสะกิดบอกทันทีเลยครับ`;

  return {
    type: "flex",
    altText: "ผูกบัญชีเรียบร้อยแล้วครับ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "image",
            url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/UTCC_Sub_Logo.svg/512px-UTCC_Sub_Logo.svg.png",
            size: "xxs",
            aspectMode: "fit",
            aspectRatio: "1:1",
            flex: 0,
          },
        ],
        paddingBottom: "none",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#e8f5e9",
            cornerRadius: "md",
            paddingAll: "10px",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: "ผูกบัญชีเรียบร้อยแล้วครับ",
                weight: "bold",
                color: "#2e7d32",
                size: "md",
                align: "center",
              },
            ],
          },
          {
            type: "text",
            text: welcomeText,
            wrap: true,
            color: "#4a4a4a",
            size: "sm",
            lineSpacing: "3px",
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "md",
            contents: rows,
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#f5f5f5",
            paddingAll: "10px",
            cornerRadius: "sm",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "ระบบจะคอยเฝ้าระวังและแจ้งเตือนให้คุณทันทีที่มีข้อมูลอัปเดตครับ",
                size: "xs",
                color: "#777777",
                wrap: true,
              },
            ],
          },
        ],
      },
    },
  };
}

/**
 * สร้าง Flex Message แสดงรายละเอียดสิ่งของที่พบ
 * @param {object} item - ข้อมูลของที่พบคืน
 * @param {string} altTextPrefix - ข้อความแจ้งเตือนย่อที่จะแสดงบน Notification bar
 * @returns {object} โครงสร้าง Flex Message JSON สำหรับ LINE
 */
function buildFoundItemFlexMessage(item, altTextPrefix = "พบข้อมูลของหาย") {
  const categoryName = getCategoryName(item.category_id);
  const locationText = getLocationNameText(item);

  let statusText = "อยู่ในคลัง";
  if (item.status === "CLAIMED" || item.status === "RETURNED") {
    statusText = "ส่งคืนแล้ว";
  } else if (item.status === "MATCHED") {
    statusText = "จับคู่แล้ว";
  }

  const itemId = item.found_item_id || item.id;

  return {
    type: "flex",
    altText: `${altTextPrefix}: ${item.item_name}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: item.item_name,
            weight: "bold",
            size: "lg",
            color: "#1a1a1a",
            wrap: true,
          },
          {
            type: "separator",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "สถานะ:",
                    color: "#888888",
                    size: "sm",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: statusText,
                    color: "#1e40af",
                    weight: "bold",
                    size: "sm",
                    flex: 7,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "หมวดหมู่:",
                    color: "#888888",
                    size: "sm",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: categoryName,
                    color: "#333333",
                    size: "sm",
                    flex: 7,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "สถานที่พบ:",
                    color: "#888888",
                    size: "sm",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: locationText,
                    color: "#333333",
                    size: "sm",
                    wrap: true,
                    flex: 7,
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0f3057",
            height: "sm",
            action: {
              type: "message",
              label: "ติดต่อขอรับของคืน",
              text: `ติดต่อขอรับของคืนสำหรับ ${item.item_name} (ID: ${itemId})`,
            },
          },
        ],
        paddingTop: "none",
      },
    },
  };
}

/* =========================================================================
 * 📩 5. PARSING UTILITIES (ส่วนวิเคราะห์แกะข้อมูลเบื้องต้น)
 * ========================================================================= */

/**
 * แกะข้อมูลอีเมลและรหัสนักศึกษาจากประโยคสมัครใช้บริการของผู้ใช้
 * @param {string} message - ข้อความของผู้ใช้
 * @returns {object|null} ข้อมูลบทบาทและอีเมล { role, studentId, email, phone, identifier }
 */
function parseBindingMessage(message) {
  const text = message.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const studentWithSpaceRegex = /^(\d{8,15})\s+([^\s@]+@[^\s@]+\.[^\s@]+)$/;

  // เคส 1: พิมพ์ "รหัสนักศึกษา [ช่องว่าง] อีเมล"
  const spaceMatch = text.match(studentWithSpaceRegex);
  if (spaceMatch) {
    const studentId = spaceMatch[1];
    const email = spaceMatch[2].toLowerCase().trim();

    if (email.endsWith("utcc.ac.th")) {
      return {
        role: "STUDENT",
        studentId: studentId,
        email: email,
        phone: null,
        identifier: email,
      };
    }
  }

  // เคส 2: พิมพ์เฉพาะ "อีเมล" เดี่ยวๆ
  if (emailRegex.test(text)) {
    const email = text.toLowerCase().trim();
    if (email.endsWith("utcc.ac.th")) {
      const prefix = email.split("@")[0];
      const hasStudentId = /^\d{8,15}$/.test(prefix);
      const studentId = hasStudentId ? prefix : null;

      // แยกประเภทบทบาทจากชื่อโดเมนและส่วนนำอีเมล
      let role = "STAFF";
      if (email.includes("live") || studentId) {
        role = "STUDENT";
      }

      return {
        role: role,
        studentId: studentId,
        email: email,
        phone: null,
        identifier: email,
      };
    }
  }
  return null;
}

/* =========================================================================
 * ⚡ 6. LINE OA WEBHOOK EVENT HANDLERS (ส่วนดำเนินการตามเป้าหมายของคำสั่ง)
 * ========================================================================= */

/**
 * [Handler] จัดการผู้ใช้ที่เข้ามากดติดตาม LINE OA ใหม่ (Follow Event)
 */
async function handleFollowEvent(event) {
  const replyToken = event.replyToken;
  const lineUserId = event.source.userId;
  const isBound = lineUserId
    ? !!lineBindings.getEmailByLineUserId(lineUserId)
    : false;

  const welcomePatterns = [
    `สวัสดีครับผม ยินดีต้อนรับสู่ Unifind ช่องทางช่วยตามหาของหายของชาว UTCC นะครับ ดีใจที่ได้ดูแลคุณนะครับ 😊`,
    `สวัสดีครับผม ยินดีต้อนรับเข้าสู่ Unifind นะครับ น้องบอทจะคอยช่วยเฝ้าระวังและเช็กของหายในคลังมหาวิทยาลัยให้ตลอด 24 ชั่วโมงเลยครับ ไม่ต้องกังวลนะครับ 😊`,
  ];
  await replyToLine(replyToken, [
    { type: "text", text: getRandomResponse(welcomePatterns) },
    {
      type: "text",
      text: isBound ? welcomeAlreadyBoundMessage : welcomeAndGuideMessage,
    },
  ]);
}

/**
 * [Handler] จัดการกรณีผู้ใช้ส่งรูปภาพเพื่อแจ้งของหาย (Image Report Lost Intent)
 */
async function handleImageReportLost(event, lineUserId, replyToken, baseUrl) {
  const messageId = event.message.id;
  const email = lineBindings.getEmailByLineUserId(lineUserId);

  console.log(`📸 ผู้ใช้ ${lineUserId} ส่งรูปแจ้งของหาย ID: ${messageId}`);

  try {
    // 1. ดึงข้อมูลรูปภาพจาก LINE OA API เพื่อประมวลผล
    const imagePart = await getLineImageBuffer(messageId);

    // 2. จัดเตรียมไบนารีและอัปโหลดไฟล์รูปภาพไปยัง Supabase Storage (item-photos)
    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    const fileName = `lost_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;

    let imageUrl = null;
    try {
      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(fileName, imageBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("item-photos")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
        console.log(
          `📤 อัปโหลดภาพของหายขึ้น Supabase Storage สำเร็จ: ${imageUrl}`,
        );
      } else {
        console.error("❌ Supabase storage upload error:", uploadError.message);
      }
    } catch (storageErr) {
      console.error("❌ Exception during Supabase storage upload:", storageErr);
    }

    // หากการอัปโหลดรูปสำเร็จ ให้เก็บ URL รูปไว้ในเซสชัน และเปลี่ยนสถานะเพื่อรอรับรายละเอียดข้อความ
    if (imageUrl) {
      userSessionStore.setState(lineUserId, "AWAITING_REPORT_DETAILS_TEXT", {
        imageUrl,
      });
      await replyToLine(replyToken, [
        {
          type: "text",
          text: `น้องบอทได้รับรูปภาพสิ่งของเรียบร้อยแล้วครับ! 📸\n\nรบกวนพี่ๆ น้องๆ ช่วยพิมพ์รายละเอียดส่งเข้ามาในแชทนี้หน่อยนะครับว่า:\n• สิ่งของชิ้นนี้คืออะไร (เช่น กุญแจรถ, โทรศัพท์)\n• ทำตกหล่นหายแถวไหน\n• รายละเอียดเพิ่มเติม เช่น สี ยี่ห้อ หรือจุดสังเกตอื่นๆ\n\n(พิมพ์ส่งเข้ามาได้เลยน้า หรือพิมพ์คำว่า "ยกเลิก" เพื่อยกเลิกทำรายการได้ครับ 😊)`,
        },
      ]);
    } else {
      // หากอัปโหลดรูปไม่สำเร็จ ให้ผู้ใช้ระบุเป็นข้อความแทน
      await replyToLine(replyToken, [
        {
          type: "text",
          text: `เกิดข้อผิดพลาดในการอัปโหลดรูปภาพชั่วคราวครับ 🥺 รบกวนพี่ๆ น้องๆ พิมพ์ข้อความรายละเอียดของสิ่งของที่ทำหายส่งเข้ามาให้น้องบอทแทนก่อนน้า`,
        },
      ]);
    }
  } catch (error) {
    console.error("❌ Error in handleImageReportLost:", error);
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `เกิดข้อผิดพลาดในการประมวลผลรูปภาพชั่วคราวครับ 🥺 รบกวนพี่ๆ น้องๆ พิมพ์ข้อความรายละเอียดส่งเข้ามาแทนก่อนน้า`,
      },
    ]);
  }
}

/**
 * [Handler] จัดการกรณีผู้ใช้ส่งรูปภาพสิ่งของเข้ามาค้นหา (Image Multimodal AI)
 */
async function handleImageEvent(event, dest, baseUrl) {
  const replyToken = event ? event.replyToken : null;
  const messageId = event.message.id;
  const lineUserId = event.source.userId;

  console.log(`📸 ระบบได้รับข้อความรูปภาพ ID: ${messageId}`);

  const isBound = !!lineBindings.getEmailByLineUserId(lineUserId);

  if (!isBound) {
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `ขออภัยด้วยนะครับ คุณยังไม่ได้ผูกบัญชี LINE กับ Unifind เลยครับ 🥺\n\nเพื่อความปลอดภัยและเปิดสิทธิ์ใช้งานระบบตามหาของหาย กรุณาพิมพ์ส่งอีเมลมหาวิทยาลัยของคุณเข้ามาในแชทเพื่อผูกบัญชีเข้าใช้งานนะครับ\n\n*หมายเหตุ: ระบบ Unifind เปิดให้ใช้งานเฉพาะนักศึกษาและบุคลากรภายในมหาวิทยาลัยหอการค้าไทยเท่านั้นครับ`,
      },
    ]);
    return;
  }

  // เพิ่มการเช็กสถานะการแจ้งของหายเพื่อสลับ Workflow
  const conversationState = userSessionStore.getState(lineUserId);
  if (conversationState === "AWAITING_REPORT_DETAILS") {
    await handleImageReportLost(event, lineUserId, replyToken, baseUrl);
    return;
  }

  // ส่งข้อความตอบรับทันทีเพื่อแจ้งเตือนว่ากำลังประมวลผลรูปภาพ (ป้องกันสถานะห้องแชทค้าง/เงียบ)
  await replyToLine(replyToken, [
    {
      type: "text",
      text: `น้องบอทได้รับภาพสิ่งของแล้วครับ! กำลังนำภาพไปวิเคราะห์แยกแยะและค้นหาคู่เปรียบเทียบในคลังสักครู่นะครับ... 🤖📸`,
    },
  ]);

  try {
    // ดึงรายการของหายที่ถูกจัดเก็บในระบบ (FOUND หรือ STORED)
    const { data: rawItems, error: itemsError } = await supabase
      .from("items")
      .select(
        "item_id, item_name, category_id, location_id, description, status_id",
      );

    if (itemsError) throw itemsError;

    // กรองสิ่งของเฉพาะที่ระบุสถานะจริง (ไม่เป็น Null)
    const allItems = (rawItems || []).filter(
      (item) => item.status_id !== null && item.status_id !== undefined,
    );

    // ดึงข้อมูลรูปภาพจาก LINE OA API เพื่อประมวลผล
    const imagePart = await getLineImageBuffer(messageId);

    if (!allItems || allItems.length === 0) {
      await sendLineMessage(dest, [
        {
          type: "text",
          text: `น้องบอทได้รับรูปภาพแล้วนะครับ 📸 ลองตรวจสอบคลังของหายในระบบให้แล้ว ตอนนี้ยังไม่มีข้อมูลของในคลังเลยครับ 🥺\n\nเพื่อไม่ให้พลาดโอกาส หากอยากให้น้องบอทคอยเฝ้าระวังไว้ให้ล่วงหน้า สามารถพิมพ์รายละเอียดสิ่งของที่ทำหายส่งเข้ามาในแชทนี้เพื่อบันทึกข้อมูลไว้ได้เลยนะครับ เดี๋ยวถ้ามีคนมาส่งของที่คลังเมื่อไหร่ น้องบอทจะส่งข้อความแจ้งเตือนทันทีเลยครับ!`,
        },
      ]);
      return;
    }

    // จัดเตรียมรายการสิ่งของที่มีอยู่ในระบบเพื่อส่งให้ Gemini วิเคราะห์
    const candidates = allItems.map((item) => ({
      id: item.item_id,
      name: item.item_name,
      category: getCategoryName(item.category_id),
      description: item.description || "",
    }));

    const imageAnalysisPrompt = `คุณคือ AI ตรวจสอบภาพของหายในระบบ Unifind
จงดูรูปภาพสิ่งของที่ผู้ใช้ส่งมานี้อย่างละเอียด วิเคราะห์ว่ามันคืออะไร สีอะไร ลักษณะอย่างไร จากนั้นเปรียบเทียบกับรายการสิ่งของในคลังเก็บของหายด้านล่างนี้:

รายการข้อมูลในคลังเก็บของหาย:
${JSON.stringify(candidates, null, 2)}

หน้าที่ของคุณ:
1. ตรวจสอบว่าในภาพ มีสิ่งของชิ้นใดที่ "ตรงกัน หรือใกล้เคียงมากที่สุด" กับสิ่งของในคลังเก็บของหายหรือไม่
2. หากพบข้อมูลที่สอดคล้องกัน (เช่น ในรูปเป็นกระเป๋าตังค์สีน้ำตาล และใน DB มีกระเป๋าตังค์สีน้ำตาลระบุไว้) ให้ตอบกลับเป็น JSON ในรูปแบบนี้เท่านั้น:
   { "match": true, "itemId": [ใส่ ID ของชิ้นที่เจอในคลัง], "reason": "อธิบายเหตุผลเป็นภาษาไทยว่าทำไมถึงแมตช์กันอย่างสุภาพและเป็นกันเองเหมือนคุยกับเพื่อน" }
3. หากตรวจสอบแล้วไม่พบสิ่งของใดในคลังที่ตรงกับรูปภาพนี้เลย ให้ตอบกลับเป็น JSON รูปแบบนี้:
   { "match": false, "itemId": null, "reason": "อธิบายสั้นๆ ว่าวิเคราะห์แล้วภาพนี้คือประเภทอะไร แต่ไม่พบของลักษณะนี้ในระบบคลัง" }

*ข้อสำคัญ: ในช่อง reason ห้ามเอ่ยถึงเว็บไซต์ แนะนำให้ใช้งานเว็บไซต์ หรือส่งลิงก์เว็บไซต์ของ Unifind ให้กับผู้ใช้โดยเด็ดขาด เนื่องจากเว็บไซต์นี้ถูกออกแบบมาให้เฉพาะเจ้าหน้าที่/บุคลากรภายในใช้งานเท่านั้น (สำหรับผู้ใช้ทั่วไปใน LINE OA นี้ ให้คุยและทำรายการผ่านแชท หรือติดต่อโดยตรงที่จุดบริการของหาย/กองกิจการนักศึกษาเท่านั้น)

ตอบกลับเป็น JSON รูปแบบที่กำหนดเท่านั้น ห้ามพิมพ์ข้อความอื่นนอกเหนือจาก JSON`;

    // สั่งให้ Gemini Multimodal AI ทำการตรวจจับภาพ
    const aiImageResult = await aiHelper.generateContentWithFallback(ai, {
      contents: [imagePart, imageAnalysisPrompt],
      config: { responseMimeType: "application/json" },
    });

    const resultData = JSON.parse(aiImageResult.text.trim());
    console.log("🔮 ผลวิเคราะห์รูปภาพจาก AI:", resultData);

    if (resultData.match && resultData.itemId) {
      const matchedItem = allItems.find(
        (i) => Number(i.item_id) === Number(resultData.itemId),
      );
      const nameText = matchedItem ? `"${matchedItem.item_name}"` : "สิ่งของ";

      await sendLineMessage(dest, [
        {
          type: "text",
          text: `ยินดีด้วยครับ! น้องบอทพบสิ่งของในคลังที่มีลักษณะใกล้เคียงกับรูปของคุณเลยล่ะครับ 😍\n\n📦 ข้อมูลของในคลัง: ${nameText}\n💡 ผลวิเคราะห์รูปภาพ: ${resultData.reason}\n\nแนะนำให้นำหลักฐานยืนยันตัวตน (เช่น บัตรนักศึกษา บัตรประชาชน หรือภาพถ่ายต้นฉบับ) เข้าไปติดต่อขอตรวจสอบและรับของคืนกับพี่ๆ เจ้าหน้าที่ที่ "จุดบริการของหาย (กองกิจการนักศึกษา)" ได้เลยนะครับ! ขอให้ได้รับของคืนอย่างเรียบร้อยน้า 😊`,
        },
      ]);
    } else {
      await sendLineMessage(dest, [
        {
          type: "text",
          text: `น้องบอทได้วิเคราะห์รูปภาพแล้วคิดว่าสิ่งของคือ "${resultData.reason}" นะครับ แต่ในคลังตอนนี้ยังไม่มีของลักษณะนี้เข้ามาเลย 🥺\n\nถ้าสะดวก แนะนำให้พิมพ์แจ้งรายละเอียดของหายไว้ล่วงหน้าในแชท LINE นี้ได้เลยน้า หากมีใครเก็บได้แล้วนำมาส่งไว้ที่คลัง น้องบอทจะรีบส่งข้อความแจ้งเตือนด่วนมาบอกใน LINE นี้ทันทีเลยครับ!`,
        },
      ]);
    }
  } catch (imageError) {
    console.error("Image Processing/AI Error:", imageError);
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `ระบบไม่สามารถประมวลผลรูปภาพนี้ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือพิมพ์คำอธิบายในรูปแบบข้อความแทนครับ`,
      },
    ]);
  }
}

function buildBindingSuccessFlexMessage(role, parsedBinding) {
  const roleText = role === "STAFF" ? "เจ้าหน้าที่" : "นักศึกษา";
  return {
    type: "flex",
    altText: "ผูกบัญชีสำเร็จ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ผูกบัญชีสำเร็จ",
            weight: "bold",
            size: "xl",
            color: "#00B900",
          },
          {
            type: "text",
            text: `ระบบทำการเชื่อมต่อ LINE OA กับอีเมลมหาวิทยาลัยของคุณเรียบร้อยแล้วครับ 🎉\n\n👤 สถานะ: ${roleText}\n📧 อีเมล: ${parsedBinding.email}`,
            wrap: true,
            margin: "md",
          },
        ],
      },
    },
  };
}

async function handleBindingCredentials(replyToken, parsedBinding, lineUserId) {
  const email = parsedBinding.email;
  const { data: existingPerson } = await supabase
    .from("persons")
    .select("person_id")
    .eq("email", email)
    .maybeSingle();
  let personId;
  if (existingPerson) {
    personId = existingPerson.person_id;
  } else {
    const emailPrefix = email.split("@")[0];
    const numericId = emailPrefix.match(/\d+/);
    const studentId = numericId ? numericId[0] : "";
    const { data: newPerson, error: personInsertError } = await supabase
      .from("persons")
      .insert({
        person_type: parsedBinding.role || "STUDENT",
        full_name: emailPrefix,
        student_id: studentId,
        email: email,
        phone: null,
      })
      .select()
      .single();
    if (personInsertError) throw personInsertError;
    personId = newPerson.person_id;
  }

  // บันทึกความสัมพันธ์ LINE User ID คู่กับอีเมลผู้ใช้ลงใน lineBindings
  lineBindings.bind(parsedBinding.identifier, lineUserId);

  // สร้างและส่ง Flex Message แสดงผลผูกสำเร็จ
  const flexMsg = buildBindingSuccessFlexMessage(
    parsedBinding.role,
    parsedBinding,
  );
  await replyToLine(replyToken, [flexMsg]);
}

/**
 * [Handler] ดำเนินการค้นหาสิ่งของในฐานข้อมูลตามที่ผู้ใช้สืบค้น (Search Intent)
 */
async function handleSearchIntent(dest, userMessage) {
  // 1. ใช้ Gemini สกัด Keyword และสถานที่ จากประโยคคำพูดของผู้ใช้
  const extractionPrompt = `วิเคราะห์ข้อความแจ้งของหายต่อไปนี้ แล้วสกัดเอาคีย์เวิร์ด ชื่อสิ่งของ, สถานที่ ออกมาในรูปแบบ JSON ตามโครงสร้างที่กำหนดเท่านั้น ข้อความผู้ใช้: "${userMessage}"`;

  const aiResponse = await aiHelper.generateContentWithFallback(ai, {
    contents: extractionPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          place: { type: Type.STRING },
        },
        required: ["keyword", "place"],
      },
    },
    taskType: "extraction",
  });

  const searchData = JSON.parse(aiResponse.text.trim());

  // 2. ค้นหาในคลังระบบ FoundItem
  let candidateItems = [];
  try {
    let query = supabase
      .from("FoundItem")
      .select("*, Location(*)")
      .in("status", ["FOUND", "STORED"]);
    const orFilter = `item_name.ilike.%${searchData.keyword}%,description.ilike.%${searchData.keyword}%`;
    query = query.or(orFilter);

    // กรองตามสถานที่ถ้าถูกระบุมา
    if (searchData.place) {
      const { data: locs } = await supabase
        .from("Location")
        .select("location_id")
        .ilike("location_name", `%${searchData.place}%`);
      if (locs && locs.length > 0) {
        query = query.in(
          "location_id",
          locs.map((l) => l.location_id),
        );
      }
    }

    const { data: cItems, error: searchError } = await query;
    if (searchError) throw searchError;
    candidateItems = cItems || [];
  } catch (err) {
    console.warn(
      "⚠️ Supabase offline in SEARCH case, using local JSON database fallback",
    );
    const localItems = localDb.getLocalFoundItems();
    const kw = (searchData.keyword || "").toLowerCase();
    const pl = (searchData.place || "").toLowerCase();

    candidateItems = localItems.filter((item) => {
      const statusMatch = ["FOUND", "STORED"].includes(item.status);
      if (!statusMatch) return false;

      const nameMatch = (item.item_name || "").toLowerCase().includes(kw);

      let descText = "";
      try {
        const parsed = JSON.parse(item.description);
        descText = (parsed.textDescription || "").toLowerCase();
      } catch (e) {
        descText = (item.description || "").toLowerCase();
      }
      const descMatch = descText.includes(kw);

      let locMatch = true;
      if (pl) {
        const locName = getMockLocationName(item.location_id).toLowerCase();
        locMatch = locName.includes(pl) || pl.includes(locName);
      }

      return (nameMatch || descMatch) && locMatch;
    });
  }

  let isMatched = candidateItems && candidateItems.length > 0;

  // 3. ระบบแมตช์คำคล้ายด้วย AI (Semantic Search Fallback)
  if (!isMatched) {
    try {
      console.log("🔍 Running Gemini semantic search fallback...");
      
      let allCandidateItems = [];
      let isLocalFallback = false;
      try {
        const { data: dbItems, error: dbErr } = await supabase
          .from("FoundItem")
          .select("*, Location(*)")
          .in("status", ["FOUND", "STORED"]);
        if (dbErr) throw dbErr;
        allCandidateItems = dbItems || [];
      } catch (dbErr) {
        console.warn("⚠️ Supabase offline for semantic search candidates, using local DB fallback");
        allCandidateItems = localDb.getLocalFoundItems();
        isLocalFallback = true;
      }

      const candidatesForAi = allCandidateItems.map((item) => {
        const id = item.found_item_id || item.item_id;
        let descText = "";
        try {
          const parsed = JSON.parse(item.description);
          descText = parsed.textDescription || item.description || "";
        } catch (e) {
          descText = item.description || "";
        }
        return {
          id: id,
          name: item.item_name,
          description: descText,
        };
      });

      const searchPrompt = `คุณคือ AI ระบบช่วยเหลือการค้นหาของหายของ Unifind
เปรียบเทียบสิ่งที่ผู้ใช้กำลังตามหา (Search Query) กับสิ่งของที่มีเก็บอยู่ในคลัง (Stored Items)

สิ่งที่ผู้ใช้ตามหา: "${userMessage}"

รายการของที่มีเก็บอยู่ในคลัง:
${JSON.stringify(candidatesForAi, null, 2)}

หน้าที่ของคุณ:
1. ตรวจสอบว่าในคลัง มีสิ่งของชิ้นใดที่ตรงหรือใกล้เคียงกับที่ผู้ใช้ตามหาหรือไม่ (วิเคราะห์ความหมายข้ามภาษา เช่น ไอแพด -> iPad หรือคำอธิบายใกล้เคียงกัน)
2. หากพบสิ่งของในคลังที่ตรงกัน ให้ตอบกลับเป็น JSON รูปแบบนี้:
   { "match": true, "itemId": [ใส่ ID ของชิ้นที่พบ] }
3. หากไม่พบเลย ให้ตอบกลับเป็น JSON รูปแบบนี้:
   { "match": false, "itemId": null }

ตอบเป็น JSON เท่านั้น`;

      const aiSearchResponse = await aiHelper.generateContentWithFallback(ai, {
        contents: searchPrompt,
        config: { responseMimeType: "application/json" },
        taskType: "matching",
      });

      const semanticResult = JSON.parse(aiSearchResponse.text.trim());
      if (semanticResult.match && semanticResult.itemId) {
        let targetItemId = semanticResult.itemId;
        if (Array.isArray(targetItemId)) {
          targetItemId = targetItemId[0];
        }
        const matchedItem = allCandidateItems.find(
          (i) => Number(i.found_item_id || i.item_id) === Number(targetItemId),
        );
        if (matchedItem) {
          candidateItems = [matchedItem];
          isMatched = true;
        }
      }
    } catch (aiErr) {
      console.error("Semantic search fallback failed:", aiErr);
    }
  }

  // 4. แสดงผลผลลัพธ์กลับไปยังห้องแชท
  if (isMatched) {
    const item = candidateItems[0];
    const flexMsg = buildFoundItemFlexMessage(
      item,
      "พบของลักษณะใกล้เคียงในคลัง",
    );
    await sendLineMessage(dest, [
      {
        type: "text",
        text: `เย้! น้องบอทลองเช็กดูแล้ว พบของในคลังที่มีลักษณะใกล้เคียงกับที่คุณกำลังตามหาทั้งหมด ${candidateItems.length} รายการเลยครับ ลองดูรายละเอียดตามข้อมูลด้านล่างนี้ได้เลยน้า 👇`,
      },
      flexMsg,
    ]);
  } else {
    await sendLineMessage(dest, [
      {
        type: "text",
        text: `น้องบอทพยายามลองหาดูแล้ว แต่ตอนนี้ยังไม่พบของลักษณะ "${searchData.keyword}" ในคลังเก็บของเลยครับ 🥺\n\nแต่ไม่ต้องกังวลไปนะครับ! แนะนำให้แจ้งลักษณะของหาย (Lost Item) ไว้ล่วงหน้าในแชทนี้ได้เลยน้า เดี๋ยวถ้ามีใครเก็บได้แล้วนำมาส่งไว้ที่คลัง น้องบอทจะรีบส่งข้อความแจ้งเตือนด่วนมาบอกใน LINE นี้ทันทีเลยครับ!`,
      },
    ]);
  }
}

/**
 * [Handler] จัดการกระบวนการสร้างโพสต์บันทึกของหายใหม่ (Report Lost Intent)
 */
async function handleReportLostIntent(
  dest,
  userMessage,
  email,
  imageUrl = null,
) {
  const isEmail = email.includes("@");
  const contactLabel = isEmail ? "อีเมลผู้แจ้ง" : "เบอร์โทรผู้แจ้ง";

  // 1. สกัดข้อมูลรายละเอียดสิ่งของและสถานที่ตกหายโดย AI
  const reportExtractionPrompt = `คุณคือ AI ระบบบันทึกแจ้งของหายของ Unifind
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

  const aiResponse = await aiHelper.generateContentWithFallback(ai, {
    contents: reportExtractionPrompt,
    config: { responseMimeType: "application/json" },
    taskType: "extraction",
  });

  const extractedData = JSON.parse(aiResponse.text.trim());

  // ล้างและแปลงข้อมูลหมวดหมู่ (Category ID) ให้เป็นตัวเลขจำนวนเต็มที่ถูกต้อง ป้องกันข้อผิดพลาดของประเภทข้อมูลจาก AI เช่น [3] หรือ "3"
  let categoryId = extractedData.category_id;
  if (Array.isArray(categoryId)) {
    categoryId = categoryId[0];
  }
  categoryId = parseInt(categoryId, 10);
  if (isNaN(categoryId) || categoryId < 1 || categoryId > 5) {
    categoryId = 5; // ค่าเริ่มต้นเป็นหมวดหมู่อื่นๆ
  }

  // แปลงชื่อสถานที่ให้เข้ากับ Schema location ID
  const getLocationId = async (locationName) => {
    if (!locationName) return null;

    // หากระบุคีย์เวิร์ดเกี่ยวกับการไม่ระบุสถานที่
    const isUnspecified =
      locationName.includes("ไม่ระบุ") ||
      locationName.includes("ไม่ได้ระบุ") ||
      locationName.includes("ไม่มี") ||
      locationName.includes("ไม่ทราบ") ||
      locationName.includes("unknown");
    if (isUnspecified) return null;

    try {
      const { data: dbLocations } = await supabase
        .from("locations")
        .select("location_id, location_name")
        .eq("is_active", true);

      if (dbLocations) {
        // Sort locations by length descending to match more specific ones first
        const sortedLocs = [...dbLocations].sort((a, b) => b.location_name.length - a.location_name.length);
        for (const loc of sortedLocs) {
          if (locationName.includes(loc.location_name)) {
            return loc.location_id;
          }
        }
      }
    } catch (dbErr) {
      console.warn("Error fetching locations in lineRoutes:", dbErr);
    }

    const mapping = {
      24: 1,
      "อาคาร 24": 1,
      "ตึก 24": 1,
      6: 2,
      "อาคาร 6": 2,
      "ตึก 6": 2,
      โรงอาหาร: 3,
      ห้องสมุด: 4,
    };
    for (const [key, val] of Object.entries(mapping)) {
      if (locationName.includes(key)) return val;
    }
    return null; // เมื่อไม่พบคีย์เวิร์ดตรงตามแผนผัง ให้ถือว่าไม่ระบุสถานที่ (null)
  };

  // โครงสร้าง Metadata บันทึกใส่คอลัมน์ description
  const dbDescription = JSON.stringify({
    textDescription: extractedData.description || "",
    finder_type: "STUDENT",
    finder_phoneNumber: null,
    finder_studentId: null,
    finder_universityEmail: email,
  });

  // 2. ดำเนินการจัดเก็บลงระบบฐานข้อมูล
  let personId;
  let newLostItem;
  try {
    const queryField = isEmail ? "email" : "phone";
    const { data: existingPerson } = await supabase
      .from("persons")
      .select("person_id")
      .eq(queryField, email)
      .maybeSingle();

    if (existingPerson) {
      personId = existingPerson.person_id;
    } else {
      const emailPrefix = email.split("@")[0];
      const numericId = emailPrefix.match(/\d+/);
      const studentId = numericId ? numericId[0] : "";

      const { data: newPerson, error: personInsertError } = await supabase
        .from("persons")
        .insert({
          person_type: "STUDENT",
          full_name: emailPrefix,
          student_id: studentId,
          email: email,
          phone: null,
        })
        .select()
        .single();

      if (personInsertError) throw personInsertError;
      personId = newPerson.person_id;
    }

    // 3. บันทึกลงตาราง lost_items
    const { data: insertedItem, error: insertLostError } = await supabase
      .from("lost_items")
      .insert({
        item_name: extractedData.item_name,
        category_id: categoryId, // ใช้ตัวแปรที่แปลงตัวเลขหมวดหมู่เรียบร้อยแล้ว
        location_id: await getLocationId(extractedData.place),
        lost_datetime: new Date().toISOString(),
        description: extractedData.description || "",
        image_url: imageUrl, // พ่วงบันทึก URL รูปภาพ
        reporter_id: personId,
        status_id: 1, // สถานะ 'LOST'
      })
      .select()
      .single();

    if (insertLostError) throw insertLostError;
    newLostItem = insertedItem;
  } catch (err) {
    console.warn(
      "⚠️ Supabase offline in REPORT_LOST case, using local JSON database fallback",
      err,
    );
    personId = localDb.getOrCreateLocalPerson(email);

    newLostItem = localDb.insertLocalLostItem({
      item_name: extractedData.item_name,
      category_id: categoryId, // ใช้ตัวแปรที่แปลงตัวเลขหมวดหมู่เรียบร้อยแล้ว
      location_id: await getLocationId(extractedData.place),
      floor: extractedData.floor || "",
      lost_datetime: new Date().toISOString(),
      description: dbDescription,
      image_url: imageUrl, // พ่วงบันทึก URL รูปภาพ
      status: "LOST",
      reporter_id: personId,
    });
  }

  // 3. ประสานกระบวนการจับคู่ทันที (Real-time Matchmaking)
  const matchingService = require("../services/matchingService");
  matchingService.checkLostItemMatch(newLostItem);

  // ปรับรูปแบบแสดงสถานที่
  let displayPlace = extractedData.place || "ไม่ระบุ";
  const isUnspecified =
    !extractedData.place ||
    extractedData.place.includes("ไม่ระบุ") ||
    extractedData.place.includes("ไม่ได้ระบุ") ||
    extractedData.place.includes("ไม่มี") ||
    extractedData.place.includes("ไม่ทราบ") ||
    extractedData.place.includes("unknown");
  if (isUnspecified) {
    displayPlace = "ไม่ระบุ";
  }

  let displayFloor = extractedData.floor || "";
  if (displayFloor && displayPlace.includes(`ชั้น ${displayFloor}`)) {
    displayFloor = "";
  }

  await sendLineMessage(dest, [
    {
      type: "text",
      text: `บันทึกการแจ้งของหายของคุณเข้าสู่ระบบเรียบร้อยแล้วครับ! 📝\nน้องบอทจะช่วยแสกนหาของในคลังให้อัตโนมัติเลยนะครับ\n\n📋 รายละเอียดที่บันทึก:\n• สิ่งของ: ${extractedData.item_name}\n• สถานที่: ${displayPlace}${displayFloor ? " ชั้น " + displayFloor : ""}\n• รายละเอียด: ${extractedData.description || "-"}\n• ${contactLabel}: ${email}\n\nหากพบคู่ของหายที่ลักษณะตรงกันในคลัง ระบบจะรีบส่งข้อความแจ้งเตือนด่วนมาบอกทันทีเลยนะครับ 😊`,
    },
  ]);
}

/**
 * [Handler] จัดการตอบกลับบทรสนิยมทั่วไป (Chitchat Intent)
 */
async function handleChitchatIntent(dest, userMessage) {
  const chatbotPrompt = `คุณคือผู้ดูแล (บอทอัจฉริยะ) คอยช่วยเหลือตามหาของหายของแพลตฟอร์ม Unifind ประจำมหาวิทยาลัยหอการค้าไทย (UTCC) ให้ตอบกลับอย่างสุภาพ เป็นกันเอง มีความกระตือรือร้นและใส่ใจแบบมนุษย์ตัวจริง ห้ามพูดว่าตนเป็น "ระบบ" หรือมีวงเล็บระบบ ให้คุยสั้นๆ กระชับ เข้าใจง่าย และคอยให้กำลังใจให้ผู้ใช้เจอของหายไวๆ เสมอ 
*ข้อสำคัญที่สุด: ห้ามเอ่ยถึงเว็บไซต์ แนะนำให้ใช้งานเว็บไซต์ หรือส่งลิงก์เว็บไซต์ของ Unifind ให้กับผู้ใช้โดยเด็ดขาด เนื่องจากเว็บไซต์นี้ถูกออกแบบมาให้เฉพาะเจ้าหน้าที่/บุคลากรภายในใช้งานเท่านั้น (สำหรับผู้ใช้ทั่วไปใน LINE OA นี้ ให้คุยและทำรายการผ่านแชท หรือติดต่อโดยตรงที่จุดบริการของหาย/กองกิจการนักศึกษาเท่านั้น)
ข้อความผู้ใช้: "${userMessage}"`;

  const aiChatResponse = await aiHelper.generateContentWithFallback(ai, {
    contents: chatbotPrompt,
    config: { temperature: 0.85 },
    taskType: "chitchat",
  });

  await sendLineMessage(dest, [
    { type: "text", text: aiChatResponse.text.trim() },
  ]);
}

/**
 * [Handler] ผู้คุมการประมวลผลเหตุการณ์ส่งข้อความชนิดอักษร (Text Message Router)
 */
async function handleTextEvent(event, baseUrl) {
  const replyToken = event.replyToken;
  const userMessage = event.message.text.trim();
  const lineUserId = event.source.userId;

  console.log(
    `💬 LINE บอทได้รับข้อความ: "${userMessage}" จาก UID: ${lineUserId}`,
  );

  // ตรวจสอบสิทธิ์การผ่านการผูกบัญชีล่วงหน้า เพื่อประมวลผลการแสดงผลข้อความอย่างถูกต้อง
  const isBound = !lineBindings.getEmailByLineUserId(lineUserId) ? false : true;

  // --- ส่วนเช็กสถานะบทสนทนาโต้ตอบแบบต่อเนื่อง (FSM Memory Interceptor - แก้ไขจุดอ่อนข้อที่ 2) ---
  if (isBound) {
    const conversationState = userSessionStore.getState(lineUserId);
    if (
      conversationState === "AWAITING_REPORT_DETAILS" ||
      conversationState === "AWAITING_REPORT_DETAILS_TEXT"
    ) {
      const email = lineBindings.getEmailByLineUserId(lineUserId);

      // รองรับกรณีผู้ใช้ขอยกเลิกกลางคัน
      const cancelKeywords = [
        "ยกเลิก",
        "ยกเลิกการแจ้ง",
        "ไม่แจ้งแล้ว",
        "cancel",
        "หยุด",
      ];
      if (cancelKeywords.some((k) => userMessage.toLowerCase() === k)) {
        userSessionStore.clearState(lineUserId);
        await replyToLine(replyToken, [
          {
            type: "text",
            text: "ยกเลิกการทำรายการแจ้งของหายชั่วคราวแล้วครับ คุณสามารถพิมพ์คุยหรือตามหาของชิ้นอื่นได้ตามปกติเลยครับผม 😊",
          },
        ]);
        return;
      }

      // ดึงข้อมูลรูปภาพที่อัปโหลดสำรองไว้จากเฟสแรก
      let imageUrl = null;
      if (conversationState === "AWAITING_REPORT_DETAILS_TEXT") {
        const sessionData = userSessionStore.getData(lineUserId);
        if (sessionData && sessionData.imageUrl) {
          imageUrl = sessionData.imageUrl;
        }
      }

      // ส่งข้อความแจ้งตอบรับทันทีเพื่อป้องกันห้องแชทค้าง
      await replyToLine(replyToken, [
        {
          type: "text",
          text: `น้องบอทได้รับข้อมูลรายละเอียดแล้วครับ! กำลังนำไปประมวลผลด้วย AI เพื่อลงทะเบียนแจ้งของหายและตรวจสอบคู่แมตช์ในคลังสักครู่นะครับ... 🤖📝`,
        },
      ]);

      // ส่งข้อมูลแจ้งของหายนี้ให้ประมวลผลทันทีพร้อมแนบรูปภาพ (ถ้ามี)
      try {
        await handleReportLostIntent(
          { lineUserId },
          userMessage,
          email,
          imageUrl,
        );
      } catch (err) {
        console.error("❌ Error during handleReportLostIntent:", err);
        await sendLineMessage({ lineUserId }, [
          {
            type: "text",
            text: `ขออภัยด้วยนะครับ น้องบอทไม่สามารถบันทึกข้อมูลแจ้งของหายได้ในขณะนี้เนื่องจากระบบตรวจจับของหาย AI ติดขัดชั่วคราว 🥺\n\nระบบได้รับการรีเซ็ตบทสนทนาแล้ว พี่ๆ น้องๆ สามารถลองส่งรูปหรือพิมพ์แจ้งรายละเอียดใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่โดยตรงได้เลยครับ`,
          },
        ]);
      } finally {
        userSessionStore.clearState(lineUserId); // รีเซ็ตสถานะสู่ IDLE แน่นอน
      }
      return;
    }
  }

  // --- ส่วนสกัดจับคีย์เวิร์ดเฉพาะกิจ (Keyword Interceptors) ---

  // 1. บริการด่วน: พิมพ์คำว่า "ผูกบัญชี"
  if (userMessage === "ผูกบัญชี") {
    if (isBound) {
      const currentlyBoundEmail = lineBindings.getEmailByLineUserId(lineUserId);
      await replyToLine(replyToken, [
        {
          type: "text",
          text: `บัญชี LINE ของคุณผูกกับอีเมล ${currentlyBoundEmail} เรียบร้อยแล้วครับผม ไม่จำเป็นต้องผูกบัญชีซ้ำแล้วนะครับ 😊`,
        },
      ]);
      return;
    }
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `รบกวนพิมพ์ส่งอีเมลมหาวิทยาลัยของคุณเข้ามาในแชทนี้ เพื่อทำการลงทะเบียนผูกบัญชีได้เลยครับ 😊\n\n*หมายเหตุ: ระบบ Unifind เปิดให้ใช้งานเฉพาะนักศึกษาและบุคลากรภายในมหาวิทยาลัยหอการค้าไทยเท่านั้นครับ`,
      },
    ]);
    return;
  }

  // 2. บริการด่วน: พิมพ์คำว่า "แจ้งของหาย"
  if (userMessage === "แจ้งของหาย") {
    if (!isBound) {
      await replyToLine(replyToken, [
        {
          type: "text",
          text: `ขออภัยด้วยนะครับ คุณยังไม่ได้ผูกบัญชี LINE กับ Unifind เลยครับ 🥺\n\nเพื่อความปลอดภัยและเปิดสิทธิ์ใช้งานระบบตามหาของหาย กรุณาพิมพ์ส่งอีเมลมหาวิทยาลัยของคุณเข้ามาในแชทเพื่อผูกบัญชีเข้าใช้งานก่อนนะครับ`,
        },
      ]);
      return;
    }

    // กำหนดสถานะของผู้ใช้เป็นกำลังรอข้อมูลรายละเอียดของหาย
    userSessionStore.setState(lineUserId, "AWAITING_REPORT_DETAILS");

    await replyToLine(replyToken, [
      {
        type: "text",
        text: `รับทราบครับผม! ยินดีช่วยตามหาเต็มที่เลยน้า ไม่ต้องกังวลนะครับ เดี๋ยวเราช่วยกันหาจนเจอแน่นอน 💪\n\nรบกวนช่วยส่งรูปภาพสิ่งของที่หาย (ถ้ามี) หรือพิมพ์รายละเอียดบอกน้องบอทในแชทนี้ได้เลยครับ:\n• ของชิ้นนั้นคืออะไร (เช่น กุญแจรถ, กระเป๋าตังค์, โทรศัพท์)\n• ทำตกหล่นหายแถวไหน\n• รายละเอียดเพิ่มเติม เช่น สี ยี่ห้อ หรือจุดสังเกต\n\n(หากส่งรูปภาพหรือพิมพ์ข้อความเสร็จแล้วส่งเข้ามาได้เลย หรือพิมพ์คำว่า "ยกเลิก" เพื่อยกเลิกได้ครับ ❤️)`,
      },
    ]);
    return;
  }

  // 3. บริการด่วน: กดปุ่มติดต่อรับของคืนสำเร็จจาก LINE Flex
  if (userMessage.startsWith("ติดต่อขอรับของคืนสำหรับ")) {
    const cleanMsg = userMessage.replace("ติดต่อขอรับของคืนสำหรับ", "").trim();
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `ยินดีด้วยนะครับที่ตามหาของเจอแล้ว! 🎉 สำหรับการติดต่อรับคืน ${cleanMsg}\n\nรบกวนพี่ๆ น้องๆ เตรียมหลักฐานแสดงตัวตน (เช่น บัตรนักศึกษา บัตรประชาชน หรือรูปถ่ายของชิ้นนั้น) แล้วเข้าติดต่อพี่ๆ เจ้าหน้าที่ได้ที่ "จุดบริการของหาย (กองกิจการนักศึกษา)" ได้เลยนะครับ น้องบอทเอาใจช่วยให้ได้รับของกลับคืนมืออย่างเรียบร้อยน้า 😊`,
      },
    ]);
    return;
  }

  // 4. ดักจับคำทักทายทั่วไป (Greeting Keywords)
  const greetingKeywords = [
    "สวัสดี",
    "สวัสดีครับ",
    "สวัสดีค่ะ",
    "หวัดดี",
    "ฮัลโหล",
    "hello",
    "hi",
  ];
  if (
    greetingKeywords.some(
      (k) =>
        userMessage.toLowerCase() === k ||
        userMessage.toLowerCase().startsWith(k),
    )
  ) {
    const greetingResponses = [
      `สวัสดีครับผม ยินดีต้อนรับสู่ Unifind นะครับ วันนี้อยากให้ช่วยสืบค้นของหายชิ้นไหน ถามมาได้เลยครับ 😊`,
      `สวัสดีครับผม ยินดีต้อนรับสู่ Unifind ครับ! คุณสามารถแจ้งลักษณะของหายหรือถ่ายรูปส่งเข้ามาเพื่อค้นหาในคลังได้เลยนะครับ`,
    ];
    await replyToLine(replyToken, [
      { type: "text", text: getRandomResponse(greetingResponses) },
      {
        type: "text",
        text: isBound ? welcomeAlreadyBoundMessage : welcomeAndGuideMessage,
      },
    ]);
    return;
  }

  // 5. ดักจับคำขอคู่มือการใช้งาน (Guide Keywords)
  const guideKeywords = [
    "วิธีใช้งาน",
    "คู่มือ",
    "ทำไง",
    "ทำอย่างไร",
    "ช่วยด้วย",
    "help",
    "เริ่มต้น",
    "เริ่ม",
    "menu",
    "เมนู",
    "ใช้งานยังไง",
    "วิธีใช้",
  ];
  if (
    guideKeywords.some(
      (k) =>
        userMessage.toLowerCase() === k ||
        userMessage.toLowerCase().includes(k),
    )
  ) {
    await replyToLine(replyToken, [
      {
        type: "text",
        text: isBound ? welcomeAlreadyBoundMessage : welcomeAndGuideMessage,
      },
    ]);
    return;
  }

  // 6. ดักจับคำขอบคุณ (Thanks Keywords)
  const thanksKeywords = [
    "ขอบคุณ",
    "ขอบคุณครับ",
    "ขอบคุณค่ะ",
    "ขอบใจ",
    "thank",
    "thankyou",
  ];
  if (thanksKeywords.some((k) => userMessage.toLowerCase().includes(k))) {
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `ด้วยความยินดีอย่างยิ่งครับผม 😊 Unifind ขอให้คุณได้รับของหายคืนไวๆ นะครับ ขอให้เป็นวันที่ดีครับ!`,
      },
    ]);
    return;
  }

  // --- ส่วนประเมินรหัสลงทะเบียนผูกบัญชี (OTP Registration Process) ---

  let cleanMessage = userMessage;
  if (cleanMessage.startsWith("ผูกบัญชี:")) {
    cleanMessage = cleanMessage.substring(9).trim();
  } else if (cleanMessage.startsWith("ผูกบัญชี")) {
    cleanMessage = cleanMessage.substring(8).trim();
  }

  const parsedBinding = parseBindingMessage(cleanMessage);
  if (parsedBinding) {
    // หากเคยผูกแล้วด้วยอีเมลตัวเดียวกันนี้ ปฏิเสธการส่ง OTP รันซ้ำทันที
    if (isBound) {
      const currentlyBoundEmail = lineBindings.getEmailByLineUserId(lineUserId);
      if (
        currentlyBoundEmail &&
        currentlyBoundEmail.toLowerCase().trim() ===
          parsedBinding.email.toLowerCase().trim()
      ) {
        await replyToLine(replyToken, [
          {
            type: "text",
            text: `บัญชี LINE ของคุณผูกกับอีเมล ${parsedBinding.email} เรียบร้อยแล้วครับผม ไม่จำเป็นต้องยืนยันตัวตนใหม่แล้วนะครับ 😊`,
          },
        ]);
        return;
      }
    }

    // หากส่งอีเมลมาถูกต้อง สร้างคำขอ OTP รอดำเนินการและส่งเมล
    const otp = otpStore.createPending(lineUserId, parsedBinding);
    await emailService.sendOtpEmail(parsedBinding.email, otp);
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `น้องบอทได้ส่งรหัสยืนยันตัวตน (OTP) 6 หลักไปยังอีเมล ${parsedBinding.email} ของคุณเรียบร้อยแล้วครับผม 📩\n\nกรุณาตรวจสอบกล่องจดหมายของคุณ (รวมถึงกล่องข้อความขยะ/Junk/Spam) และนำรหัส OTP 6 หลักมาพิมพ์ตอบกลับในแชทนี้เพื่อยืนยันสิทธิ์ภายใน 5 นาทีนะครับ`,
      },
    ]);
    return;
  }

  if (!isBound) {
    const pendingVerification = otpStore.getPending(lineUserId);

    // หากป้อนรหัส OTP 6 หลัก
    if (/^\d{6}$/.test(userMessage)) {
      if (pendingVerification) {
        if (userMessage === pendingVerification.otp) {
          // ตรวจพบ OTP ถูกต้อง ดำเนินการบันทึกผูกบัญชี
          const bindingData = {
            role: pendingVerification.role,
            studentId: pendingVerification.studentId,
            email: pendingVerification.email,
            phone: null,
            identifier: pendingVerification.email,
          };
          await handleBindingCredentials(replyToken, bindingData, lineUserId);
          otpStore.clearPending(lineUserId);
        } else {
          await replyToLine(replyToken, [
            {
              type: "text",
              text: `รหัส OTP ไม่ถูกต้องครับผม ❌ กรุณาลองใหม่อีกครั้ง หรือพิมพ์ส่งข้อมูลอีเมลใหม่เพื่อขอรหัสตัวใหม่ครับผม`,
            },
          ]);
        }
      } else {
        await replyToLine(replyToken, [
          {
            type: "text",
            text: `ไม่พบคำขอรหัส OTP หรือรหัสผ่านเวลา 5 นาทีจนหมดอายุแล้วครับผม ⏱️\n\nรบกวนส่งข้อมูลอีเมลมหาวิทยาลัยของคุณเข้ามาใหม่อีกครั้งเพื่อขอรหัส OTP ตัวใหม่นะครับ`,
          },
        ]);
      }
      return;
    }

    // กรณีผู้ใช้ยังไม่ได้ลงทะเบียนผูกบัญชี ส่งข้อความแจ้งเตือนสิทธิ์
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `ขออภัยด้วยนะครับ คุณยังไม่ได้ผูกบัญชี LINE กับ Unifind เลยครับ 🥺\n\nเพื่อความปลอดภัยและเปิดสิทธิ์ใช้งานระบบตามหาของหาย กรุณาพิมพ์ส่งอีเมลมหาวิทยาลัยของคุณเข้ามาในแชทเพื่อผูกบัญชีเข้าใช้งานนะครับ\n\n*หมายเหตุ: ระบบ Unifind เปิดให้ใช้งานเฉพาะนักศึกษาและบุคลากรภายในมหาวิทยาลัยหอการค้าไทยเท่านั้นครับ`,
      },
    ]);
    return;
  }

  // --- ส่วนวิเคราะห์ความตั้งใจของผู้ใช้ (Hybrid NLP Router) ---
  try {
    // ส่งข้อความแจ้งกำลังประมวลผลด้วย AI ทันที (ป้องกันหน้าจอค้าง)
    await replyToLine(replyToken, [
      {
        type: "text",
        text: `น้องบอทได้รับข้อความของคุณเรียบร้อยแล้ว กำลังประมวลผลวิเคราะห์ด้วยสมองกล AI สักครู่นะครับ... 🤖💭`,
      },
    ]);

    const classificationPrompt = `วิเคราะห์ประโยคของผู้ใช้ภาษาไทยต่อไปนี้ว่ามีจุดประสงค์อะไรในระบบตามหาของหาย โดยเลือกข้อที่ถูกต้องที่สุดเพียงข้อเดียว:
1. "SUMMARY" - หากผู้ใช้ถามภาพรวมกว้างๆ ว่าตอนนี้ในระบบมีของอะไรหายบ้าง, มีหมวดหมู่ไหนบ้าง, หรือมีสถิติอะไรบ้าง (เช่น "มีของตกหล่นอะไรบ้าง", "ขอดูกลุ่มของหายหน่อย")
2. "SEARCH" - หากผู้ใช้ต้องการสอบถาม/สืบค้นว่าปัจจุบันมีคนเก็บสิ่งของชิ้นหนึ่งได้แล้วหรือยัง (เช่น "มีคนเก็บโทรศัพท์ได้ไหม", "ตามหาโทรศัพท์สีขาวที่หาย")
3. "REPORT_LOST" - หากผู้ใช้แจ้งว่าตนทำของหายหรือลืมของไว้ และระบุประเภทของที่หายชัดเจนเพื่อต้องการบันทึกข้อมูลของหายใหม่เข้าระบบ (เช่น "แจ้งของหาย: ร่มสีดำ", "ทำพวงกุญแจตกหายครับ", "แจ้งของหายเป็นกระเป๋าสีแดง")
4. "CHITCHAT" - หากเป็นการพูดคุยทั่วไป ทักทาย บ่น หรือพิมพ์เกริ่นสั้นๆ ว่าทำของหายเฉยๆ โดยที่ยังไม่ได้ระบุประเภท/ลักษณะสิ่งของที่สูญหายชัดเจน (เช่น "ทำของหายครับ", "ลืมของไว้ทำไงดี")

ข้อความผู้ใช้: "${userMessage}"
ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น: { "intent": "ตัวเลือกที่เลือก" }`;

    const classificationResult = await aiHelper.generateContentWithFallback(
      ai,
      {
        contents: classificationPrompt,
        config: { responseMimeType: "application/json" },
        taskType: "classification",
      },
    );

    const intentData = JSON.parse(classificationResult.text.trim());

    // เคสที่ 1: สรุปภาพรวมสิ่งของสูญหาย (SUMMARY)
    if (intentData.intent === "SUMMARY") {
      let lostItems = [];
      let foundItems = [];
      try {
        const { data: lItems, error: lError } = await supabase
          .from("lost_items")
          .select("category_id");
        if (lError) throw lError;
        lostItems = lItems || [];

        const { data: fItems, error: fError } = await supabase
          .from("items")
          .select("category_id");
        if (fError) throw fError;
        foundItems = fItems || [];
      } catch (err) {
        console.warn(
          "Supabase offline in SUMMARY case, using local JSON database fallback",
        );
        lostItems = localDb.getLocalLostItems();
        foundItems = localDb.getLocalFoundItems();
      }

      const allItems = [...lostItems, ...foundItems];

      if (allItems.length === 0) {
        await sendLineMessage({ lineUserId }, [
          {
            type: "text",
            text: `[รายงานสถานะระบบ]\n\nปัจจุบันยังไม่มีรายงานสิ่งของสูญหายหรือสิ่งของคงค้างภายในระบบ Unifind ครับ`,
          },
        ]);
        return;
      }

      const countMap = {};
      allItems.forEach((item) => {
        const catName = getCategoryName(item.category_id);
        countMap[catName] = (countMap[catName] || 0) + 1;
      });

      let summaryReply = `[รายงานสรุปสถิติตัวเลขสิ่งของคงค้างในระบบ Unifind]

พบสิ่งของที่ลงทะเบียนแยกตามหมวดหมู่ในคลังระบบปัจจุบันดังนี้ครับ:`;

      Object.keys(countMap).forEach((categoryName) => {
        summaryReply += `\nหมวดหมู่: ${categoryName}\nจำนวนสิ่งของ: ${countMap[categoryName]} รายการ\n────────────────`;
      });

      summaryReply += `\n\nคำแนะนำเพิ่มเติม:\nหากท่านคาดว่ามีสิ่งของของท่านอยู่ กรุณาพิมพ์ระบุรายละเอียด ชื่อของตกหล่น หรือส่งรูปถ่ายเพื่อตรวจสอบเจาะจงได้เลยครับ`;

      await sendLineMessage({ lineUserId }, [
        { type: "text", text: summaryReply },
      ]);
      return;
    }

    // เคสที่ 2: ค้นหาเจาะจงรายช
    if (intentData.intent === "SEARCH") {
      await handleSearchIntent({ lineUserId }, userMessage);
      return;
    }

    // เคสที่ 3: แจ้งของหายผ่านแชท (REPORT_LOST)
    if (intentData.intent === "REPORT_LOST") {
      const email = lineBindings.getEmailByLineUserId(lineUserId);
      if (!email) {
        await sendLineMessage({ lineUserId }, [
          {
            type: "text",
            text: `ขออภัยด้วยนะครับ คุณยังไม่ได้ผูกบัญชี LINE กับ Unifind เลยครับผม 🥺\n\nเพื่อความปลอดภัยในการยืนยันตัวตนเพื่อแจ้งของหาย รบกวนพิมพ์ "ผูกบัญชี" เพื่อดูวิธีเชื่อมโยงข้อมูลกับระบบก่อนนะครับ`,
          },
        ]);
        return;
      }

      const specificity = await checkSpecificity(userMessage);
      if (!specificity.isSpecific) {
        // บันทึกสเตตัสเพื่อรอให้พิมพ์คำตอบถัดไปโดยตรง
        userSessionStore.setState(lineUserId, "AWAITING_REPORT_DETAILS");
        await sendLineMessage({ lineUserId }, [
          {
            type: "text",
            text: `${specificity.reason}\n\nรบกวนช่วยระบุรายละเอียดเพิ่มเติมและพิมพ์ตอบกลับเข้ามาใหม่ได้เลยครับ (หรือพิมพ์ "ยกเลิก" เพื่อยกเลิกรายการ)`,
          },
        ]);
        return;
      }

      await handleReportLostIntent({ lineUserId }, userMessage, email);
      return;
    }

    // เคสที่ 4: แชทคุยทั่วไป (CHITCHAT)
    await handleChitchatIntent({ lineUserId }, userMessage);
  } catch (error) {
    console.error("⚠️ Hybrid AI System Error:", error);
    try {
      const fs = require('fs');
      const path = require('path');
      fs.writeFileSync(path.resolve(__dirname, '../../error_log.txt'), `Time: ${new Date().toISOString()}\nMessage: ${userMessage}\nError: ${error.stack || String(error)}\n`);
    } catch (e) {
      console.error("Failed to write error_log.txt:", e);
    }
    await sendLineMessage({ lineUserId }, [
      {
        type: "text",
        text: `อุ๊ย! ขออภัยด้วยนะครับ พอดีสมองบอทตื้อไปชั่วขณะ (ระบบ AI ขัดข้อง) ทำให้ยังอ่านข้อความเมื่อกี้ไม่ได้เลยครับ 🥺\n\nรบกวนลองส่งข้อความมาใหม่อีกครั้ง หรือถ้ามีเรื่องด่วนจริงๆ สามารถแวะเข้ามาสอบถามพี่ๆ เจ้าหน้าที่ที่จุดบริการของหาย (กองกิจการนักศึกษา) ได้เลยน้า`,
      },
    ]);
  }
}
/* =========================================================================
 * 🕸️ 7. MAIN WEBHOOK ENDPOINT (จุดเชื่อมรับสัญญาณทราฟฟิกจาก LINE Webhook API)
 * ========================================================================= */

router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-line-signature"];
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  // ตรวจสอบความถูกต้องของ LINE Webhook Signature (เพื่อความปลอดภัย)
  if (channelSecret && req.rawBody) {
    const hash = crypto
      .createHmac("SHA256", channelSecret)
      .update(req.rawBody)
      .digest("base64");

    if (hash !== signature) {
      console.error("❌ Invalid LINE Webhook Signature! Request rejected.");
      return res.status(401).send("Invalid signature");
    }
  }

  // ตอบกลับ Status 200 ทันทีตามมาตรฐานการเชื่อมต่อ LINE เพื่อหลีกเลี่ยงการขึ้น Timeout
  res.sendStatus(200);

  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const baseUrl = `${protocol}://${host}`;

  const events = req.body.events;
  if (!events || events.length === 0) return;

  // ประมวลผลแต่ละ Event ในคิวแบบแยกอิสระ (Prevent Cascade Crashing)
  for (let event of events) {
    try {
      if (event.type === "follow") {
        await handleFollowEvent(event);
      } else if (event.type === "message") {
        const lineUserId = event.source.userId;

        // ตรวจสอบระบบป้องกันการยิงสแปมแชท (Rate Limiting)
        if (event.message.type === "image" || event.message.type === "text") {
          if (rateLimiter.isRateLimited(lineUserId)) {
            await replyToLine(event.replyToken, [
              {
                type: "text",
                text: `น้องบอทตอบไม่ทันแล้วครับ! 🥺 รบกวนส่งข้อความเว้นระยะห่างสักนิดน้า (จำกัดไม่เกิน 6 ข้อความต่อนาทีเพื่อป้องกันระบบขัดข้องครับ) ขอบคุณครับ 🙏`,
              },
            ]);
            continue;
          }
        }

        if (event.message.type === "image") {
          await handleImageEvent(event, { lineUserId: lineUserId }, baseUrl);
        } else if (event.message.type === "text") {
          await handleTextEvent(event, baseUrl);
        } else {
          // การป้องกัน Scenario 2: ผู้ใช้ส่งข้อความประเภทที่ยังไม่รองรับ เช่น สติกเกอร์, พิกัด, วิดีโอ
          const replyToken = event.replyToken;
          await replyToLine(replyToken, [
            {
              type: "text",
              text: `ขออภัยด้วยนะครับ น้องบอทยังไม่รองรับข้อความประเภทนี้ (เช่น สติกเกอร์, วิดีโอ, แฟ้มเอกสาร หรือพิกัดตำแหน่ง) 🥺\n\nรบกวนพิมพ์ระบุของที่หาย หรือถ่ายรูปของที่พบส่งกลับเข้ามาได้เลยครับผม 😊`,
            },
          ]);
        }
      }
    } catch (eventError) {
      console.error(
        "❌ Error processing single LINE Webhook event:",
        eventError,
      );
    }
  }
});

module.exports = router;
