const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const supabase = require('../config/supabase');
const lineBindings = require('../config/lineBindings');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Fallback function to generate content from AI models
async function generateContentWithFallback(aiClient, options) {
  const models = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.5-flash'];
  let lastError;

  for (const model of models) {
    try {
      console.log(`🤖 Matching model check: ${model}`);
      const response = await aiClient.models.generateContent({
        ...options,
        model: model
      });
      return response;
    } catch (err) {
      console.error(`⚠️ Model ${model} failed in matcher:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

// Helper to parse description plain text
function parseDescriptionText(desc) {
  try {
    const parsed = JSON.parse(desc);
    if (parsed && typeof parsed === 'object' && ('textDescription' in parsed)) {
      return parsed.textDescription || 'ไม่มีระบุ';
    }
  } catch (e) {}
  return desc || 'ไม่มีระบุ';
}

// Helper to parse student email from description
function parseDescriptionEmail(desc) {
  try {
    const parsed = JSON.parse(desc);
    if (parsed && typeof parsed === 'object' && parsed.finder_universityEmail) {
      return parsed.finder_universityEmail;
    }
  } catch (e) {}
  return null;
}

// Send LINE Push Notification
async function sendPushToLine(lineUserId, text) {
  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: lineUserId,
        messages: [{ type: 'text', text: text }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    console.log(`✉️ LINE Push Sent to ${lineUserId}`);
  } catch (error) {
    console.error('❌ LINE Push Error:', error.response ? error.response.data : error.message);
  }
}

exports.sendPushToLine = sendPushToLine;

/**
 * Check if a newly registered FoundItem matches any existing LostItem
 * @param {Object} foundItem - The new FoundItem record
 */
exports.checkFoundItemMatch = async (foundItem) => {
  try {
    console.log(`🔍 Checking matches for FoundItem: "${foundItem.item_name}" (ID: ${foundItem.found_item_id})`);

    // Fetch active LostItems in the same category
    const { data: lostItems, error } = await supabase
      .from('LostItem')
      .select('*, User!reporter_id(*)')
      .eq('category_id', foundItem.category_id)
      .eq('status', 'LOST');

    if (error) throw error;
    if (!lostItems || lostItems.length === 0) {
      console.log('ℹ️ No active lost items found in this category.');
      return;
    }

    const candidates = lostItems.map(item => ({
      id: item.lost_item_id,
      name: item.item_name,
      description: item.description || ''
    }));

    const prompt = `คุณคือระบบวิเคราะห์สิ่งของสูญหายอัจฉริยะ (AI Lost & Found Matcher) ของ Unifind
จงเปรียบเทียบสิ่งของที่เพิ่งพบเจอ (Found Item) ด้านล่างนี้ กับรายการของที่ผู้ใช้แจ้งหายไว้ (Lost Items Candidates) ในหมวดหมู่เดียวกัน

ของที่พบล่าสุด (Found Item):
- ชื่อ: "${foundItem.item_name}"
- รายละเอียด: "${foundItem.description || ''}"

รายการของที่ผู้ใช้แจ้งหายไว้ (Lost Items Candidates):
${JSON.stringify(candidates, null, 2)}

หน้าที่ของคุณ:
1. วิเคราะห์ว่าของที่พบใหม่นี้ ตรงหรือมีความคล้ายคลึงจนน่าจะเป็น "ชิ้นเดียวกัน" กับของในรายการใดใน Candidates หรือไม่ (ความมั่นใจระดับ 75% ขึ้นไป)
2. ตอบกลับเป็น JSON ในรูปแบบนี้เท่านั้น:
   {
     "matched": true,
     "matchId": [ใส่ ID ของชิ้นที่ตรงกันจาก Candidates],
     "confidence": [เปอร์เซ็นต์ความมั่นใจ เช่น 85],
     "reason": "อธิบายสั้นๆ เป็นภาษาไทยว่าวิเคราะห์ลักษณะกายภาพ/คำอธิบายแล้วทำไมจึงแมตช์กัน"
   }
3. หากวิเคราะห์แล้วไม่มีของชิ้นใดในคลังข้อมูลที่น่าจะตรงกัน ให้ตอบกลับเป็น JSON รูปแบบนี้:
   {
     "matched": false,
     "matchId": null,
     "confidence": 0,
     "reason": "ไม่มีของที่ตรงกัน"
   }

ห้ามพิมพ์ข้อความเกริ่นนำหรือคำอธิบายใดๆ นอกเหนือจากรูปแบบ JSON ที่กำหนด`;

    const aiResult = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const matchResult = JSON.parse(aiResult.text.trim());
    console.log('🤖 AI Matching Result:', matchResult);

    if (matchResult.matched && matchResult.matchId) {
      const matchedLost = lostItems.find(item => item.lost_item_id === matchResult.matchId);
      if (matchedLost) {
        const ownerEmail = parseDescriptionEmail(matchedLost.description) || (matchedLost.User ? matchedLost.User.email : null);
        if (ownerEmail) {
          const lineUserId = lineBindings.getLineUserId(ownerEmail);
          if (lineUserId) {
            const foundDesc = parseDescriptionText(foundItem.description);
            const notificationMessage = `[แจ้งเตือนด่วนจากระบบ Unifind] 🔍

มีผู้พบสิ่งของต้องสงสัยที่มีลักษณะใกล้เคียงกับของรักที่คุณแจ้งหายไว้!

📌 สิ่งของที่คุณแจ้งหาย: "${matchedLost.item_name}"
📍 สิ่งของที่พบใหม่: "${foundItem.item_name}"
📝 รายละเอียดที่พบ: ${foundDesc}

✨ เหตุผลการจับคู่ของบอท AI: ${matchResult.reason}

👉 แนะนำให้ท่านแสดงตัวต่อเจ้าหน้าที่ ณ ตึกบริการของมหาวิทยาลัยเพื่อยืนยันความเป็นเจ้าของและรับสิ่งของคืนครับ!`;

            await sendPushToLine(lineUserId, notificationMessage);
          } else {
            console.log(`ℹ️ Matched owner email ${ownerEmail} has no bound LINE Account.`);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ checkFoundItemMatch Error:', err);
  }
};

/**
 * Check if a newly registered LostItem matches any existing FoundItem in storage
 * @param {Object} lostItem - The new LostItem record
 */
exports.checkLostItemMatch = async (lostItem) => {
  try {
    console.log(`🔍 Checking matches for LostItem: "${lostItem.item_name}" (ID: ${lostItem.lost_item_id})`);

    // Fetch FoundItems that are currently stored/found
    const { data: foundItems, error } = await supabase
      .from('FoundItem')
      .select('*')
      .eq('category_id', lostItem.category_id)
      .in('status', ['FOUND', 'STORED']);

    if (error) throw error;
    if (!foundItems || foundItems.length === 0) {
      console.log('ℹ️ No matching stored items in database.');
      return;
    }

    const candidates = foundItems.map(item => ({
      id: item.found_item_id,
      name: item.item_name,
      description: item.description || ''
    }));

    const prompt = `คุณคือระบบวิเคราะห์สิ่งของสูญหายอัจฉริยะ (AI Lost & Found Matcher) ของ Unifind
จงเปรียบเทียบสิ่งของที่คุณผู้ใช้แจ้งหายล่าช้า (Lost Item) ด้านล่างนี้ กับรายการของที่เก็บอยู่ในห้องคลัง (Stored Found Items) ในหมวดหมู่เดียวกัน

ของที่แจ้งหายล่าสุด (Lost Item):
- ชื่อ: "${lostItem.item_name}"
- รายละเอียด: "${lostItem.description || ''}"

รายการของที่มีเก็บอยู่ในคลัง (Stored Found Items):
${JSON.stringify(candidates, null, 2)}

หน้าที่ของคุณ:
1. วิเคราะห์ว่าของที่แจ้งหายนี้ ตรงหรือมีความคล้ายคลึงจนน่าจะเป็น "ชิ้นเดียวกัน" กับของที่มีเก็บไว้ในรายการใด หรือไม่ (ความมั่นใจระดับ 75% ขึ้นไป)
2. ตอบกลับเป็น JSON ในรูปแบบนี้เท่านั้น:
   {
     "matched": true,
     "matchId": [ใส่ ID ของชิ้นที่ตรงกันจาก Stored Found Items],
     "confidence": [เปอร์เซ็นต์ความมั่นใจ เช่น 85],
     "reason": "อธิบายสั้นๆ เป็นภาษาไทยว่าวิเคราะห์ลักษณะกายภาพ/คำอธิบายแล้วทำไมจึงแมตช์กัน"
   }
3. หากวิเคราะห์แล้วไม่มีของชิ้นใดในคลังข้อมูลที่น่าจะตรงกัน ให้ตอบกลับเป็น JSON รูปแบบนี้:
   {
     "matched": false,
     "matchId": null,
     "confidence": 0,
     "reason": "ไม่มีของที่ตรงกัน"
   }

ห้ามพิมพ์ข้อความเกริ่นนำหรือคำอธิบายใดๆ นอกเหนือจากรูปแบบ JSON ที่กำหนด`;

    const aiResult = await generateContentWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const matchResult = JSON.parse(aiResult.text.trim());
    console.log('🤖 AI Matching Result for LostItem:', matchResult);

    if (matchResult.matched && matchResult.matchId) {
      let ownerEmail = parseDescriptionEmail(lostItem.description);
      
      if (!ownerEmail) {
        // Find reporter email to notify
        const { data: reporter, error: userError } = await supabase
          .from('User')
          .select('*')
          .eq('user_id', lostItem.reporter_id)
          .single();

        if (reporter) {
          ownerEmail = reporter.email;
        }
      }

      if (ownerEmail) {
        const lineUserId = lineBindings.getLineUserId(ownerEmail);
        if (lineUserId) {
          const matchedFound = foundItems.find(item => item.found_item_id === matchResult.matchId);
          if (matchedFound) {
            const foundDesc = parseDescriptionText(matchedFound.description);
            const notificationMessage = `[แจ้งเตือนด่วนจากระบบ Unifind] 🔍

ระบบตรวจพบลักษณะของหายที่คุณเพิ่งแจ้งเข้าระบบ ตรงกับสิ่งของที่อยู่ในห้องคลังกลางครับ!

📌 ของที่คุณแจ้งหาย: "${lostItem.item_name}"
📍 ของที่มีผู้เก็บได้ในคลัง: "${matchedFound.item_name}"
📝 รายละเอียดที่พบ: ${foundDesc}

✨ เหตุผลการจับคู่ของบอท AI: ${matchResult.reason}

👉 แนะนำให้ท่านติดต่อขอรับของคืน ณ ตึกบริการของมหาวิทยาลัยได้เลยครับ!`;

            await sendPushToLine(lineUserId, notificationMessage);
          }
        } else {
          console.log(`ℹ️ Owner email ${ownerEmail} has no bound LINE Account.`);
        }
      }
    }
  } catch (err) {
    console.error('❌ checkLostItemMatch Error:', err);
  }
};
