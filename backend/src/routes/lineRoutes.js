const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenAI, Type } = require('@google/genai');
const supabase = require('../config/supabase');
const lineBindings = require('../config/lineBindings');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Local JSON DB file configuration
const localDbPath = path.join(__dirname, '../../uploads/local_db.json');

function loadLocalDb() {
    try {
        if (!fs.existsSync(localDbPath)) {
            const initial = {
                LostItem: [],
                FoundItem: [
                    {
                        found_item_id: 1,
                        item_name: 'กระเป๋าสตางค์หนังสีน้ำตาล',
                        category_id: 2,
                        location_id: 1,
                        floor: '2',
                        found_date: new Date().toISOString(),
                        description: JSON.stringify({ textDescription: 'กระเป๋าหนังผู้ชาย มีบัตรนักศึกษา UTCC ข้างใน', finder_universityEmail: 'student@utcc.ac.th' }),
                        status: 'STORED',
                        finder_id: 1
                    },
                    {
                        found_item_id: 2,
                        item_name: 'iPad Pro พร้อม Apple Pencil',
                        category_id: 3,
                        location_id: 3,
                        floor: '',
                        found_date: new Date().toISOString(),
                        description: JSON.stringify({ textDescription: 'ไอแพดมีเคสสีเขียวพาสเทล ลืมวางไว้ที่โรงอาหารหลัก', finder_universityEmail: 'student@utcc.ac.th' }),
                        status: 'STORED',
                        finder_id: 1
                    }
                ],
                Person: [
                    { person_id: 1, full_name: 'System User', email: 'student@utcc.ac.th' }
                ]
            };
            if (!fs.existsSync(path.dirname(localDbPath))) {
                fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
            }
            fs.writeFileSync(localDbPath, JSON.stringify(initial, null, 2));
            return initial;
        }
        const data = fs.readFileSync(localDbPath, 'utf8');
        return JSON.parse(data || '{}');
    } catch (e) {
        console.error('Error loading local DB:', e);
        return { LostItem: [], FoundItem: [], Person: [] };
    }
}

function saveLocalDb(db) {
    try {
        if (!fs.existsSync(path.dirname(localDbPath))) {
            fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
        }
        fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error('Error saving local DB:', e);
    }
}

function getLocalFoundItems() {
    const db = loadLocalDb();
    return db.FoundItem || [];
}

function getLocalLostItems() {
    const db = loadLocalDb();
    return db.LostItem || [];
}

function getOrCreateLocalPerson(email) {
    const db = loadLocalDb();
    const existing = db.Person.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing.person_id;
    const newId = db.Person.length + 1;
    db.Person.push({
        person_id: newId,
        full_name: email.split('@')[0],
        email: email
    });
    saveLocalDb(db);
    return newId;
}

function insertLocalLostItem(item) {
    const db = loadLocalDb();
    const newId = db.LostItem.length + 1;
    const newItem = {
        lost_item_id: newId,
        ...item
    };
    db.LostItem.push(newItem);
    saveLocalDb(db);
    return newItem;
}

function getMockLocationName(locId) {
    const names = {
        1: 'อาคาร 24',
        2: 'อาคาร 6',
        3: 'โรงอาหาร',
        4: 'ห้องสมุด'
    };
    return names[locId] || 'ไม่ระบุสถานที่';
}

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
พิมพ์ "อีเมลมหาวิทยาลัยของท่าน" เข้ามาในแชทได้โดยตรง (เช่น: student@utcc.ac.th)`;

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

    // 1. ฟีเจอร์ผูกบัญชี (รองรับพิมพ์อีเมลตรงๆ หรือพิมพ์คำว่า ผูกบัญชี)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let emailToBind = null;

    if (emailRegex.test(userMessage)) {
        emailToBind = userMessage;
    } else if (userMessage.startsWith('ผูกบัญชี:')) {
        emailToBind = userMessage.substring(9).trim();
    }

    if (userMessage === 'ผูกบัญชี') {
        await replyToLine(replyToken, [
            {
                type: 'text',
                text: `[ระบบผูกบัญชี Unifind] 👤\n\nยินดีต้อนรับเข้าสู่ระบบติดตามแจ้งเตือนของหายครับ ท่านสามารถผูกบัญชี LINE เพื่อรับแจ้งเตือนเมื่อระบบตรวจพบของที่ตรงกับลักษณะของหายของคุณได้ทันทีครับ\n\n👉 วิธีการผูกบัญชี:\nกรุณาพิมพ์ "อีเมลมหาวิทยาลัยของท่าน" ส่งเข้ามาในแชทได้โดยตรงเลยครับ (ตัวอย่างเช่น: student@utcc.ac.th)`
            }
        ]);
        return;
    }

    if (emailToBind) {
        if (!emailRegex.test(emailToBind)) {
            await replyToLine(replyToken, [
                {
                    type: 'text',
                    text: `⚠️ รูปแบบอีเมลไม่ถูกต้องครับ กรุณาพิมพ์เป็นอีเมลของท่านโดยตรง เช่น: student@utcc.ac.th`
                }
            ]);
            return;
        }

        // บันทึกการผูกบัญชีลงในไฟล์ bindings
        lineBindings.bind(emailToBind, lineUserId);

        await replyToLine(replyToken, [
            {
                type: 'text',
                text: `[ผูกบัญชีเรียบร้อยแล้ว] 🎉\n\nระบบได้เชื่อมโยงบัญชี LINE นี้เข้ากับอีเมล "${emailToBind}" ในฐานข้อมูลเรียบร้อยแล้วครับ!\n\nนับจากนี้ เมื่อมีผู้พบของหรือพนักงานบันทึกข้อมูลของตกหล่นที่ตรงกับท่าน ระบบจะส่งข้อความแจ้งเตือนมาหาคุณทาง LINE ทันทีครับ ขอบคุณครับ`
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
1. "SUMMARY" - หากผู้ใช้ถามภาพรวมกว้างๆ ว่าตอนนี้ในระบบมีของอะไรหายบ้าง, มีหมวดหมู่ไหนบ้าง, หรือมีสถิติอะไรบ้าง (เช่น "มีของตกหล่นอะไรบ้าง", "ขอดูกลุ่มของหายหน่อย")
2. "SEARCH" - หากผู้ใช้ต้องการสอบถาม/สืบค้นว่าปัจจุบันมีคนเก็บสิ่งของชิ้นหนึ่งได้แล้วหรือยัง (เช่น "มีคนเก็บโทรศัพท์ได้ไหม", "ตามหาโทรศัพท์สีขาวที่หาย")
3. "REPORT_LOST" - หากผู้ใช้แจ้งว่าตนทำของหายหรือลืมของไว้ และระบุประเภทของที่หายชัดเจนเพื่อต้องการบันทึกข้อมูลของหายใหม่เข้าระบบ (เช่น "แจ้งของหาย: ร่มสีดำ", "ทำพวงกุญแจตกหายครับ", "แจ้งของหายเป็นกระเป๋าสีแดง")
4. "CHITCHAT" - หากเป็นการพูดคุยทั่วไป ทักทาย บ่น หรือพิมพ์เกริ่นสั้นๆ ว่าทำของหายเฉยๆ โดยที่ยังไม่ได้ระบุประเภท/ลักษณะสิ่งของที่สูญหายชัดเจน (เช่น "ทำของหายครับ", "ลืมของไว้ทำไงดี")

ข้อความผู้ใช้: "${userMessage}"
ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น: { "intent": "ตัวเลือกที่เลือก" }`;

        const classificationResult = await generateContentWithFallback(ai, {
            contents: classificationPrompt,
            config: { responseMimeType: 'application/json' }
        });

        const intentData = JSON.parse(classificationResult.text.trim());

        // เคสที่ 4.1: สรุปภาพรวมสิ่งของสูญหาย (SUMMARY)
        if (intentData.intent === 'SUMMARY') {
            let lostItems = [];
            let foundItems = [];
            try {
                const { data: lItems, error: lError } = await supabase.from('LostItem').select('category_id').eq('status', 'LOST');
                if (lError) throw lError;
                lostItems = lItems || [];

                const { data: fItems, error: fError } = await supabase.from('FoundItem').select('category_id').in('status', ['FOUND', 'STORED']);
                if (fError) throw fError;
                foundItems = fItems || [];
            } catch (err) {
                console.warn('Supabase offline in SUMMARY case, using local JSON database fallback');
                lostItems = getLocalLostItems();
                foundItems = getLocalFoundItems();
            }

            const allItems = [...lostItems, ...foundItems];

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
            let candidateItems = [];
            try {
                let query = supabase.from('FoundItem').select('*, Location(*)').in('status', ['FOUND', 'STORED']);
                const orFilter = `item_name.ilike.%${searchData.keyword}%,description.ilike.%${searchData.keyword}%`;
                query = query.or(orFilter);

                if (searchData.place) {
                    const { data: locs } = await supabase.from('Location').select('location_id').ilike('location_name', `%${searchData.place}%`);
                    if (locs && locs.length > 0) {
                        query = query.in('location_id', locs.map(l => l.location_id));
                    }
                }

                const { data: cItems, error: searchError } = await query;
                if (searchError) throw searchError;
                candidateItems = cItems || [];
            } catch (err) {
                console.warn('Supabase offline in SEARCH case, using local JSON database fallback');
                const localItems = getLocalFoundItems();
                const kw = (searchData.keyword || '').toLowerCase();
                const pl = (searchData.place || '').toLowerCase();

                candidateItems = localItems.filter(item => {
                    const statusMatch = ['FOUND', 'STORED'].includes(item.status);
                    if (!statusMatch) return false;

                    const nameMatch = (item.item_name || '').toLowerCase().includes(kw);

                    let descText = '';
                    try {
                        const parsed = JSON.parse(item.description);
                        descText = (parsed.textDescription || '').toLowerCase();
                    } catch (e) {
                        descText = (item.description || '').toLowerCase();
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

            if (!isMatched) {
                try {
                    console.log('🔍 Running Gemini semantic search fallback...');
                    const localItems = getLocalFoundItems();
                    const candidatesForAi = localItems.map(item => ({
                        id: item.found_item_id,
                        name: item.item_name,
                        description: item.description || ''
                    }));

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

                    const aiSearchResponse = await generateContentWithFallback(ai, {
                        contents: searchPrompt,
                        config: { responseMimeType: 'application/json' }
                    });

                    const semanticResult = JSON.parse(aiSearchResponse.text.trim());
                    if (semanticResult.match && semanticResult.itemId) {
                        let targetItemId = semanticResult.itemId;
                        if (Array.isArray(targetItemId)) {
                            targetItemId = targetItemId[0];
                        }
                        const matchedItem = localItems.find(i => Number(i.found_item_id) === Number(targetItemId));
                        if (matchedItem) {
                            candidateItems = [matchedItem];
                            isMatched = true;
                        }
                    }
                } catch (aiErr) {
                    console.error('Semantic search fallback failed:', aiErr);
                }
            }

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

        // เคสที่ 4.3: แจ้งของหายผ่านแชท (REPORT_LOST)
        if (intentData.intent === 'REPORT_LOST') {
            const email = lineBindings.getEmailByLineUserId(lineUserId);
            if (!email) {
                await replyToLine(replyToken, [
                    {
                        type: 'text',
                        text: `⚠️ ท่านยังไม่ได้ผูกบัญชี LINE กับระบบ Unifind ครับ\n\nกรุณาผูกบัญชีก่อนเพื่อความปลอดภัยในการยืนยันสิทธิ์ตัวตนในการแจ้งของหาย โดยพิมพ์รูปแบบด้านล่างส่งมาได้เลยครับ:\n\nผูกบัญชี: [อีเมลมหาวิทยาลัยของท่าน]\n(ตัวอย่าง: ผูกบัญชี: student@utcc.ac.th)`
                    }
                ]);
                return;
            }

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
}
`;

            const aiResponse = await generateContentWithFallback(ai, {
                contents: reportExtractionPrompt,
                config: { responseMimeType: 'application/json' }
            });

            const extractedData = JSON.parse(aiResponse.text.trim());

            // 2. แมป Location ID
            const getLocationId = (locationName) => {
                if (!locationName) return 1;
                const mapping = {
                    '24': 1,
                    'อาคาร 24': 1,
                    'ตึก 24': 1,
                    '6': 2,
                    'อาคาร 6': 2,
                    'ตึก 6': 2,
                    'โรงอาหาร': 3,
                    'ห้องสมุด': 4
                };
                for (const [key, val] of Object.entries(mapping)) {
                    if (locationName.includes(key)) return val;
                }
                return 1; // Default to Location 1 (อาคาร 24)
            };

            const dbDescription = JSON.stringify({
                textDescription: extractedData.description || '',
                finder_type: 'STUDENT',
                finder_phoneNumber: null,
                finder_studentId: null,
                finder_universityEmail: email
            });

            // 1. ค้นหาหรือสร้าง Person ในฐานข้อมูล และ 3. บันทึกลงตาราง LostItem
            let personId;
            let newLostItem;
            try {
                const { data: existingPerson } = await supabase
                    .from('Person')
                    .select('person_id')
                    .eq('email', email)
                    .maybeSingle();

                if (existingPerson) {
                    personId = existingPerson.person_id;
                } else {
                    const emailPrefix = email.split('@')[0];
                    const numericId = emailPrefix.match(/\d+/);
                    const studentId = numericId ? numericId[0] : '';

                    const { data: newPerson, error: personInsertError } = await supabase
                        .from('Person')
                        .insert({
                            person_type: 'STUDENT',
                            full_name: emailPrefix,
                            student_id: studentId,
                            email: email,
                            phone: null
                        })
                        .select()
                        .single();

                    if (personInsertError) throw personInsertError;
                    personId = newPerson.person_id;
                }

                // 3. บันทึกลงตาราง LostItem
                const { data: insertedItem, error: insertLostError } = await supabase
                    .from('LostItem')
                    .insert({
                        item_name: extractedData.item_name,
                        category_id: extractedData.category_id,
                        location_id: getLocationId(extractedData.place),
                        floor: extractedData.floor || '',
                        lost_datetime: new Date().toISOString(),
                        description: dbDescription,
                        status: 'LOST',
                        reporter_id: personId
                    })
                    .select()
                    .single();

                if (insertLostError) throw insertLostError;
                newLostItem = insertedItem;
            } catch (err) {
                console.warn('Supabase offline in REPORT_LOST case, using local JSON database fallback');
                personId = getOrCreateLocalPerson(email);

                newLostItem = insertLocalLostItem({
                    item_name: extractedData.item_name,
                    category_id: extractedData.category_id,
                    location_id: getLocationId(extractedData.place),
                    floor: extractedData.floor || '',
                    lost_datetime: new Date().toISOString(),
                    description: dbDescription,
                    status: 'LOST',
                    reporter_id: personId
                });
            }

            // 4. เรียกกระบวนการจับคู่ทันที
            const matchingService = require('../services/matchingService');
            matchingService.checkLostItemMatch(newLostItem);

            await replyToLine(replyToken, [
                {
                    type: 'text',
                    text: `[ระบบ Unifind บันทึกแจ้งของหายสำเร็จ] 📝\n\nระบบบันทึกของหายของท่านเข้าสู่ฐานข้อมูลส่วนกลางเรียบร้อยแล้วครับ!\n\n📋 รายละเอียดที่บันทึก:\n• สิ่งของ: ${extractedData.item_name}\n• สถานที่: ${extractedData.place}${extractedData.floor ? ' ชั้น ' + extractedData.floor : ''}\n• รายละเอียดเพิ่มเติม: ${extractedData.description || '-'}\n• อีเมลผู้แจ้ง: ${email}\n\n✨ ระบบได้เปิดทำการสแกนสืบค้นหาของหายในคลังให้อัตโนมัติ หากมีผู้นำส่งของพบคลังที่ตรงกัน ระบบจะส่งข้อความแจ้งเตือนด่วนหาท่านทันทีครับ`
                }
            ]);
            return;
        }

        // เคสที่ 4.4: แชทคุยทั่วไป (CHITCHAT)
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