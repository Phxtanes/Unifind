/**
 * =========================================================================
 * 📌 Unifind - Matching Service (ระบบจับคู่ของหายและแจ้งเตือนอัจฉริยะ)
 * =========================================================================
 * 🛠️ ลำดับขั้นตอนการทำงานของระบบ Matching
 *
 * 🟢 STEP 1: HELPER & FALLBACK UTILITIES (ฟังก์ชันช่วยเหลือและระบบสำรอง)
 * 🔵 STEP 2: FLEX MESSAGE BUILDER (สร้างการ์ดแจ้งเตือน Flex Message ธีมสีน้ำเงินเข้ม)
 * 🟣 STEP 3: LINE PUSH API SENDER (ยิงข้อความ Push Notification ตรงเข้าแชท LINE OA)
 * 🟡 STEP 4: CHECK FOUND ITEM MATCH ENGINE (ตรวจสอบเมื่อเจ้าหน้าที่กรอกพบของใหม่ ➔ แมตช์หาเจ้าของ)
 * 🔴 STEP 5: CHECK LOST ITEM MATCH ENGINE (ตรวจสอบเมื่อนักศึกษาแจ้งของหายใหม่ ➔ แมตช์หาของในคลัง)
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");
const supabase = require("../config/supabase");
const lineBindings = require("../config/lineBindings");
const fs = require("fs");
const path = require("path");

const localDbPath = path.resolve(__dirname, "../../uploads/local_db.json");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


/* =========================================================================
 * 🟢 STEP 1: HELPER FUNCTIONS & FALLBACK UTILITIES (ตัวช่วยและระบบสำรอง)
 * ========================================================================= */

/**
 * โหลดฐานข้อมูล JSON สำรองภายในเครื่องในกรณีที่การเชื่อมต่อ Supabase ล้มเหลว (Offline Fallback)
 * @returns {object} ข้อมูล Lost Items และ Found Items ที่ดึงมาจากไฟล์ uploads/local_db.json
 */
function loadLocalDb() {
  try {
    if (fs.existsSync(localDbPath)) {
      const data = fs.readFileSync(localDbPath, "utf8");
      return JSON.parse(data || "{}");
    }
  } catch (e) {
    console.error("Error loading local DB in matchingService:", e);
  }
  return { lost_items: [], items: [] };
}

/**
 * เรียกใช้ Gemini API โดยทำการสลับโมเดลอัตโนมัติ (Fallback) หากโมเดลหลักมีปัญหาเรื่องโควต้า (Rate Limit) หรือหมดอายุการใช้งาน
 * @param {GoogleGenAI} aiClient - อินสแตนซ์ของ Google GenAI Client
 * @param {object} options - อ็อพชันสำหรับการประมวลผลโมเดล (เช่น prompt, config)
 * @returns {Promise<object>} ผลลัพธ์การประมวลผลข้อความจากโมเดล AI ที่ทำสำเร็จ
 */
async function generateContentWithFallback(aiClient, options) {
  const models = [
    "gemini-3.1-flash-lite",
    "gemini-1.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
  ];
  let lastError;

  for (const model of models) {
    try {
      console.log(`🤖 Matching model check: ${model}`);
      const response = await aiClient.models.generateContent({
        ...options,
        model: model,
      });
      return response;
    } catch (err) {
      console.error(`⚠️ Model ${model} failed in matcher:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * แกะรายละเอียดของหายจาก JSON String ที่เก็บในฟิลด์ description
 * @param {string} desc - คำอธิบายสิ่งของ (รองรับทั้งข้อความธรรมดา และ JSON string)
 * @returns {string} ข้อความรายละเอียดที่แท้จริง
 */
function parseDescriptionText(desc) {
  try {
    const parsed = JSON.parse(desc);
    if (parsed && typeof parsed === "object" && "textDescription" in parsed) {
      return parsed.textDescription || "ไม่มีระบุ";
    }
  } catch (e) { }
  return desc || "ไม่มีระบุ";
}

/**
 * แกะอีเมลผู้พบของจาก JSON String ที่เก็บในฟิลด์ description
 * @param {string} desc - คำอธิบายสิ่งของที่เก็บในฟิลด์ description
 * @returns {string|null} อีเมลผู้พบของ หรือ null หากไม่พบข้อมูล
 */
function parseDescriptionEmail(desc) {
  try {
    const parsed = JSON.parse(desc);
    if (parsed && typeof parsed === "object" && parsed.finder_universityEmail) {
      return parsed.finder_universityEmail;
    }
  } catch (e) { }
  return null;
}


/* =========================================================================
 * 🔵 STEP 2 & 🟣 STEP 3: FLEX MESSAGE BUILDER & LINE PUSH API SENDER
 * ========================================================================= */

/**
 * สร้าง LINE Flex Message สำหรับแจ้งเตือนการแมตช์ของหาย (STEP 2)
 * @param {string} lostItemName - ชื่อของที่แจ้งหาย
 * @param {string} foundItemName - ชื่อของที่ค้นพบ
 * @param {string} descriptionText - รายละเอียดสิ่งของ
 * @param {string} matchReason - เหตุผลที่สองสิ่งนี้แมตช์กัน
 * @returns {object} โครงสร้าง Flex Message JSON สำหรับ LINE
 */
function buildMatchNotificationFlexMessage(lostItemName, foundItemName, descriptionText, matchReason) {
  return {
    type: "flex",
    altText: `🔍 ตรวจพบของที่ตรงกับที่คุณแจ้งหาย: ${lostItemName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1e3a8a",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "แจ้งเตือนการพบของหาย 🔔",
            weight: "bold",
            color: "#ffffff",
            size: "md",
            align: "center"
          },
          {
            type: "text",
            text: "ระบบตรวจพบคู่แมตช์ในคลังสิ่งของ",
            color: "#bfdbfe",
            size: "xs",
            align: "center",
            margin: "xs"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "ยินดีด้วยครับ! ระบบ Unifind ตรวจพบลักษณะของหายที่คุณแจ้งเข้าระบบ ตรงกับของที่มีคนเก็บมาส่งมอบในคลังกลางครับ 🎉",
            wrap: true,
            color: "#4b5563",
            size: "xs",
            lineSpacing: "4px"
          },
          {
            type: "separator"
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
                    text: "📌 ของที่แจ้งหาย:",
                    color: "#888888",
                    size: "xs",
                    flex: 4
                  },
                  {
                    type: "text",
                    text: lostItemName,
                    color: "#1f2937",
                    weight: "bold",
                    size: "xs",
                    wrap: true,
                    flex: 6
                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📍 ของที่พบคืน:",
                    color: "#888888",
                    size: "xs",
                    flex: 4
                  },
                  {
                    type: "text",
                    text: foundItemName,
                    color: "#1e3a8a",
                    weight: "bold",
                    size: "xs",
                    wrap: true,
                    flex: 6
                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📝 รายละเอียด:",
                    color: "#888888",
                    size: "xs",
                    flex: 4
                  },
                  {
                    type: "text",
                    text: descriptionText || "-",
                    color: "#4b5563",
                    size: "xs",
                    wrap: true,
                    flex: 6
                  }
                ]
              }
            ]
          },
          {
            type: "separator"
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#eff6ff",
            paddingAll: "10px",
            cornerRadius: "md",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "✨ จุดที่แมตช์สอดคล้องกัน (AI วิเคราะห์):",
                color: "#1e3a8a",
                weight: "bold",
                size: "xs"
              },
              {
                type: "text",
                text: matchReason,
                color: "#1e40af",
                size: "xs",
                wrap: true,
                lineSpacing: "4px"
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#f9fafb",
            paddingAll: "10px",
            cornerRadius: "sm",
            contents: [
              {
                type: "text",
                text: "👉 แนะนำให้ท่านเตรียมหลักฐานยืนยันความเป็นเจ้าของ และติดต่อขอรับของคืน ณ ตึกบริการของมหาวิทยาลัยได้เลยครับ!",
                size: "xs",
                color: "#6b7280",
                wrap: true,
                lineSpacing: "4px"
              }
            ]
          }
        ]
      }
    }
  };
}

/**
 * ส่งข้อความแจ้งเตือนผลลัพธ์การแมตช์ของหายผ่าน LINE Push Message API (STEP 3)
 * @param {string} lineUserId - ไอดีผู้รับในระบบ LINE
 * @param {string|object|Array} messagePayload - ข้อความแจ้งเตือนด่วน หรือ Flex Message หรืออาร์เรย์ข้อความ
 * @returns {Promise<void>}
 */
async function sendPushToLine(lineUserId, messagePayload) {
  try {
    const messages = Array.isArray(messagePayload)
      ? messagePayload
      : typeof messagePayload === "object"
        ? [messagePayload]
        : [{ type: "text", text: messagePayload }];

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
    console.log(`✉️ LINE Push Sent to ${lineUserId}`);
  } catch (error) {
    console.error(
      "❌ LINE Push Error:",
      error.response ? error.response.data : error.message,
    );
  }
}


/* =========================================================================
 * 🟡 STEP 4: CHECK FOUND ITEM MATCH ENGINE (เจ้าหน้าที่พบของใหม่ ➔ แมตช์หาเจ้าของ)
 * ========================================================================= */

/**
 * [ตรวจสอบของหายอัตโนมัติ] เมื่อเจ้าหน้าที่พบของใหม่ในคลังระบบ
 * จะทำการเปรียบเทียบกับรายการสิ่งของที่ผู้ใช้แจ้งหายไว้ในประเภทเดียวกันผ่าน Gemini AI
 * และส่ง LINE Push Message แจ้งเตือนไปยังนักศึกษาเจ้าของสิ่งของทันทีหากตรงกัน
 * @param {object} foundItem - ข้อมูลสิ่งของที่พบเจอชิ้นใหม่
 * @returns {Promise<object>} ผลลัพธ์การเปรียบเทียบ { matched, confidence, reason, matchedItem }
 */
async function checkFoundItemMatch(foundItem) {
  try {
    console.log(
      `🔍 Checking matches for Found Item: "${foundItem.item_name}" (ID: ${foundItem.item_id})`,
    );

    let lostItems = [];
    try {
      const { data: statusData } = await supabase
        .from("lost_item_statuses")
        .select("status_id")
        .eq("status_code", "LOST")
        .maybeSingle();
      const lostStatusId = statusData?.status_id;

      const query = supabase
        .from("lost_items")
        .select(
          "*, locations(location_name, floor), reporter:persons!lost_items_reporter_id_fkey(full_name, email, phone)",
        )
        .eq("category_id", foundItem.category_id);
      if (lostStatusId) query.eq("status_id", lostStatusId);

      const { data, error } = await query;
      if (error) throw error;
      lostItems = data || [];
    } catch (err) {
      console.warn(
        "Supabase offline in checkFoundItemMatch, using local JSON database fallback",
      );
      const db = loadLocalDb();
      lostItems = (db.lost_items || []).filter(
        (item) => Number(item.category_id) === Number(foundItem.category_id),
      );
    }

    if (!lostItems || lostItems.length === 0) {
      console.log("ℹ️ No active lost items found in this category.");
      return;
    }

    let foundLocation = "ไม่ระบุ";
    if (foundItem.locations) {
      foundLocation = foundItem.locations.location_name + (foundItem.locations.floor ? ` ชั้น ${foundItem.locations.floor}` : "");
    } else if (foundItem.location_id) {
      try {
        const { data: locData } = await supabase
          .from("locations")
          .select("location_name, floor")
          .eq("location_id", foundItem.location_id)
          .maybeSingle();
        if (locData) {
          foundLocation = locData.location_name + (locData.floor ? ` ชั้น ${locData.floor}` : "");
        }
      } catch (e) {
        console.warn("Failed to fetch location name for foundItem in checkFoundItemMatch:", e.message);
      }
    }

    const candidates = lostItems.map((item) => ({
      id: item.lost_item_id,
      name: item.item_name,
      description: item.description || "",
      lost_datetime: item.lost_datetime || item.created_at,
      location: item.locations
        ? item.locations.location_name + (item.locations.floor ? ` ชั้น ${item.locations.floor}` : "")
        : "ไม่ระบุ",
    }));

    const prompt = `คุณคือระบบวิเคราะห์สิ่งของสูญหายอัจฉริยะ (AI Lost & Found Matcher) ของ Unifind ประจำมหาวิทยาลัยหอการค้าไทย (UTCC)
หน้าที่ของคุณ: เปรียบเทียบของที่เพิ่งเก็บได้ (Found Item) กับรายการสิ่งของที่ผู้ใช้แจ้งหายไว้ (Lost Items Candidates) เพื่อวิเคราะห์ว่ามีชิ้นใดเป็นของชิ้นเดียวกันที่มีความเป็นไปได้สูงที่สุด

ข้อมูลของที่พบล่าสุด (Found Item):
- ชื่อ: "${foundItem.item_name}"
- รายละเอียด: "${foundItem.description || ""}"
- วันที่พบ: "${foundItem.found_date || foundItem.created_at}"
- สถานที่พบ: "${foundLocation}"

รายการสิ่งของที่ผู้ใช้แจ้งหายไว้ (Lost Items Candidates):
${JSON.stringify(candidates, null, 2)}

เกณฑ์ในการประเมินและเปรียบเทียบเชิงลึก:
1. **ความเข้ากันได้ของประเภทสิ่งของ**: สิ่งของต้องเป็นชนิดเดียวกันหรือใกล้เคียงกันมาก (เช่น แก้วน้ำ/กระบอกน้ำ, ไอแพด/iPad, หูฟัง/AirPods) หากชนิดของสิ่งของขัดแย้งกันอย่างสิ้นเชิง (เช่น ร่ม กับ โทรศัพท์) ให้ปัดตกทันที (confidence = 0)
2. **ลักษณะทางกายภาพ สี และยี่ห้อ**: ตรวจสอบสีและแบรนด์ (เช่น สีแดง/สีชมพูเข้ม, สีดำ/สีกรมท่า, ยี่ห้อ Apple/Samsung) จุดสังเกตเฉพาะตัว เช่น ลวดลาย พวงกุญแจที่ห้อย สติกเกอร์ เคสโทรศัพท์ หรือร่องรอยพิเศษ
3. **การประเมินด้านเวลา**: วันที่ที่พบ (Found Item Date) ต้องเกิดขึ้นหลังจากหรืออยู่ในเวลาใกล้เคียงกันกับวันที่สิ่งของชิ้นนั้นหาย (Lost Item Date) การพบก่อนวันที่แจ้งหายเป็นเวลานานมากมีความเป็นไปได้ต่ำ
4. **ความเข้ากันได้ของสถานที่**: สถานที่พบและสถานที่หายควรเป็นสถานที่เดียวกัน ตึกเดียวกัน หรือพื้นที่รอบข้างที่สอดคล้องกันเชิงเส้นทางเดิน

กรุณาตอบกลับเป็น JSON รูปแบบด้านล่างนี้เท่านั้น โดยไม่มีข้อความเกริ่นนำ ข้อความสรุป หรือเครื่องหมาย markdown อื่นๆ นอกเหนือโครงสร้าง JSON นี้เด็ดขาด:
{
  "matched": true/false,
  "matchId": [ใส่ ID จาก Candidates ชิ้นที่คิดว่าตรงกันที่สุด หรือใส่ null หากไม่เข้าเกณฑ์หรือมั่นใจต่ำกว่า 75%],
  "confidence": [คะแนนความมั่นใจระหว่าง 0 ถึง 100],
  "reason": "สรุปกระชับเป็นภาษาไทยอธิบายจุดที่พิจารณาเปรียบเทียบทั้งสี ลักษณะเด่น สถานที่ และเวลาเพื่ออธิบายเหตุผลในการจับคู่หรือปฏิเสธ"
}`;

    const aiResult = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const matchResult = JSON.parse(aiResult.text.trim());
    console.log("🤖 AI Matching Result for FoundItem:", matchResult);

    if (matchResult.matched && matchResult.matchId) {
      let targetMatchId = matchResult.matchId;
      if (Array.isArray(targetMatchId)) {
        targetMatchId = targetMatchId[0];
      }
      const parsedMatchId = Number(targetMatchId);

      const matchedLost = lostItems.find(
        (item) => Number(item.lost_item_id) === parsedMatchId,
      );
      if (matchedLost) {
        const ownerEmail = matchedLost.reporter
          ? matchedLost.reporter.email
          : null;
        if (ownerEmail) {
          const lineUserId = lineBindings.getLineUserId(ownerEmail);
          if (lineUserId) {
            const foundDesc = parseDescriptionText(foundItem.description);
            const flexMsg = buildMatchNotificationFlexMessage(
              matchedLost.item_name,
              foundItem.item_name,
              foundDesc,
              matchResult.reason
            );

            await sendPushToLine(lineUserId, flexMsg);
          } else {
            console.log(
              `ℹ️ Matched owner email ${ownerEmail} has no bound LINE Account.`,
            );
          }
        }
      }
      return {
        matched: true,
        confidence: matchResult.confidence || 0,
        reason: matchResult.reason || "",
        matchedItem: matchedLost
          ? {
            id: matchedLost.lost_item_id,
            name: matchedLost.item_name,
            description: matchedLost.description || "",
            date: matchedLost.lost_datetime,
            reporter: matchedLost.reporter
              ? matchedLost.reporter.full_name
              : "ไม่ได้ระบุ",
          }
          : null,
      };
    }
    return {
      matched: false,
      confidence: 0,
      reason: "ไม่มีของที่ตรงกัน",
      matchedItem: null,
    };
  } catch (err) {
    console.error("❌ checkFoundItemMatch Error:", err);
    return {
      matched: false,
      confidence: 0,
      reason: "เกิดข้อผิดพลาดในการตรวจสอบความคล้ายคลึง",
      error: err.message,
    };
  }
}

/* =========================================================================
 * 🔴 STEP 5: CHECK LOST ITEM MATCH ENGINE (นักศึกษาแจ้งของหายใหม่ ➔ แมตช์หาของในคลัง)
 * ========================================================================= */

/**
 * [ตรวจสอบสิ่งของค้างคลัง] เมื่อนักศึกษาเพิ่งทำรายการแจ้งของหายในระบบบอท
 * ระบบจะดึงข้อมูลสิ่งของที่พบเจอที่อยู่ในคลังของ Unifind ทั้งหมดในหมวดหมู่เดียวกันมาเปรียบเทียบผ่าน Gemini AI
 * และส่ง LINE Push Message แจ้งเตือนไปยังนักศึกษาทันทีหากตรวจพบความสอดคล้อง
 * @param {object} lostItem - ข้อมูลสิ่งของที่ผู้ใช้เพิ่งทำการแจ้งหาย
 * @returns {Promise<object>} ผลลัพธ์การเปรียบเทียบ { matched, confidence, reason, matchedItem }
 */
async function checkLostItemMatch(lostItem) {
  try {
    console.log(
      `🔍 Checking matches for LostItem: "${lostItem.item_name}" (ID: ${lostItem.lost_item_id})`,
    );

    let foundItems = [];
    try {
      const { data: statusData } = await supabase
        .from("found_item_statuses")
        .select("status_id")
        .in("status_code", ["FOUND", "STORED"]);
      const storedStatusIds = (statusData || []).map((s) => s.status_id);

      let query = supabase
        .from("items")
        .select(
          "*, locations(location_name, floor), finder:persons!items_finder_id_fkey(full_name, email, phone)",
        )
        .eq("category_id", lostItem.category_id);
      if (storedStatusIds.length > 0)
        query = query.in("status_id", storedStatusIds);

      const { data, error } = await query;
      if (error) throw error;
      foundItems = data || [];
    } catch (err) {
      console.warn(
        "Supabase offline in checkLostItemMatch, using local JSON database fallback",
      );
      const db = loadLocalDb();
      foundItems = (db.items || []).filter(
        (item) => Number(item.category_id) === Number(lostItem.category_id),
      );
    }

    if (!foundItems || foundItems.length === 0) {
      console.log("ℹ️ No matching stored items in database.");
      return;
    }

    let lostLocation = "ไม่ระบุ";
    if (lostItem.locations) {
      lostLocation = lostItem.locations.location_name + (lostItem.locations.floor ? ` ชั้น ${lostItem.locations.floor}` : "");
    } else if (lostItem.location_id) {
      try {
        const { data: locData } = await supabase
          .from("locations")
          .select("location_name, floor")
          .eq("location_id", lostItem.location_id)
          .maybeSingle();
        if (locData) {
          lostLocation = locData.location_name + (locData.floor ? ` ชั้น ${locData.floor}` : "");
        }
      } catch (e) {
        console.warn("Failed to fetch location name for lostItem in checkLostItemMatch:", e.message);
      }
    }

    const candidates = foundItems.map((item) => ({
      id: item.item_id,
      name: item.item_name,
      description: item.description || "",
      found_date: item.found_date || item.created_at,
      location: item.locations
        ? item.locations.location_name + (item.locations.floor ? ` ชั้น ${item.locations.floor}` : "")
        : "ไม่ระบุ",
    }));

    const prompt = `คุณคือระบบวิเคราะห์สิ่งของสูญหายอัจฉริยะ (AI Lost & Found Matcher) ของ Unifind ประจำมหาวิทยาลัยหอการค้าไทย (UTCC)
หน้าที่ของคุณ: เปรียบเทียบของที่ผู้ใช้เพิ่งแจ้งหาย (Lost Item) กับรายการของที่เก็บอยู่ในคลังสิ่งของพบเจอ (Stored Found Items Candidates) เพื่อวิเคราะห์ว่ามีชิ้นใดเป็นของชิ้นเดียวกันที่มีความเป็นไปได้สูงที่สุด

ข้อมูลของที่แจ้งหายล่าสุด (Lost Item):
- ชื่อ: "${lostItem.item_name}"
- รายละเอียด: "${lostItem.description || ""}"
- วันที่หาย: "${lostItem.lost_datetime || lostItem.created_at}"
- สถานที่หาย: "${lostLocation}"

รายการของที่มีเก็บอยู่ในคลัง (Stored Found Items Candidates):
${JSON.stringify(candidates, null, 2)}

เกณฑ์ในการประเมินและเปรียบเทียบเชิงลึก:
1. **ความเข้ากันได้ของประเภทสิ่งของ**: สิ่งของต้องเป็นชนิดเดียวกันหรือใกล้เคียงกันมาก (เช่น แก้วน้ำ/กระบอกน้ำ, ไอแพด/iPad, หูฟัง/AirPods) หากชนิดของสิ่งของขัดแย้งกันอย่างสิ้นเชิง (เช่น ร่ม กับ โทรศัพท์) ให้ปัดตกทันที (confidence = 0)
2. **ลักษณะทางกายภาพ สี และยี่ห้อ**: ตรวจสอบสีและแบรนด์ (เช่น สีแดง/สีชมพูเข้ม, สีดำ/สีกรมท่า, ยี่ห้อ Apple/Samsung) จุดสังเกตเฉพาะตัว เช่น ลวดลาย พวงกุญแจที่ห้อย สติกเกอร์ เคสโทรศัพท์ หรือร่องรอยพิเศษ
3. **การประเมินด้านเวลา**: วันที่พบสิ่งของ (Found Item Date) ต้องเกิดขึ้นหลังจากหรืออยู่ในช่วงเวลาที่ใกล้เคียงกันกับวันที่สิ่งของชิ้นนั้นสูญหาย (Lost Item Date)
4. **ความเข้ากันได้ของสถานที่**: สถานที่พบและสถานที่หายควรเป็นสถานที่เดียวกัน ตึกเดียวกัน หรือพื้นที่รอบข้างที่สอดคล้องกันเชิงเส้นทางเดิน

กรุณาตอบกลับเป็น JSON รูปแบบด้านล่างนี้เท่านั้น โดยไม่มีข้อความเกริ่นนำ ข้อความสรุป หรือเครื่องหมาย markdown อื่นๆ นอกเหนือโครงสร้าง JSON นี้เด็ดขาด:
{
  "matched": true/false,
  "matchId": [ใส่ ID จาก Candidates ชิ้นที่คิดว่าตรงกันที่สุด หรือใส่ null หากไม่เข้าเกณฑ์หรือมั่นใจต่ำกว่า 75%],
  "confidence": [คะแนนความมั่นใจระหว่าง 0 ถึง 100],
  "reason": "สรุปกระชับเป็นภาษาไทยอธิบายจุดที่พิจารณาเปรียบเทียบทั้งสี ลักษณะเด่น สถานที่ และเวลาเพื่ออธิบายเหตุผลในการจับคู่หรือปฏิเสธ"
}`;

    const aiResult = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const matchResult = JSON.parse(aiResult.text.trim());
    console.log("🤖 AI Matching Result for LostItem:", matchResult);

    if (matchResult.matched && matchResult.matchId) {
      let targetMatchId = matchResult.matchId;
      if (Array.isArray(targetMatchId)) {
        targetMatchId = targetMatchId[0];
      }
      const parsedMatchId = Number(targetMatchId);

      const matchedFound = foundItems.find(
        (item) => Number(item.item_id) === parsedMatchId,
      );

      let ownerEmail = parseDescriptionEmail(lostItem.description);

      if (!ownerEmail) {
        try {
          const { data: reporter, error: userError } = await supabase
            .from("persons")
            .select("*")
            .eq("person_id", lostItem.reporter_id)
            .single();

          if (userError) throw userError;
          if (reporter) {
            ownerEmail = reporter.email;
          }
        } catch (err) {
          console.warn(
            "Supabase offline or error fetching Person in checkLostItemMatch, using local DB fallback",
          );
          const db = loadLocalDb();
          const localPerson = (db.persons || []).find(
            (p) => p.person_id === lostItem.reporter_id,
          );
          if (localPerson) {
            ownerEmail = localPerson.email;
          }
        }
      }

      if (ownerEmail) {
        const lineUserId = lineBindings.getLineUserId(ownerEmail);
        if (lineUserId) {
          if (matchedFound) {
            const flexMsg = buildMatchNotificationFlexMessage(
              lostItem.item_name,
              matchedFound.item_name,
              matchedFound.description || "",
              matchResult.reason
            );

            await sendPushToLine(lineUserId, flexMsg);
          }
        } else {
          console.log(
            `ℹ️ Owner email ${ownerEmail} has no bound LINE Account.`,
          );
        }
      }
      return {
        matched: true,
        confidence: matchResult.confidence || 0,
        reason: matchResult.reason || "",
        matchedItem: matchedFound
          ? {
            id: matchedFound.item_id,
            name: matchedFound.item_name,
            description: matchedFound.description || "",
            date: matchedFound.found_date,
            founder: matchedFound.finder
              ? matchedFound.finder.full_name
              : "ไม่ได้ระบุ",
          }
          : null,
      };
    }
    return {
      matched: false,
      confidence: 0,
      reason: "ไม่มีของที่ตรงกัน",
      matchedItem: null,
    };
  } catch (err) {
    console.error("❌ checkLostItemMatch Error:", err);
    return {
      matched: false,
      confidence: 0,
      reason: "เกิดข้อผิดพลาดในการตรวจสอบความคล้ายคลึง",
      error: err.message,
    };
  }
}

/**
 * [เปรียบเทียบคู่แบบเจาะจง] วิเคราะห์ความสอดคล้องและความเหมือนกันระหว่างสองสิ่งของ (หนึ่งชิ้นหาย และหนึ่งชิ้นพบ)
 * ฟังก์ชันนี้รองรับการคลิกวิเคราะห์จากหน้าจอพนักงานเพื่อเปรียบเทียบแบบรายกรณีผ่าน Gemini AI
 * @param {object} lostItem - ข้อมูลของที่แจ้งหาย
 * @param {object} foundItem - ข้อมูลของที่พบเจอในคลัง
 * @returns {Promise<object>} ผลการแมตช์ { matched, confidence, reason }
 */
async function analyzeMatchBetweenItems(lostItem, foundItem) {
  try {
    const lostDesc = parseDescriptionText(lostItem.description);
    const foundDesc = parseDescriptionText(foundItem.description);

    let lostLocation = "ไม่ระบุ";
    if (lostItem.locations) {
      lostLocation = lostItem.locations.location_name + (lostItem.locations.floor ? ` ชั้น ${lostItem.locations.floor}` : "");
    } else if (lostItem.location_id) {
      try {
        const { data: locData } = await supabase
          .from("locations")
          .select("location_name, floor")
          .eq("location_id", lostItem.location_id)
          .maybeSingle();
        if (locData) {
          lostLocation = locData.location_name + (locData.floor ? ` ชั้น ${locData.floor}` : "");
        }
      } catch (e) { }
    }

    let foundLocation = "ไม่ระบุ";
    if (foundItem.locations) {
      foundLocation = foundItem.locations.location_name + (foundItem.locations.floor ? ` ชั้น ${foundItem.locations.floor}` : "");
    } else if (foundItem.location_id) {
      try {
        const { data: locData } = await supabase
          .from("locations")
          .select("location_name, floor")
          .eq("location_id", foundItem.location_id)
          .maybeSingle();
        if (locData) {
          foundLocation = locData.location_name + (locData.floor ? ` ชั้น ${locData.floor}` : "");
        }
      } catch (e) { }
    }

    const prompt = `คุณคือระบบวิเคราะห์สิ่งของสูญหายอัจฉริยะ (AI Lost & Found Matcher) ของ Unifind ประจำมหาวิทยาลัยหอการค้าไทย (UTCC)
จงเปรียบเทียบสิ่งของที่ผู้ใช้แจ้งหาย (Lost Item) กับของที่มีผู้พบเจอ (Found Item) ว่ามีโอกาสที่จะเป็นของชิ้นเดียวกันมากน้อยเพียงใด

สิ่งของที่แจ้งหาย (Lost Item):
- ชื่อ: "${lostItem.item_name}"
- รายละเอียด: "${lostDesc}"
- วันที่หาย: "${lostItem.lost_datetime || lostItem.created_at}"
- สถานที่หาย: "${lostLocation}"

สิ่งของที่มีผู้พบเจอ (Found Item):
- ชื่อ: "${foundItem.item_name}"
- รายละเอียด: "${foundDesc}"
- วันที่พบ: "${foundItem.found_date || foundItem.created_at}"
- สถานที่พบ: "${foundLocation}"

หน้าที่ของคุณ:
1. วิเคราะห์เปรียบเทียบความคล้ายคลึงทางกายภาพ สี ยี่ห้อ จุดสังเกต ยืนยันเรื่องวันที่ (วันที่พบควรเป็นวันเดียวหรือหลังจากวันที่แจ้งหาย) และสถานที่ (อาคารหรือทิศทางเดียวกัน)
2. ตอบกลับเป็น JSON ในรูปแบบนี้เท่านั้น:
   {
     "matched": true,
     "confidence": 85,
     "reason": "อธิบายสั้นๆ เป็นภาษาไทยวิเคราะห์ลักษณะกายภาพ สถานที่ และเวลาเพื่ออธิบายว่าทำไมถึงแมตช์กัน"
   }
3. หากไม่แมตช์หรือคะแนนความมั่นใจน้อยกว่า 75% ให้ตอบ:
   {
     "matched": false,
     "confidence": 30,
     "reason": "ระบุเหตุผลที่ไม่ตรงกันหรือเงื่อนไขด้านสี/ประเภท/เวลา/สถานที่ขัดแย้งกัน"
   }
   
ห้ามพิมพ์ข้อความเกริ่นนำหรือคำอธิบายใดๆ นอกเหนือจากรูปแบบ JSON ที่กำหนด`;

    const aiResult = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const matchResult = JSON.parse(aiResult.text.trim());
    console.log("🤖 AI Manual Pair Matching Result:", matchResult);
    return matchResult;
  } catch (err) {
    console.error("❌ analyzeMatchBetweenItems Error:", err);
    return {
      matched: false,
      confidence: 0,
      reason: "เกิดข้อผิดพลาดในการวิเคราะห์ด้วย AI: " + err.message,
    };
  }
}


/* =========================================================================
 * 📤 4. MODULE EXPORTS (ส่งออกฟังก์ชันสำหรับเรียกใช้งาน)
 * ========================================================================= */

module.exports = {
  sendPushToLine,
  checkFoundItemMatch,
  checkLostItemMatch,
  analyzeMatchBetweenItems,
};
