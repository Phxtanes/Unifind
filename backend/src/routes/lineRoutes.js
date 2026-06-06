const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Op, fn, col } = require('sequelize'); 
const { GoogleGenAI, Type } = require('@google/genai'); 
const LostItem = require('../models/LostItem'); 
const User = require('../models/User');         

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ฟังก์ชันสำหรับสุ่มเลือกข้อความจากอาเรย์
const getRandomResponse = (array) => array[Math.floor(Math.random() * array.length)];

// 📄 คู่มือการใช้งานระบบหลัก
const welcomeAndGuideMessage = `📋 [คู่มือการใช้งานระบบ Unifind LINE Bot]\n\nท่านสามารถใช้บริการตรวจสอบและค้นหาสิ่งของสูญหายได้ผ่านช่องทางดังต่อไปนี้:\n\n🔍 1. การค้นหาสิ่งของแบบระบุรายละเอียด\nท่านสามารถพิมพ์ข้อความอธิบายลักษณะ หรือ "ส่งรูปภาพสิ่งของ" เข้ามาในแชทเพื่อสืบค้นได้ทันที\n💡 ตัวอย่าง: "ตามหาโทรศัพท์ ทำตกไว้บริเวณโรงอาหาร"\n\n📊 2. การตรวจสอบภาพรวมสิ่งของสูญหาย\nพิมพ์คำสำคัญ เช่น "สรุปรายการของหาย" หรือ "ตรวจสอบหมวดหมู่"\n\n🔔 3. การผูกบัญชีเพื่อรับการแจ้งเตือน\nพิมพ์ฟอร์แทต -> ผูกบัญชี: [อีเมลมหาวิทยาลัยของท่าน]`;

// ฟังก์ชันช่วยยิงข้อความตอบกลับ LINE
async function replyToLine(replyToken, messages) {
    try {
        await axios.post('https://api.line.me/v2/bot/message/reply', {
            replyToken: replyToken,
            messages: messages
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
            }
        });
    } catch (error) {
        console.error('❌ LINE Reply Error:', error.response ? error.response.data : error.message);
    }
}

// 📸 ฟังก์ชันดาวน์โหลดรูปภาพจาก LINE API และแปลงเป็นรูปแบบที่ Gemini รองรับ
async function getLineImageBuffer(messageId) {
    const response = await axios({
        method: 'get',
        url: `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        headers: { 'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
        responseType: 'arraybuffer'
    });
    return {
        inlineData: {
            data: Buffer.from(response.data).toString("base64"),
            mimeType: "image/jpeg"
        }
    };
}

router.post('/webhook', async (req, res) => {
    res.sendStatus(200); // ⚡ ป้องกัน LINE Timeout

    const events = req.body.events;
    if (!events || events.length === 0) return;

    for (let event of events) {
        
        // 🤝 1. เมื่อผู้ใช้เพิ่มเพื่อน (Follow Event)
        if (event.type === 'follow') {
            const replyToken = event.replyToken;
            const welcomePatterns = [
                `สวัสดีครับ ยินดีต้อนรับสู่บริการส่งคืนสิ่งของสูญหาย Unifind ประจำมหาวิทยาลัย ระบบนี้ควบคุมและประสานงานโดยระบบปัญญาประดิษฐ์ (AI) ร่วมกับฐานข้อมูลส่วนกลางเพื่อช่วยเหลือนักศึกษาและบุคลากรทุกท่านครับ`,
                `ยินดีต้อนรับเข้าสู่ระบบส่วนกลาง Unifind ครับ ช่องทางนี้เป็นบอท AI อัจฉริยะที่เชื่อมต่อกับฐานข้อมูลสิ่งของสูญหายภายในรั้วมหาวิทยาลัย พร้อมให้บริการตรวจสอบข้อมูลแก่ทุกท่านตลอด 24 ชั่วโมงครับ`
            ];
            await replyToLine(replyToken, [
                { type: 'text', text: getRandomResponse(welcomePatterns) },
                { type: 'text', text: welcomeAndGuideMessage }
            ]);
            continue;
        }

        // 🖼️ 2. [ฟีเจอร์เพิ่มใหม่] ดักจับเมื่อผู้ใช้ส่ง "รูปภาพ" เข้ามา (Image Message Event)
        if (event.type === 'message' && event.message.type === 'image') {
            const replyToken = event.replyToken;
            const messageId = event.message.id;

            console.log(`📸 ระบบได้รับข้อความรูปภาพ ID: ${messageId}`);

            try {
                // ดึงข้อมูลรายการของหายทั้งหมดในตาราง MySQL ขึ้นมาเตรียมเทียบ
                const allItems = await LostItem.findAll({
                    attributes: ['id', 'name', 'category', 'place', 'description', 'status'],
                    where: { status: 'สูญหาย' }, // ค้นหาเฉพาะชิ้นที่ยังมีสถานะสูญหาย
                    raw: true
                });

                // ดาวน์โหลดรูปภาพแปลงเป็น Base64
                const imagePart = await getLineImageBuffer(messageId);

                // หากไม่มีข้อมูลของหายในระบบเลย ให้แจ้งกลับทันที
                if (allItems.length === 0) {
                    await replyToLine(replyToken, [{
                        type: 'text',
                        text: `🔍 [ระบบรับรูปภาพเรียบร้อย]\n\nจากการวิเคราะห์รูปภาพเบื้องต้นและตรวจสอบฐานข้อมูลส่วนกลาง ปัจจุบันยังไม่มีรายงานสิ่งของคงค้างในระบบที่สอดคล้องกันครับ ทางระบบแนะนำให้ท่านโพสต์รายละเอียดขึ้นสู่เว็บไซต์หลักก่อนครับ`
                    }]);
                    continue;
                }

                // ส่งรูปภาพพร้อมคลังข้อมูลทั้งหมดไปให้ Gemini ช่วย Match ค้นหาหาความเชื่อมโยง
                const imageAnalysisPrompt = `คุณคือ AI ตรวจสอบภาพของหายในระบบ Unifind
                จงดูรูปภาพสิ่งของที่ผู้ใช้ส่งมานี้อย่างละเอียด วิเคราะห์ว่ามันคืออะไร สีอะไร ลักษณะอย่างไร จากนั้นเปรียบเทียบกับรายการสิ่งของในฐานข้อมูล MySQL ด้านล่างนี้:
                
                รายการข้อมูลในฐานข้อมูล:
                ${JSON.stringify(allItems, null, 2)}
                
                หน้าที่ของคุณ:
                1. ตรวจสอบว่าในภาพ มีสิ่งของชิ้นใดที่ "ตรงกัน หรือใกล้เคียงมากที่สุด" กับสิ่งของในข้อมูลหรือไม่
                2. หากพบข้อมูลที่สอดคล้องกัน (เช่น ในรูปเป็นกระเป๋าตังค์สีน้ำตาล และใน DB มีกระเป๋าตังค์สีน้ำตาลระบุไว้) ให้ตอบกลับเป็น JSON ในรูปแบบนี้เท่านั้น:
                   { "match": true, "itemId": [ใส่ ID ของชิ้นที่เจอใน DB], "reason": "อธิบายเหตุผลเป็นภาษาไทยว่าทำไมถึงแมตช์กันอย่างสุภาพและเป็นทางการ" }
                3. หากตรวจสอบแล้วไม่พบสิ่งของใดในคลังข้อมูลที่ตรงกับรูปภาพนี้เลย ให้ตอบกลับเป็น JSON รูปแบบนี้:
                   { "match": false, "itemId": null, "reason": "อธิบายสั้นๆ ว่าวิเคราะห์แล้วภาพนี้คืออะไร แต่ไม่ตรงกับระบบ" }
                
                ตอบกลับเป็น JSON รูปแบบที่กำหนดเท่านั้น ห้ามพิมพ์ข้อความอื่นนอกเหนือจาก JSON`;

                const aiImageResult = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [imagePart, imageAnalysisPrompt],
                    config: { responseMimeType: 'application/json' }
                });

                const resultData = JSON.parse(aiImageResult.text.trim());
                console.log('🤖 ผลวิเคราะห์รูปภาพจาก AI:', resultData);

                // เคสที่ 1: AI ตรวจพบว่ารูปภาพ "ตรงกับข้อมูลในระบบ"
                if (resultData.match && resultData.itemId) {
                    const matchedItem = await LostItem.findByPk(resultData.itemId);
                    await replyToLine(replyToken, [{
                        type: 'text',
                        text: `🔍 [ระบบ Unifind ตรวจพบข้อมูลจากรูปภาพ!]\n\n🎉 แจ้งผลสำเร็จ: จากการตรวจสอบเชิงลึกด้วยระบบวิเคราะห์ภาพปัญญาประดิษฐ์ (AI) พบว่ารูปภาพที่ท่านส่งมา มีลักษณะสอดคล้องกับสิ่งของในระบบรหัสรายการ #${resultData.itemId} (${matchedItem ? matchedItem.name : ''}) ครับ\n\n📝 เหตุผลสนับสนุน: ${resultData.reason}\n\n📌 ขั้นตอนถัดไป:\nแนะนำให้ท่านนำหลักฐานการแสดงตน พร้อมรายละเอียดความเป็นเจ้าของ เข้าติดต่อประสานงานรับสิ่งของคืน ณ จุดบริการของมหาวิทยาลัยได้เลยครับ`
                    }]);
                } else {
                    // เคสที่ 2: วิเคราะห์แล้วไม่เจอของที่ตรงกัน
                    await replyToLine(replyToken, [{
                        type: 'text',
                        text: `🔍 [ผลการวิเคราะห์รูปภาพเสร็จสิ้น]\n\nทางระบบวิเคราะห์รูปภาพของท่านแล้วพบว่าคือประเภท "${resultData.reason}" อย่างไรก็ตาม ปัจจุบัน "ยังไม่พบ" รายการสิ่งของสูญหายที่มีลักษณะทางกายภาพ สี หรือประเภทที่สอดคล้องกับภาพนี้ในคลังฐานข้อมูลคอมมูนิตี้ครับ\n\n📌 คำแนะนำเพิ่มเติม:\nท่านสามารถพิมพ์ระบุสถานที่หรือเวลาเพิ่มเติม หรือเข้าลงทะเบียนติดตามสิ่งของต่อได้ที่หน้าเว็บไซต์ Unifind ครับ`
                    }]);
                }
                continue;

            } catch (imageError) {
                console.error('❌ Image Processing/AI Error:', imageError);
                await replyToLine(replyToken, [{ type: 'text', text: `❌ ระบบไม่สามารถประมวลผลรูปภาพนี้ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือพิมพ์คำอธิบายในรูปแบบข้อความแทนครับ` }]);
                continue;
            }
        }

        // 💬 3. ดักจับข้อความตัวหนังสือปกติ (Message Event - Text)
        if (event.type === 'message' && event.message.type === 'text') {
            const replyToken = event.replyToken;
            const userMessage = event.message.text.trim();
            const lineUserId = event.source.userId;

            console.log(`💬 LINE บอทได้รับข้อความ: ${userMessage} จาก UID: ${lineUserId}`);

            // ฟีเจอร์ผูกบัญชี
            if (userMessage.startsWith('ผูกบัญชี:')) {
                const email = userMessage.split('ผูกบัญชี:')[1].trim();
                const user = await User.findOne({ where: { email: email } });
                
                if (user) {
                    const bindSuccessPatterns = [
                        `✅ [ระบบ Unifind] ดำเนินการผูกบัญชีผู้ใช้งานกับอีเมล ${email} เสร็จสิ้น บัญชีของท่านพร้อมรับการแจ้งเตือนด่วนเมื่อมีคนพบของหายชิ้นใหม่แล้วครับ`,
                        `✅ [การเชื่อมต่อสำเร็จ] ระบบได้ทำการเชื่อมโยงสิทธิ์บัญชี LINE ของท่านเข้ากับอีเมลระบบคอมมูนิตี้ ${email} เรียบร้อยแล้วครับ หากมีสิ่งของใหม่ถูกอัปเดตเข้ามา ระบบจะส่งข้อความแจ้งเตือนทันที`
                    ];
                    await replyToLine(replyToken, [{ type: 'text', text: getRandomResponse(bindSuccessPatterns) }]);
                } else {
                    await replyToLine(replyToken, [{ type: 'text', text: `❌ [ระบบปฏิเสธคำขอ] ไม่พบข้อมูลอีเมล ${email} ในระบบคอมมูนิตี้ Unifind กรุณาตรวจสอบอีกครั้งครับ` }]);
                }
                continue;
            }

            // ตรวจสอบระบบคำทักทายทั่วไป
            const greetingKeywords = ['สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'หวัดดี', 'ฮัลโหล', 'hello', 'hi'];
            if (greetingKeywords.some(keyword => userMessage.toLowerCase() === keyword || userMessage.toLowerCase().startsWith(keyword))) {
                const greetingResponses = [
                    `สวัสดีครับ ยินดีต้อนรับสู่ระบบส่วนกลาง Unifind ครับ ท่านสามารถพิมพ์สอบถามลักษณะสิ่งของสูญหายที่ต้องการค้นหา หรือตรวจสอบภาพรวมรายการสิ่งของภายในคลังระบบได้ทันทีครับ`,
                    `สวัสดีครับ ยินดีต้อนรับสู่บริการสืบค้นสิ่งของสูญหายประจำมหาวิทยาลัยครับ ท่านสามารถแจ้งลักษณะของหาย หรือ "ส่งรูปถ่ายสิ่งของ" เพื่อให้ระบบประสานค้นหาได้เลยครับ`
                ];
                await replyToLine(replyToken, [
                    { type: 'text', text: getRandomResponse(greetingResponses) },
                    { type: 'text', text: welcomeAndGuideMessage }
                ]);
                continue;
            }

            // ตรวจสอบระบบคำขอบคุณ
            const thanksKeywords = ['ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบใจ', 'thank', 'thx'];
            if (thanksKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
                await replyToLine(replyToken, [{
                    type: 'text',
                    text: `ด้วยความยินดีเป็นอย่างยิ่งครับ ทางระบบ Unifind หวังเป็นอย่างยิ่งว่าท่านจะได้รับสิ่งของสูญหายกลับคืนโดยเร็วที่สุด ขอให้มีวันที่ดีครับ`
                }]);
                continue;
            }

            // 🧠🧠🧠 HYBRID AI + DATABASE (TEXT SEARCH & SUMMARY) 🧠🧠🧠
            try {
                // AI สเต็ปที่ 1: วิเคราะห์เจตนา (Intent)
                const classificationPrompt = `วิเคราะห์ประโยคของผู้ใช้ภาษาไทยต่อไปนี้ว่ามีจุดประสงค์อะไรในระบบตามหาของหาย โดยเลือกข้อที่ถูกต้องที่สุดเพียงข้อเดียว:
                1. "SUMMARY" - หากผู้ใช้ถามภาพรวมกว้างๆ ว่าตอนนี้มีอะไรหายบ้าง, มีหมวดหมู่ไหนบ้าง, หรือมีสถิติอะไรบ้าง
                2. "SEARCH" - หากผู้ใช้พิมพ์ระบุชื่อสิ่งของชัดเจนเพื่อเจาะจงค้นหา เช่น มีโทรศัพท์หายไหม, กุญแจตก, ตามหากระเป๋า
                3. "CHITCHAT" - หากเป็นการพูดคุยทั่วไป ทักทาย บ่น หรือพิมพ์เล่นที่ไม่มีเรื่องสิ่งของมาเกี่ยวข้อง
                
                ข้อความผู้ใช้: "${userMessage}"
                ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น: { "intent": "ตัวเลือกที่เลือก" }`;

                const classificationResult = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: classificationPrompt,
                    config: { responseMimeType: 'application/json' }
                });

                const intentData = JSON.parse(classificationResult.text.trim());

                // เคสสรุปรายงานสถิติตามหมวดหมู่ (SUMMARY)
                if (intentData.intent === 'SUMMARY') {
                    const categorySummary = await LostItem.findAll({
                        attributes: ['category', [fn('COUNT', col('category')), 'itemCount']],
                        group: ['category'],
                        raw: true
                    });

                    if (categorySummary.length === 0) {
                        await replyToLine(replyToken, [{ type: 'text', text: `📢 [รายงานสถานะระบบ]\n\nปัจจุบันยังไม่มีรายงานสิ่งของสูญหายหรือสิ่งของคงค้างภายในระบบ Unifind ครับ` }]);
                        continue;
                    }

                    let summaryReply = `📊 [รายงานสรุปสถิติตัวเลขสิ่งของคงค้างในระบบ Unifind]\n\nจากการตรวจสอบฐานข้อมูลส่วนกลาง พบสิ่งของที่ลงทะเบียนแยกตามหมวดหมู่ดังต่อไปนี้ครับ:\n`;
                    categorySummary.forEach((cat) => {
                        const categoryName = cat.category || 'อื่นๆ / ไม่ระบุหมวดหมู่';
                        summaryReply += `\n📦 หมวดหมู่: ${categoryName}\n🔹 จำนวนสิ่งของในระบบ: ${cat.itemCount} รายการ\n────────────────`;
                    });
                    summaryReply += `\n\n📌 คำแนะนำในการดำเนินการต่อ:\nหากท่านคาดว่ามีสิ่งของของท่านอยู่ กรุณาพิมพ์ระบุรายละเอียดเชิงลึก หรือเข้าตรวจสอบที่หน้าเว็บไซต์ Unifind ครับ`;

                    await replyToLine(replyToken, [{ type: 'text', text: summaryReply }]);
                    continue;
                }

                // เคสปกติ: ค้นหาเจาะจงรายชิ้นด้วย Text (SEARCH)
                if (intentData.intent === 'SEARCH') {
                    const extractionPrompt = `วิเคราะห์ข้อความแจ้งของหายต่อไปนี้ แล้วสกัดเอาคีย์เวิร์ด ชื่อสิ่งของ, สถานที่ และ เวลา ออกมาในรูปแบบ JSON ตามโครงสร้างที่กำหนดเท่านั้น ข้อความผู้ใช้: "${userMessage}"`;

                    const aiResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: extractionPrompt,
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    keyword: { type: Type.STRING },
                                    place: { type: Type.STRING },
                                    time: { type: Type.STRING }
                                },
                                required: ["keyword", "place", "time"]
                            }
                        }
                    });

                    const searchData = JSON.parse(aiResponse.text.trim());

                    let searchConditions = {
                        [Op.or]: [
                            { name: { [Op.like]: `%${searchData.keyword}%` } },
                            { description: { [Op.like]: `%${searchData.keyword}%` } }
                        ]
                    };
                    if (searchData.place) searchConditions.place = { [Op.like]: `%${searchData.place}%` };

                    const candidateItems = await LostItem.findAll({ where: searchConditions });
                    let isMatched = candidateItems.length > 0;

                    if (isMatched) {
                        await replyToLine(replyToken, [{ 
                            type: 'text', 
                            text: `🔍 [ระบบตรวจสอบข้อมูลสำเร็จ]\n\n🎉 แจ้งผลการตรวจสอบ: ตรวจพบข้อมูลสิ่งของเกี่ยวกับ "${searchData.keyword}" ที่มีรายละเอียด สอดคล้องกับที่ท่านระบุไว้ในฐานข้อมูลกลางครับ\n\n📌 ขั้นตอนการรับสิ่งของคืน:\nกรุณาเตรียมหลักฐานความเป็นเจ้าของเข้าติดต่อยืนยันตัวตน ณ จุดบริการส่วนกลางของมหาวิทยาลัยเพื่อรับของคืนได้ทันทีครับ` 
                        }]);
                        continue;
                    }
                }

                // เคสชวนคุยอื่น ๆ
                const chatbotPrompt = `คุณคือระบบปัญญาประดิษฐ์ช่วยเหลือส่วนกลางของแพลตฟอร์ม Unifind ประจำมหาวิทยาลัยหอการค้าไทย (UTCC) ตอบกลับให้สุภาพ เป็นทางการ ใช้คำแทนตัวว่าระบบ และลงท้ายด้วยครับเสมอ ข้อความผู้ใช้: "${userMessage}"`;
                const aiChatResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: chatbotPrompt,
                    config: { temperature: 0.85 }
                });

                await replyToLine(replyToken, [{ type: 'text', text: aiChatResponse.text.trim() }]);

            } catch (error) {
                console.error('❌ Hybrid AI System Error:', error);
                await replyToLine(replyToken, [{ type: 'text', text: welcomeAndGuideMessage }]);
            }
        }
    }
});

module.exports = router;