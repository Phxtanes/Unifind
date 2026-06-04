const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Op } = require('sequelize');
const LostItem = require('../models/LostItem'); // ดึงโมเดลของหายมาใช้
const User = require('../models/User');         // ดึงโมเดลผู้ใช้มาใช้

// ข้อความคู่มือการใช้งานหลัก (สร้างเป็นตัวแปรไว้ใช้ซ้ำได้สะดวก)
const welcomeAndGuideMessage = `ยินดีต้อนรับสู่ระบบ Unifind ค่ะ! ✨ บอทอัจฉริยะช่วยตรวจสอบของหายในมหาวิทยาลัย\n\n🔍 วิธีการค้นหาของหาย (ยืดหยุ่นตามสะดวก):\n👉 พิมพ์ถามภาษาธรรมชาติลอยๆ:\nพิมพ์ -> มีโทรศัพท์หายมั้ยครับ / กุญแจหายค่ะ\n\n👉 พิมพ์แบบระบุสถานที่ หรือเวลา (ช่วยกรองให้แม่นยำขึ้น):\nพิมพ์ -> [ชื่อของ] | [สถานที่] | [เวลา]\n💡 ตัวอย่าง: โทรศัพท์ | โรงอาหาร | 10:00\n\n🔔 วิธีผูกบัญชีรับแจ้งเตือน:\n👉 พิมพ์ "ผูกบัญชี: [อีเมลคุณ]"`;

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
    // ⚡ ตอบกลับ LINE ทันทีภายใน 0.1 วินาที เพื่อป้องกันปัญหา 408 Request Timeout
    res.sendStatus(200); 

    const events = req.body.events;
    if (!events || events.length === 0) return;

    for (let event of events) {
        
        // 🤝 1. ฟีเจอร์เปิดตัวต้อนรับ: ดักจับ Event ตอนผู้ใช้กดเพิ่มเพื่อน หรือปลดบล็อกแชท (Follow Event)
        if (event.type === 'follow') {
            const replyToken = event.replyToken;
            console.log(`👤 มีผู้ใช้กดเพิ่มเพื่อนใหม่ UID: ${event.source.userId}`);
            
            await replyToLine(replyToken, [
                { 
                    type: 'text', 
                    text: `สวัสดีค่ะ ยินดีที่ได้รู้จักนะคะ! 🙏 นุชเป็นบอทผู้ช่วยประจำระบบ Unifind แพลตฟอร์มตามหาของหายและส่งคืนของคอมมูนิตี้ในรั้วมหาวิทยาลัยค่ะ` 
                },
                {
                    type: 'text',
                    text: welcomeAndGuideMessage
                }
            ]);
            continue;
        }

        // 💬 ดักจับกรณีผู้ใช้ส่งข้อความเข้ามา (Message Event)
        if (event.type === 'message' && event.message.type === 'text') {
            const replyToken = event.replyToken;
            const userMessage = event.message.text.trim();
            const lineUserId = event.source.userId;

            console.log(`💬 LINE บอทได้รับข้อความ: ${userMessage} จาก UID: ${lineUserId}`);

            // 🙏 2. ฟีเจอร์ประโยคปิดท้าย: ตรวจจับคำว่า ขอบคุณ
            const thanksKeywords = ['ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบใจ', 'thank', 'thx'];
            const hasThanks = thanksKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

            if (hasThanks) {
                await replyToLine(replyToken, [{
                    type: 'text',
                    text: ` ด้วยความยินดีอย่างยิ่งค่ะ! 🥰 ขอให้คุณได้รับของคืนไว ๆ และมีความสุขกับช่วงเวลาในมหาวิทยาลัยนะคะ หากมีอะไรให้ระบบ Unifind ช่วยเหลือเพิ่มเติม พิมพ์ทักมาได้ตลอดเวลาเลยค่ะ รักษาสุขภาพด้วยนะคะ! 💫`
                }]);
                continue;
            }

            // 🔍 ฟีเจอร์ที่ 3: ระบบค้นหาอัจฉริยะ (ตรวจจับคำว่า "หาย", "ค้นหา" หรือเครื่องหมาย "|")
            const isSearchCommand = userMessage.startsWith('ค้นหา:');
            const hasLostKeyword = userMessage.includes('หาย');
            const hasPipe = userMessage.includes('|');

            if (isSearchCommand || hasLostKeyword || hasPipe) {
                let keyword = '';
                let locationInput = '';
                let timeInput = '';

                // กรณีที่ 1: มาแบบแยกท่อสเปกสูง (เช่น โทรศัพท์ | โรงอาหาร | 10:00)
                if (userMessage.includes('|')) {
                    const cleanMessage = userMessage.startsWith('ค้นหา:') ? userMessage.split('ค้นหา:')[1].trim() : userMessage;
                    const parts = cleanMessage.split('|').map(p => p.trim());
                    
                    keyword = parts[0].replace('มี', '').replace('หายมั้ยครับ', '').replace('หายมั้ยค่ะ', '').replace('หายมั้ย', '').replace('หาย', '').trim();
                    locationInput = parts[1] || '';
                    timeInput = parts[2] || '';
                } else {
                    // กรณีที่ 2: พิมพ์มาเป็นประโยคธรรมชาติลอย ๆ
                    keyword = userMessage
                        .replace('ค้นหา:', '')
                        .replace('มี', '')
                        .replace('หายมั้ยครับ', '')
                        .replace('หายมั้ยค่ะ', '')
                        .replace('หายมั้ย', '')
                        .replace('หายครับ', '')
                        .replace('หายค่ะ', '')
                        .replace('หาย', '')
                        .replace('ไหมครับ', '')
                        .replace('ไหมค่ะ', '')
                        .replace('ไหม', '')
                        .replace('ครับ', '')
                        .replace('ค่ะ', '')
                        .replace('สวัสดีครับ', '')
                        .replace('สวัสดีค่ะ', '')
                        .replace('สวัสดี', '')
                        .trim();
                }

                if (!keyword) {
                    await replyToLine(replyToken, [{ 
                        type: 'text', 
                        text: `🔮 คุณกำลังตามหาของหายอยู่หรือเปล่าคะ? ลองพิมพ์ระบุสิ่งของให้ชัดเจนขึ้น เช่น "มีโทรศัพท์หายไหม" หรือพิมพ์เป็นฟอร์แมต "กระเป๋า | ตึก 24" ได้เลยนะคะ` 
                    }]);
                    continue;
                }

                // เริ่มสร้างเงื่อนไขตรวจสอบฐานข้อมูล MySQL
                let searchConditions = {
                    [Op.or]: [
                        { name: { [Op.like]: `%${keyword}%` } },
                        { description: { [Op.like]: `%${keyword}%` } }
                    ]
                };

                if (locationInput) {
                    searchConditions.place = { [Op.like]: `%${locationInput}%` };
                }

                try {
                    const candidateItems = await LostItem.findAll({ where: searchConditions });
                    let isMatched = false;

                    if (timeInput && candidateItems.length > 0) {
                        const [inputHour, inputMinute] = timeInput.split(':').map(Number);
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
                    } else if (!timeInput && candidateItems.length > 0) {
                        isMatched = true;
                    }

                    if (!isMatched) {
                        await replyToLine(replyToken, [{ 
                            type: 'text', 
                            text: `🙅‍♂️ ไม่พบข้อมูลสิ่งของที่ตรงกับรายละเอียด "${keyword}" ในระบบเลยค่ะ\n\nหากคุณมั่นใจข้อมูล สามารถลองตรวจสอบตัวสะกดใหม่อีกครั้ง หรือเข้าเช็คเพิ่มเติมที่หน้าเว็บไซต์ Unifind นะคะ` 
                        }]);
                        continue;
                    }

                    await replyToLine(replyToken, [{ 
                        type: 'text', 
                        text: `✨ [ระบบ Unifind ค้นพบข้อมูล!] ✨\n\n🎉 ตรวจพบข้อมูลสิ่งของที่เกี่ยวกับ "${keyword}" ที่มีรายละเอียดสอดคล้องใกล้เคียงในระบบคอมมูนิตี้ของเราค่ะ!\n\n📌 สิ่งที่คุณต้องทำ:\nกรุณานำหลักฐานความเป็นเจ้าของเข้าไปติดต่อยืนยันและรับของคืนกับเจ้าหน้าที่ ณ จุดบริการของมหาวิทยาลัยได้เลยค่ะ` 
                    }]);

                } catch (dbError) {
                    console.error('❌ Database Query Error:', dbError);
                    await replyToLine(replyToken, [{ type: 'text', text: `⚠️ เกิดข้อผิดพลาดในระบบฐานข้อมูล กรุณาลองใหม่อีกครั้งในภายหลังค่ะ` }]);
                }
                continue;
            }

            // 🔐 ฟีเจอร์ผูกบัญชีเพื่อรับแจ้งเตือน
            if (userMessage.startsWith('ผูกบัญชี:')) {
                const email = userMessage.split('ผูกบัญชี:')[1].trim();
                const user = await User.findOne({ where: { email: email } });

                if (user) {
                    await replyToLine(replyToken, [{ type: 'text', text: `✅ ผูกบัญชี Unifind กับอีเมล ${email} สำเร็จ! คุณจะได้รับแจ้งเตือนทันทีเมื่อมีคนพบของหายค่ะ` }]);
                } else {
                    await replyToLine(replyToken, [{ type: 'text', text: `❌ ไม่พบอีเมล ${email} ในระบบ Unifind ค่ะ กรุณาตรวจสอบอีกครั้ง` }]);
                }
                continue;
            }

            // 📖 กรณีพิมพ์คำอื่น ๆ ทั่วไป ส่งคู่มือแนะนำกลับไป
            await replyToLine(replyToken, [{ 
                type: 'text', 
                text: welcomeAndGuideMessage
            }]);
        }
    }
});

module.exports = router;