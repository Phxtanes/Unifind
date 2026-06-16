const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenAI, Type } = require('@google/genai');
const supabase = require('../config/supabase');
const lineBindings = require('../config/lineBindings');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// =========================================================================
// 1. CONFIGURATION & HELPERS (การตั้งค่าและฟังก์ชันช่วยเหลือ)
// =========================================================================

const getCategoryName = (categoryId) => {
  const mapping = {
    1: 'เอกสาร',
    2: 'กระเป๋า',
    3: 'โทรศัพท์',
    4: 'กุญแจ',
    5: 'เครื่องประดับ'
  };
  return mapping[categoryId] || 'อื่นๆ';
};

/**
 * สุ่มเลือกคำตอบจากรายการประโยคที่กำหนด
 * @param {Array} array - รายการข้อความที่ต้องการสุ่ม
 * @returns {string} ข้อความที่ถูกสุ่มเลือก
 */
const getRandomResponse = (array) => array[Math.floor(Math.random() * array.length)];

// คู่มือการใช้งานระบบหลักของ Unifind สำหรับส่งให้ผู้ใช้
const welcomeAndGuideMessage = `[คู่มือการใช้งานระบบ Unifind LINE Bot]

ท่านสามารถใช้บริการตรวจสอบและค้นหาสิ่งของสูญหายได้ผ่านช่องทางดังต่อไปนี้:

1. การค้นหาสิ่งของแบบระบุรายละเอียด
ท่านสามารถพิมพ์ข้อความอธิบายลักษณะ หรือ "ส่งรูปภาพสิ่งของ" เข้ามาในแชทเพื่อสืบค้นได้ทันที
ตัวอย่าง: "ตามหาโทรศัพท์ ทำตกไว้บริเวณโรงอาหาร"

2. การตรวจสอบภาพรวมสิ่งของสูญหาย
พิมพ์คำสำคัญ เช่น "สรุปรายการของหาย" หรือ "ตรวจสอบหมวดหมู่"

3. การผูกบัญชีเพื่อรับการแจ้งเตือน
พิมพ์ฟอร์แมต -> ผูกบัญชี: [อีเมลมหาวิทยาลัยของท่าน]`;

/**
 * ส่งข้อความตอบกลับไปยัง LINE OA API
 * @param {string} replyToken - Token สำหรับใช้ตอบกลับข้อความ
 * @param {Array} messages - โครงสร้างข้อความ LINE ที่ต้องการส่ง
 */
async function replyToLine(replyToken, messages) {
    try {
        await axios.post(
            'https://api.line.me/v2/bot/message/reply',
            {
                replyToken: replyToken,
                messages: messages
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
    } catch (error) {
        console.error('LINE Reply Error:', error.response ? error.response.data : error.message);
    }
}

/**
 * ดาวน์โหลดรูปภาพจากเซิร์ฟเวอร์ LINE และแปลงเป็นรูปภาพรูปแบบ Base64 สำหรับส่งไปที่ Gemini
 * @param {string} messageId - ID ของข้อความรูปภาพจาก LINE
 * @returns {Promise<Object>} ข้อมูล Inline Data สำหรับเรียกใช้ Gemini API
 */
async function getLineImageBuffer(messageId) {
    const response = await axios({
        method: 'get',
        url: `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        headers: {
            'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        },
        responseType: 'arraybuffer'
    });
    return {
        inlineData: {
            data: Buffer.from(response.data).toString("base64"),
            mimeType: "image/jpeg"
        }
    };
}

/**
 * ฟังก์ชันเรียกใช้ Gemini พร้อมระบบสำรองโมเดลล่มอัตโนมัติ (Fallback)
 * @param {GoogleGenAI} aiClient - อินสแตนซ์ของ GoogleGenAI
 * @param {Object} options - ออปชันที่ใช้เรียก generateContent
 * @returns {Promise<Object>} ผลลัพธ์จากการประมวลผลของโมเดล AI
 */
async function generateContentWithFallback(aiClient, options) {
    const models = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.5-flash'];
    let lastError;

    for (const model of models) {
        try {
            console.log(`🤖 กำลังส่งงานไปให้โมเดล: ${model}`);
            const response = await aiClient.models.generateContent({
                ...options,
                model: model
            });
            return response;
        } catch (err) {
            const errMsg = err.message || (err.response && err.response.data) || String(err);
            console.error(`⚠️ โมเดล ${model} ล้มเหลว:`, errMsg);
            lastError = err;
        }
    }
    throw lastError;
}

// =========================================================================
// 2. LINE WEBHOOK EVENT HANDLERS (ส่วนจัดการเหตุการณ์จาก Webhook)
// =========================================================================

/**
 * จัดการเมื่อผู้ใช้กดเพิ่มเพื่อนหรือเปิดแชทกับ LINE OA (Follow Event)
 * @param {Object} event - ข้อมูลของเหตุการณ์ Follow
 */
async function handleFollowEvent(event) {
    const replyToken = event.replyToken;
    const welcomePatterns = [
        `สวัสดีครับ ยินดีต้อนรับสู่บริการส่งคืนสิ่งของสูญหาย Unifind ประจำมหาวิทยาลัย ระบบนี้ควบคุมและประสานงานโดยระบบปัญญาประดิษฐ์ (AI) ร่วมกับฐานข้อมูลส่วนกลางเพื่อช่วยเหลือนักศึกษาและบุคลากรทุกท่านครับ`,
        `ยินดีต้อนรับเข้าสู่ระบบส่วนกลาง Unifind ครับ ช่องทางนี้เป็นบอท AI อัจฉริยะที่เชื่อมต่อกับฐานข้อมูลสิ่งของสูญหายภายในรั้วมหาวิทยาลัย พร้อมให้บริการตรวจสอบข้อมูลแก่ทุกท่านตลอด 24 ชั่วโมงครับ`
    ];
    await replyToLine(replyToken, [
        { type: 'text', text: getRandomResponse(welcomePatterns) },
        { type: 'text', text: welcomeAndGuideMessage }
    ]);
}

/**
 * จัดการเมื่อผู้ใช้ส่งรูปภาพสิ่งของเข้ามาทางแชท (Image Message Event)
 * @param {Object} event - ข้อมูลของเหตุการณ์ส่งรูปภาพ
 */
async function handleImageEvent(event) {
    const replyToken = event.replyToken;
    const messageId = event.message.id;

    console.log(`ระบบได้รับข้อความรูปภาพ ID: ${messageId}`);

    try {
        // ดึงข้อมูลรายการของหายคงค้างในห้องคลังระบบ (FoundItem)
        const { data: allItems, error: itemsError } = await supabase
            .from('FoundItem')
            .select('found_item_id, item_name, category_id, location_id, floor, description, status')
            .in('status', ['FOUND', 'STORED']);

        if (itemsError) throw itemsError;

        const imagePart = await getLineImageBuffer(messageId);

        if (!allItems || allItems.length === 0) {
            await replyToLine(replyToken, [
                {
                    type: 'text',
                    text: `[ระบบรับรูปภาพเรียบร้อย]\n\nจากการตรวจสอบฐานข้อมูลคลังของหายส่วนกลาง ปัจจุบันยังไม่มีรายการของคงค้างในระบบที่สอดคล้องกันครับ ทางระบบแนะนำให้ท่านล็อกอินเพื่อโพสต์แจ้งหายขึ้นสู่เว็บไซต์หลักก่อนครับ`
                }
            ]);
            return;
        }

        const candidates = allItems.map(item => ({
            id: item.found_item_id,
            name: item.item_name,
            category: getCategoryName(item.category_id),
            description: item.description || ''
        }));

        const imageAnalysisPrompt = `คุณคือ AI ตรวจสอบภาพของหายในระบบ Unifind
จงดูรูปภาพสิ่งของที่ผู้ใช้ส่งมานี้อย่างละเอียด วิเคราะห์ว่ามันคืออะไร สีอะไร ลักษณะอย่างไร จากนั้นเปรียบเทียบกับรายการสิ่งของในคลังเก็บของหายด้านล่างนี้:

รายการข้อมูลในคลังเก็บของหาย:
${JSON.stringify(candidates, null, 2)}

หน้าที่ของคุณ:
1. ตรวจสอบว่าในภาพ มีสิ่งของชิ้นใดที่ "ตรงกัน หรือใกล้เคียงมากที่สุด" กับสิ่งของในคลังเก็บของหายหรือไม่
2. หากพบข้อมูลที่สอดคล้องกัน (เช่น ในรูปเป็นกระเป๋าตังค์สีน้ำตาล และใน DB มีกระเป๋าตังค์สีน้ำตาลระบุไว้) ให้ตอบกลับเป็น JSON ในรูปแบบนี้เท่านั้น:
   { "match": true, "itemId": [ใส่ ID ของชิ้นที่เจอในคลัง], "reason": "อธิบายเหตุผลเป็นภาษาไทยว่าทำไมถึงแมตช์กันอย่างสุภาพและเป็นทางการ" }
3. หากตรวจสอบแล้วไม่พบสิ่งของใดในคลังที่ตรงกับรูปภาพนี้เลย ให้ตอบกลับเป็น JSON รูปแบบนี้:
   { "match": false, "itemId": null, "reason": "อธิบายสั้นๆ ว่าวิเคราะห์แล้วภาพนี้คือประเภทอะไร แต่ไม่พบของลักษณะนี้ในระบบคลัง" }

ตอบกลับเป็น JSON รูปแบบที่กำหนดเท่านั้น ห้ามพิมพ์ข้อความอื่นนอกเหนือจาก JSON`;

        const aiImageResult = await generateContentWithFallback(ai, {
            contents: [imagePart, imageAnalysisPrompt],
            config: { responseMimeType: 'application/json' }
        });

        const resultData = JSON.parse(aiImageResult.text.trim());
        console.log('ผลวิเคราะห์รูปภาพจาก AI:', resultData);

        if (resultData.match && resultData.itemId) {
            const matchedItem = allItems.find(i => i.found_item_id === resultData.itemId);
            const nameText = matchedItem ? `"${matchedItem.item_name}"` : 'สิ่งของ';
            await replyToLine(replyToken, [
                {
                    type: 'text',
                    text: `[ระบบ Unifind ตรวจพบข้อมูลที่ใกล้เคียง]\n\nพบบันทึกสิ่งของหาย ${nameText} ในระบบส่วนกลางที่มีความคล้ายคลึงกับรูปภาพของคุณครับ\n\nเหตุผลการวิเคราะห์: ${resultData.reason}\n\nขั้นตอนถัดไป:\nแนะนำให้เข้าสู่ระบบเพื่อยื่นหลักฐานออนไลน์บนหน้าเว็บไซต์ หรือติดต่อจุดบริการรับของหายของมหาวิทยาลัยเพื่อยืนยันความเป็นเจ้าของและรับคืนครับ`
                }
            ]);
        } else {
            await replyToLine(replyToken, [
                {
                    type: 'text',
                    text: `[ผลการวิเคราะห์รูปภาพเสร็จสิ้น]\n\nทางระบบวิเคราะห์รูปภาพของท่านแล้วพบว่าคือประเภท "${resultData.reason}" อย่างไรก็ตาม ปัจจุบัน "ยังไม่พบ" รายการสิ่งของในห้องคลังที่มีลักษณะ สี หรือประเภทที่สอดคล้องกับภาพนี้ครับ\n\nคำแนะนำเพิ่มเติม:\nท่านสามารถพิมพ์ระบุสถานที่/เวลา หรือเข้าเว็บเพื่อลงทะเบียนแจ้งของหายไว้ล่วงหน้าได้ครับ`
                }
            ]);
        }
    } catch (imageError) {
        console.error('Image Processing/AI Error:', imageError);
        await replyToLine(replyToken, [
            {
                type: 'text',
                text: `ระบบไม่สามารถประมวลผลรูปภาพนี้ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือพิมพ์คำอธิบายในรูปแบบข้อความแทนครับ`
            }
        ]);
    }
}

/**
 * จัดการเมื่อผู้ใช้ส่งข้อความอักษรทั่วไป (Text Message Event)
 * @param {Object} event - ข้อมูลของเหตุการณ์ส่งข้อความอักษร
 */
async function handleTextEvent(event) {
    const replyToken = event.replyToken;
    const userMessage = event.message.text.trim();
    const lineUserId = event.source.userId;

    console.log(`LINE บอทได้รับข้อความ: ${userMessage} จาก UID: ${lineUserId}`);

    // 1. ฟีเจอร์ผูกบัญชี
    if (userMessage === 'ผูกบัญชี') {
        await replyToLine(replyToken, [
            {
                type: 'text',
                text: `[ระบบผูกบัญชี Unifind] 👤

ยินดีต้อนรับเข้าสู่ระบบติดตามแจ้งเตือนของหายครับ ท่านสามารถผูกบัญชี LINE เพื่อรับแจ้งเตือนเมื่อระบบตรวจพบของที่ตรงกับลักษณะของหายของคุณได้ทันทีครับ

👉 วิธีการผูกบัญชี:
กรุณาพิมพ์ข้อความส่งเข้ามาในแชทดังนี้:
"ผูกบัญชี: อีเมลมหาวิทยาลัยของท่าน"
(ตัวอย่างเช่น: ผูกบัญชี: student@utcc.ac.th)`
            }
        ]);
        return;
    }

    if (userMessage.startsWith('ผูกบัญชี:')) {
        const email = userMessage.substring(9).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await replyToLine(replyToken, [
                {
                    type: 'text',
                    text: `⚠️ รูปแบบอีเมลไม่ถูกต้องครับ กรุณาพิมพ์ในรูปแบบตัวอย่างนี้นะครับ:\n\nผูกบัญชี: student@utcc.ac.th`
                }
            ]);
            return;
        }

        // บันทึกการผูกบัญชีลงในไฟล์ bindings
        lineBindings.bind(email, lineUserId);

        await replyToLine(replyToken, [
            {
                type: 'text',
                text: `[ผูกบัญชีเรียบร้อยแล้ว] 🎉
                
ระบบได้เชื่อมโยงบัญชี LINE นี้เข้ากับอีเมล "${email}" ในฐานข้อมูลเรียบร้อยแล้วครับ!

นับจากนี้ เมื่อเจ้าหน้าที่บันทึกข้อมูลของหายที่ตรงกับข้อมูลของท่าน ระบบจะส่งข้อความแจ้งเตือนหาท่านผ่านช่องทางนี้ทันทีครับ ขอบคุณครับ`
            }
        ]);
        return;
    }

    // 2. คำทักทายทั่วไป (Greeting Keywords)
    const greetingKeywords = ['สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'หวัดดี', 'ฮัลโหล', 'hello', 'hi'];
    if (greetingKeywords.some(k => userMessage.toLowerCase() === k || userMessage.toLowerCase().startsWith(k))) {
        const greetingResponses = [
            `สวัสดีครับ ยินดีต้อนรับสู่ระบบส่วนกลาง Unifind ครับ ท่านสามารถพิมพ์สอบถามลักษณะสิ่งของสูญหายที่ต้องการค้นหา หรือตรวจสอบภาพรวมรายการสิ่งของภายในคลังระบบได้ทันทีครับ`,
            `สวัสดีครับ ยินดีต้อนรับสู่บริการสืบค้นสิ่งของสูญหายประจำมหาวิทยาลัยครับ ท่านสามารถแจ้งลักษณะของหาย หรือ "ส่งรูปถ่ายสิ่งของ" เพื่อให้ระบบประสานค้นหาได้เลยครับ`
        ];
        await replyToLine(replyToken, [
            { type: 'text', text: getRandomResponse(greetingResponses) },
            { type: 'text', text: welcomeAndGuideMessage }
        ]);
        return;
    }

    // 3. คำขอบคุณ (Thanks Keywords)
    const thanksKeywords = ['ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบใจ', 'thank', 'thx'];
    if (thanksKeywords.some(k => userMessage.toLowerCase().includes(k))) {
        await replyToLine(replyToken, [
            {
                type: 'text',
                text: `ด้วยความยินดีเป็นอย่างยิ่งครับ ทางระบบ Unifind หวังเป็นอย่างยิ่งว่าท่านจะได้รับสิ่งของสูญหายกลับคืนโดยเร็วที่สุด ขอให้มีวันที่ดีครับ`
            }
        ]);
        return;
    }

    // 4. ระบบ Hybrid AI + ค้นหา/สรุปในฐานข้อมูล
    try {
        const classificationPrompt = `วิเคราะห์ประโยคของผู้ใช้ภาษาไทยต่อไปนี้ว่ามีจุดประสงค์อะไรในระบบตามหาของหาย โดยเลือกข้อที่ถูกต้องที่สุดเพียงข้อเดียว:
1. "SUMMARY" - หากผู้ใช้ถามภาพรวมกว้างๆ ว่าตอนนี้มีอะไรหายบ้าง, มีหมวดหมู่ไหนบ้าง, หรือมีสถิติอะไรบ้าง
2. "SEARCH" - หากผู้ใช้พิมพ์ระบุชื่อสิ่งของชัดเจนเพื่อเจาะจงค้นหา เช่น มีโทรศัพท์หายไหม, กุญแจตก, ตามหากระเป๋า
3. "CHITCHAT" - หากเป็นการพูดคุยทั่วไป ทักทาย บ่น หรือพิมพ์เล่นที่ไม่มีเรื่องสิ่งของมาเกี่ยวข้อง

ข้อความผู้ใช้: "${userMessage}"
ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น: { "intent": "ตัวเลือกที่เลือก" }`;

        const classificationResult = await generateContentWithFallback(ai, {
            contents: classificationPrompt,
            config: { responseMimeType: 'application/json' }
        });

        const intentData = JSON.parse(classificationResult.text.trim());

        // เคสที่ 4.1: สรุปภาพรวมสิ่งของสูญหาย (SUMMARY)
        if (intentData.intent === 'SUMMARY') {
            const { data: lostItems } = await supabase.from('LostItem').select('category_id').eq('status', 'LOST');
            const { data: foundItems } = await supabase.from('FoundItem').select('category_id').in('status', ['FOUND', 'STORED']);

            const allItems = [...(lostItems || []), ...(foundItems || [])];

            if (allItems.length === 0) {
                await replyToLine(replyToken, [
                    {
                        type: 'text',
                        text: `[รายงานสถานะระบบ]\n\nปัจจุบันยังไม่มีรายงานสิ่งของสูญหายหรือสิ่งของคงค้างภายในระบบ Unifind ครับ`
                    }
                ]);
                return;
            }

            const countMap = {};
            allItems.forEach((item) => {
                const catName = getCategoryName(item.category_id);
                countMap[catName] = (countMap[catName] || 0) + 1;
            });

            let summaryReply = `[รายงานสรุปสถิติตัวเลขสิ่งของคงค้างในระบบ Unifind]

พบสิ่งของที่ลงทะเบียนแยกตามหมวดหมู่ในคลังระบบปัจจุบันดังนี้ครับ:
`;
            Object.keys(countMap).forEach((categoryName) => {
                summaryReply += `\nหมวดหมู่: ${categoryName}\nจำนวนสิ่งของ: ${countMap[categoryName]} รายการ\n────────────────`;
            });
            summaryReply += `\n\nคำแนะนำเพิ่มเติม:\nหากท่านคาดว่ามีสิ่งของของท่านอยู่ กรุณาพิมพ์ระบุรายละเอียด ชื่อของตกหล่น หรือส่งรูปถ่ายเพื่อตรวจสอบเจาะจงได้เลยครับ`;

            await replyToLine(replyToken, [{ type: 'text', text: summaryReply }]);
            return;
        }

        // เคสที่ 4.2: ค้นหาเจาะจงรายชิ้นด้วยข้อความ (SEARCH)
        if (intentData.intent === 'SEARCH') {
            const extractionPrompt = `วิเคราะห์ข้อความแจ้งของหายต่อไปนี้ แล้วสกัดเอาคีย์เวิร์ด ชื่อสิ่งของ, สถานที่ ออกมาในรูปแบบ JSON ตามโครงสร้างที่กำหนดเท่านั้น ข้อความผู้ใช้: "${userMessage}"`;

            const aiResponse = await generateContentWithFallback(ai, {
                contents: extractionPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            keyword: { type: Type.STRING },
                            place: { type: Type.STRING }
                        },
                        required: ["keyword", "place"]
                    }
                }
            });

            const searchData = JSON.parse(aiResponse.text.trim());

            // ค้นหาในคลัง FoundItem
            let query = supabase.from('FoundItem').select('*, Location(*)').in('status', ['FOUND', 'STORED']);
            const orFilter = `item_name.ilike.%${searchData.keyword}%,description.ilike.%${searchData.keyword}%`;
            query = query.or(orFilter);

            if (searchData.place) {
                const { data: locs } = await supabase.from('Location').select('location_id').ilike('location_name', `%${searchData.place}%`);
                if (locs && locs.length > 0) {
                    query = query.in('location_id', locs.map(l => l.location_id));
                }
            }

            const { data: candidateItems, error: searchError } = await query;
            if (searchError) throw searchError;

            const isMatched = candidateItems && candidateItems.length > 0;

            if (isMatched) {
                const item = candidateItems[0];
                await replyToLine(replyToken, [
                    {
                        type: 'text',
                        text: `[ระบบ Unifind ตรวจพบข้อมูลในคลังใกล้เคียง]\n\nพบของตกหล่นที่ตรงกับคำสืบค้น: "${item.item_name}" ในฐานข้อมูลส่วนกลางครับ\n\nขั้นตอนถัดไป:\nแนะนำให้ล็อกอินเข้าใช้หน้าเว็บเพื่อส่งหลักฐานขออนุมัติคืน (Claim Workflow) หรือแสดงตัวต่อเจ้าหน้าที่เพื่อรับคืนครับ`
                    }
                ]);
                return;
            } else {
                await replyToLine(replyToken, [
                    {
                        type: 'text',
                        text: `[ระบบ Unifind ค้นหาข้อมูล]\n\nวิเคราะห์คำค้นหาแล้วแต่ยังไม่พบสิ่งของลักษณะ "${searchData.keyword}" ในคลังเก็บของหายปัจจุบันครับ\n\nคำแนะนำ: ท่านสามารถทำบันทึกแจ้งของหาย (Lost Item) ล่วงหน้าไว้บนหน้าเว็บไซต์ เมื่อพนักงานพบคลิกบันทึกเข้าระบบจะระบบจะแจ้งเตือนคุณทาง LINE ทันทีครับ`
                    }
                ]);
                return;
            }
        }

        // เคสที่ 4.3: แชทคุยทั่วไป (CHITCHAT)
        const chatbotPrompt = `คุณคือระบบปัญญาประดิษฐ์ช่วยเหลือส่วนกลางของแพลตฟอร์ม Unifind ประจำมหาวิทยาลัยหอการค้าไทย (UTCC) ตอบกลับให้สุภาพ เป็นทางการ ใช้คำแทนตัวว่าระบบ และลงท้ายด้วยครับเสมอ ข้อความผู้ใช้: "${userMessage}"`;
        const aiChatResponse = await generateContentWithFallback(ai, {
            contents: chatbotPrompt,
            config: { temperature: 0.85 }
        });

        await replyToLine(replyToken, [{ type: 'text', text: aiChatResponse.text.trim() }]);

    } catch (error) {
        console.error('Hybrid AI System Error:', error);
        await replyToLine(replyToken, [
            {
                type: 'text',
                text: `[ระบบ Unifind ขออภัยในความไม่สะดวก]\n\nขณะนี้ระบบประมวลผล AI หนาแน่นชั่วคราว ทำให้ไม่สามารถตรวจสอบข้อความของท่านได้\n\nกรุณารอสักครู่ (ประมาณ 30 วินาที) แล้วลองส่งข้อความใหม่อีกครั้ง หรือสามารถเข้ามาสืบค้นผ่านทางเว็บไซต์ Unifind ได้โดยตรงครับ`
            }
        ]);
    }
}

// =========================================================================
// 3. MAIN WEBHOOK ENDPOINT (จุดเชื่อมต่อหลักสำหรับ LINE Webhook)
// =========================================================================

router.post('/webhook', async (req, res) => {
    res.sendStatus(200); // ตอบกลับ LINE ทันที ป้องกัน Timeout

    const events = req.body.events;
    if (!events || events.length === 0) return;

    for (let event of events) {
        // แยกตามประเภทการทำงานของ Event
        if (event.type === 'follow') {
            await handleFollowEvent(event);
        } else if (event.type === 'message') {
            if (event.message.type === 'image') {
                await handleImageEvent(event);
            } else if (event.message.type === 'text') {
                await handleTextEvent(event);
            }
        }
    }
});

module.exports = router;