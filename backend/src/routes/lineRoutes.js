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
const welcomeAndGuideMessage = `📋 [คู่มือการใช้งานระบบ Unifind LINE Bot]\n\nท่านสามารถใช้บริการตรวจสอบและค้นหาสิ่งของสูญหายได้ผ่านช่องทางดังต่อไปนี้:\n\n🔍 1. การค้นหาสิ่งของแบบระบุรายละเอียด\nท่านสามารถพิมพ์ข้อความอธิบายลักษณะสิ่งของ สถานที่ หรือช่วงเวลาที่คาดว่าสูญหายได้ทันที\n💡 ตัวอย่าง: "ตามหาโทรศัพท์ ยี่ห้อ iPhone สีดำ ทำตกไว้บริเวณโรงอาหารในช่วงเวลา 10:00 น."\n\n📊 2. การตรวจสอบภาพรวมสิ่งของสูญหาย\nพิมพ์คำสำคัญ เช่น "สรุปรายการของหาย" หรือ "ตรวจสอบหมวดหมู่" เพื่อเรียกดูจำนวนสิ่งของแยกตามประเภทในระบบ\n\n🔔 3. การผูกบัญชีเพื่อรับการแจ้งเตือน\nพิมพ์ฟอร์แทต -> ผูกบัญชี: [อีเมลมหาวิทยาลัยของท่าน]`;

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

router.post('/webhook', async (req, res) => {
    res.sendStatus(200); // ⚡ ป้องกัน LINE Timeout

    const events = req.body.events;
    if (!events || events.length === 0) return;

    for (let event of events) {
        
        // 🤝 1. คลังคำต้อนรับแบบสุ่มเมื่อผู้ใช้เพิ่มเพื่อน (Follow Event)
        if (event.type === 'follow') {
            const replyToken = event.replyToken;
            const welcomePatterns = [
                `สวัสดีครับ ยินดีต้อนรับสู่บริการส่งคืนสิ่งของสูญหาย Unifind ประจำมหาวิทยาลัย ระบบนี้ควบคุมและประสานงานโดยระบบปัญญาประดิษฐ์ (AI) ร่วมกับฐานข้อมูลส่วนกลางเพื่อช่วยเหลือนักศึกษาและบุคลากรทุกท่านครับ`,
                `ยินดีต้อนรับเข้าสู่ระบบส่วนกลาง Unifind ครับ ช่องทางนี้เป็นบอท AI อัจฉริยะที่เชื่อมต่อกับฐานข้อมูลสิ่งของสูญหายภายในรั้วมหาวิทยาลัย พร้อมให้บริการตรวจสอบข้อมูลแก่ทุกท่านตลอด 24 ชั่วโมงครับ`,
                `สวัสดีครับ ท่านได้เข้าสู่ระบบสืบค้นสิ่งของสูญหาย Unifind มหาวิทยาลัยหอการค้าไทย เรียบร้อยแล้วครับ ระบบพร้อมประสานข้อมูลคลังของหายและส่งคืนให้แก่นักศึกษาทุกท่านอย่างเต็มที่ครับ`
            ];
            
            await replyToLine(replyToken, [
                { type: 'text', text: getRandomResponse(welcomePatterns) },
                { type: 'text', text: welcomeAndGuideMessage }
            ]);
            continue;
        }

        if (event.type === 'message' && event.message.type === 'text') {
            const replyToken = event.replyToken;
            const userMessage = event.message.text.trim();
            const lineUserId = event.source.userId;

            console.log(`💬 LINE บอทได้รับข้อความ: ${userMessage} จาก UID: ${lineUserId}`);

            // 🔐 2. คลังคำตอบผูกบัญชีสำเร็จแบบสุ่ม
            if (userMessage.startsWith('ผูกบัญชี:')) {
                const email = userMessage.split('ผูกบัญชี:')[1].trim();
                const user = await User.findOne({ where: { email: email } });
                
                if (user) {
                    const bindSuccessPatterns = [
                        `✅ [ระบบ Unifind] ดำเนินการผูกบัญชีผู้ใช้งานกับอีเมล ${email} เสร็จสิ้น บัญชีของท่านพร้อมรับการแจ้งเตือนด่วนเมื่อมีคนพบของหายชิ้นใหม่แล้วครับ`,
                        `✅ [การเชื่อมต่อสำเร็จ] ระบบได้ทำการเชื่อมโยงสิทธิ์บัญชี LINE ของท่านเข้ากับอีเมลระบบคอมมูนิตี้ ${email} เรียบร้อยแล้วครับ หากมีสิ่งของใหม่ถูกอัปเดตเข้ามา ระบบจะส่งข้อความแจ้งเตือนทันที`,
                        `✅ [ระบบบันทึกข้อมูลเรียบร้อย] ทำรายการผูกบัญชีกับอีเมล ${email} สำเร็จครับ ท่านจะได้รับการแจ้งเตือนความคืบหน้าผ่านทางระบบ Push Notification ของ LINE OA ตัวนี้ทันทีเมื่อมีรายการสิ่งของใหม่รอนำส่งคืนครับ`
                    ];
                    await replyToLine(replyToken, [{ type: 'text', text: getRandomResponse(bindSuccessPatterns) }]);
                } else {
                    const bindFailPatterns = [
                        `❌ [ระบบปฏิเสธคำขอ] ไม่พบข้อมูลอีเมล ${email} ในระบบคอมมูนิตี้ Unifind กรุณาตรวจสอบความถูกต้องของตัวสะกดหรือทำรายการสมัครสมาชิกที่หน้าเว็บก่อนครับ`,
                        `❌ [ตรวจสอบข้อมูลไม่ผ่าน] อีเมล ${email} ยังไม่ได้ถูกลงทะเบียนในฐานข้อมูลหลักของ Unifind รบกวนท่านตรวจสอบความถูกต้องของอีเมลอีกครั้งครับ`,
                        `❌ [ไม่พบข้อมูลบัญชี] ระบบไม่สามารถดำเนินการเชื่อมต่อได้เนื่องจากไม่พบอีเมล ${email} ในคลังผู้ใช้งาน กรุณาลงทะเบียนผ่านทางเว็บไซต์ Unifind ก่อนดำเนินการอีกครั้งครับ`
                    ];
                    await replyToLine(replyToken, [{ type: 'text', text: getRandomResponse(bindFailPatterns) }]);
                }
                continue;
            }

            // 👋 3. [เพิ่มใหม่] ตรวจสอบระบบคำทักทายทั่วไป (Greeting Checking)
            const greetingKeywords = ['สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'หวัดดี', 'ฮัลโหล', 'hello', 'hi', 'ทักครับ', 'ทักค่ะ'];
            if (greetingKeywords.some(keyword => userMessage.toLowerCase() === keyword || userMessage.toLowerCase().startsWith(keyword))) {
                const greetingResponses = [
                    `สวัสดีครับ ยินดีต้อนรับสู่ระบบส่วนกลาง Unifind ครับ ท่านสามารถพิมพ์สอบถามลักษณะสิ่งของสูญหายที่ต้องการค้นหา หรือตรวจสอบภาพรวมรายการสิ่งของภายในคลังระบบได้ทันทีครับ`,
                    `สวัสดีครับ ทางระบบ Unifind ยินดีให้บริการครับ วันนี้มีสิ่งของชิ้นใดที่ท่านต้องการตรวจสอบความคืบหน้าหรือสืบค้นในฐานข้อมูลเป็นพิเศษไหมครับสามารถพิมพ์บอกรายละเอียดได้เลยครับ`,
                    `สวัสดีครับ ยินดีต้อนรับสู่บริการสืบค้นสิ่งของสูญหายประจำมหาวิทยาลัยครับ ท่านสามารถแจ้งลักษณะของหาย (เช่น ชื่อของ สถานที่ ช่วงเวลา) เพื่อให้ระบบ AI ประสานค้นหาในคลังข้อมูลส่วนกลางได้เลยครับ`
                ];
                await replyToLine(replyToken, [
                    { type: 'text', text: getRandomResponse(greetingResponses) },
                    { type: 'text', text: welcomeAndGuideMessage } // แนบคู่มือสั้น ๆ ไปให้ดูทุกครั้งที่ทักเผื่อลืมวิธีใช้
                ]);
                continue;
            }

            // 🙏 4. ตรวจสอบระบบคำขอบคุณ (Thanks Checking)
            const thanksKeywords = ['ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบใจ', 'thank', 'thx', 'ขอบใจจ้า'];
            if (thanksKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
                const thanksPatterns = [
                    `ด้วยความยินดีเป็นอย่างยิ่งครับ ทางระบบ Unifind หวังเป็นอย่างยิ่งว่าท่านจะได้รับสิ่งของสูญหายกลับคืนโดยเร็วที่สุด ขอให้มีวันที่ดีครับ`,
                    `ยินดีให้บริการครับ หากท่านต้องการความช่วยเหลือหรือสืบค้นข้อมูลเพิ่มเติมในอนาคต สามารถพิมพ์ข้อความติดต่อระบบได้ตลอด 24 ชั่วโมงครับ`,
                    `ทางระบบยินดีสนับสนุนนักศึกษาและบุคลากรทุกท่านอย่างเต็มที่ครับ ขอให้ท่านประสานงานรับของคืนสำเร็จลุล่วงไปด้วยดีนะครับ รักษาสุขภาพด้วยครับ`
                ];
                await replyToLine(replyToken, [{ type: 'text', text: getRandomResponse(thanksPatterns) }]);
                continue;
            }

            // 🧠🧠🧠 เริ่มเข้าสู่กระบวนการ HYBRID AI + DATABASE 🧠🧠🧠
            try {
                // 🤖 AI สเต็ปที่ 1: วิเคราะห์เจตนา (Intent)
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
                console.log('🤖 AI จำแนก Intent เจตนาสำเร็จ:', intentData);

                // 📊 5. เคสสรุปรายงานสถิติตามหมวดหมู่ (SUMMARY)
                if (intentData.intent === 'SUMMARY') {
                    const categorySummary = await LostItem.findAll({
                        attributes: [
                            'category',
                            [fn('COUNT', col('category')), 'itemCount']
                        ],
                        group: ['category'],
                        raw: true
                    });

                    if (categorySummary.length === 0) {
                        await replyToLine(replyToken, [{ 
                            type: 'text', 
                            text: `📢 [รายงานสถานะระบบ]\n\nปัจจุบันยังไม่มีรายงานสิ่งของสูญหายหรือสิ่งของคงค้างที่รอนำส่งคืนภายในระบบ Unifind ครับ` 
                        }]);
                        continue;
                    }

                    let summaryReply = `📊 [รายงานสรุปสถิติตัวเลขสิ่งของคงค้างในระบบ Unifind]\n\nจากการตรวจสอบฐานข้อมูลส่วนกลาง พบสิ่งของที่ลงทะเบียนแยกตามหมวดหมู่ดังต่อไปนี้ครับ:\n`;
                    
                    categorySummary.forEach((cat) => {
                        const categoryName = cat.category || 'อื่นๆ / ไม่ระบุหมวดหมู่';
                        summaryReply += `\n📦 หมวดหมู่: ${categoryName}\n🔹 จำนวนสิ่งของในระบบ: ${cat.itemCount} รายการ\n────────────────`;
                    });

                    summaryReply += `\n\n📌 คำแนะนำในการดำเนินการต่อ:\nหากท่านคาดว่ามีสิ่งของของท่านอยู่ในหมวดหมู่ดังกล่าว กรุณาพิมพ์ระบุรายละเอียดเชิงลึก เช่น "ตามหาโทรศัพท์ที่ตึก 24" หรือเข้าตรวจสอบรูปภาพประกอบหลักฐานได้ที่หน้าเว็บไซต์ Unifind ครับ`;

                    await replyToLine(replyToken, [ { type: 'text', text: summaryReply } ]);
                    continue;
                }

                // 🔍 เคสปกติ: ค้นหาเจาะจงรายชิ้น (SEARCH)
                if (intentData.intent === 'SEARCH') {
                    const extractionPrompt = `วิเคราะห์ข้อความแจ้งของหายต่อไปนี้ แล้วสกัดเอาคีย์เวิร์ด ชื่อสิ่งของ, สถานที่ และ เวลา ออกมาในรูปแบบ JSON ตามโครงสร้างที่กำหนดเท่านั้น 
                    หากไม่มีข้อมูลในส่วนสถานที่หรือเวลา ให้ใส่ค่าเป็นข้อความว่าง "" 
                    ข้อความผู้ใช้: "${userMessage}"`;

                    const aiResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: extractionPrompt,
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    keyword: { type: Type.STRING, description: "ชื่อสิ่งของหลักที่เป็นคำนาม เช่น กระเป๋า, โทรศัพท์, กุญแจ" },
                                    place: { type: Type.STRING, description: "สถานที่ที่ระบุในข้อความ เช่น โรงอาหาร, ตึก 24 ถ้าไม่มีให้เป็นค่าว่าง" },
                                    time: { type: Type.STRING, description: "เวลาที่ระบุในรูปแบบ HH:MM เช่น 10:00 ถ้าไม่มีให้เป็นค่าว่าง" }
                                },
                                required: ["keyword", "place", "time"]
                            }
                        }
                    });

                    const searchData = JSON.parse(aiResponse.text.trim());
                    console.log('🤖 AI สกัด Data ค้นหาสำเร็จ:', searchData);

                    if (!searchData.keyword || searchData.keyword.length < 2) {
                        throw new Error("Not a specific item search");
                    }

                    let searchConditions = {
                        [Op.or]: [
                            { name: { [Op.like]: `%${searchData.keyword}%` } },
                            { description: { [Op.like]: `%${searchData.keyword}%` } }
                        ]
                    };

                    if (searchData.place) {
                        searchConditions.place = { [Op.like]: `%${searchData.place}%` };
                    }

                    const candidateItems = await LostItem.findAll({ where: searchConditions });
                    let isMatched = false;

                    if (searchData.time && candidateItems.length > 0) {
                        const [inputHour, inputMinute] = searchData.time.split(':').map(Number);
                        const inputTotalMinutes = (inputHour * 60) + (inputMinute || 0);

                        for (let item of candidateItems) {
                            const itemDate = new Date(item.createdAt); 
                            const itemHour = itemDate.getHours();
                            const itemMinute = itemDate.getMinutes();
                            const itemTotalMinutes = (itemHour * 60) + itemMinute;

                            const timeDifference = Math.abs(itemTotalMinutes - inputTotalMinutes);
                            if (timeDifference <= 180) { 
                                isMatched = true;
                                break; 
                            }
                        }
                    } else if (!searchData.time && candidateItems.length > 0) {
                        isMatched = true;
                    }

                    // 🎯 เคสค้นหาแล้ว "เจอของ" ในฐานข้อมูล
                    if (isMatched) {
                        const foundPatterns = [
                            `🔍 [ระบบตรวจสอบข้อมูลสำเร็จ]\n\n🎉 แจ้งผลการตรวจสอบ: ตรวจพบข้อมูลสิ่งของเกี่ยวกับ "${searchData.keyword}" ที่มีรายละเอียด วัน เวลา และสถานที่ สอดคล้องกับที่ท่านระบุไว้ในฐานข้อมูลกลางครับ\n\n📌 ขั้นตอนการรับสิ่งของคืน:\nเพื่อความปลอดภัยด้านกรรมสิทธิ์ กรุณาเตรียมหลักฐานการแสดงตน (เช่น บัตรประจำตัวนักศึกษา) พร้อมหลักฐานความเป็นเจ้าของเข้าติดต่อยืนยันตัวตน ณ จุดบริการส่วนกลางของมหาวิทยาลัยเพื่อรับของคืนได้ทันทีครับ`,
                            `🔍 [พบข้อมูลที่เข้าเกณฑ์ในคลังระบบ]\n\n🎉 ระบบตรวจพบรายการประกาศสิ่งของประเภท "${searchData.keyword}" ซึ่งสอดคล้องใกล้เคียงกับข้อมูล วัน เวลา และสถานที่ที่ท่านส่งคำขอสืบค้นเข้ามาครับ\n\n📌 สิ่งที่ต้องดำเนินการต่อ:\nแนะนำให้ท่านนำบัตรประจำตัวนักศึกษาหรือบัตรประชาชน พร้อมหลักฐานยืนยันความเป็นเจ้าของ เข้าติดต่อประสานงาน ณ จุดบริการประชาสัมพันธ์ส่วนกลางของมหาวิทยาลัยได้ทันทีครับ`,
                            `🔍 [ผลการสืบค้นย้อนหลังสำเร็จ]\n\n🎉 แจ้งสถานะระบบ: คลังข้อมูลกลางตรวจพบรายการสิ่งของที่สอดคล้องกับลักษณะ "${searchData.keyword}" ตามพิกัดและช่วงเวลาที่ท่านตามหาครับ\n\n📌 ขั้นตอนถัดไป:\nเพื่อรักษาสิทธิ์ของท่าน กรุณานำบัตรนักศึกษาเข้าไปติดต่อประสานงานและตรวจสอบรูปภาพจริงกับเจ้าหน้าที่ผู้ดูแล ณ จุดบริการรับส่งคืนของหายประจำมหาวิทยาลัยเพื่อดำเนินการรับของคืนได้เลยครับ`
                        ];
                        await replyToLine(replyToken, [{ type: 'text', text: getRandomResponse(foundPatterns) }]);
                        continue;
                    }
                }

                // 💬 6. เคสหาของใน DB ไม่เจอ หรือชวนคุย -> ส่งให้ AI ร่างคำตอบที่สุภาพและสุ่มประโยคสดใหม่
                console.log('💬 เข้าสู่กระบวนการบอทเจเนอเรตคำตอบแบบยืดหยุ่นสูง (High Temperature)');
                const chatbotPrompt = `คุณคือระบบปัญญาประดิษฐ์ช่วยเหลือส่วนกลางของแพลตฟอร์ม Unifind ประจำมหาวิทยาลัยหอการค้าไทย (UTCC)
                ลักษณะนิสัย: สุภาพมาก เป็นทางการ เป็นมืออาชีพ ใช้สรรพนามแทนตัวระบบว่า "ระบบ" หรือ "ทางระบบ" และเรียกผู้ใช้ว่า "ท่าน" ลงท้ายด้วย "ครับ" เสมอ
                สถานการณ์ปัจจุบัน: ระบบตรวจสอบในฐานข้อมูล MySQL แล้ว "ไม่พบข้อมูลสิ่งของที่ตรงกับรายละเอียดโพสต์ที่มีคนเก็บได้ในคลังข้อมูลเลย"
                
                หน้าที่ของคุณ:
                1. กล่าวตอบผู้ใช้อย่างสุภาพและแสดงความเสียใจอย่างเป็นทางการที่สิ่งของเกิดการสูญหาย
                2. แจ้งผลการตรวจสอบอย่างนุ่มนวลและชัดเจนว่ายังไม่พบคนรายงานสิ่งของลักษณะดังกล่าวในคลังคอมมูนิตี้
                3. ให้คำแนะนำอย่างเป็นทางการในการแก้ไขปัญหาต่อไป เช่น ให้ลองติดต่อโต๊ะประชาสัมพันธ์ประจำตึกเรียน, ติดต่อส่วนงานกองกลาง หรือเฝ้าตรวจสอบหน้าเว็บไซต์ Unifind อีกครั้งในภายหลัง
                
                ข้อความที่ผู้ใช้พิมพ์มา: "${userMessage}"
                ตอบกลับกระชับ ไม่เกิน 4-5 บรรทัด สำหรับแสดงผลในหน้าจอแชท LINE:`;

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