const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/webhook', async (req, res) => {
    //ตอบกลับ LINE ทันทีเพื่อป้องกันปัญหา 408 Request Timeout 
    res.sendStatus(200); 

    const events = req.body.events;
    if (!events || events.length === 0) return;

    for (let event of events) {
        // ดักจับเฉพาะข้อความที่เป็นตัวหนังสือ
        if (event.type === 'message' && event.message.type === 'text') {
            const replyToken = event.replyToken;
            const userMessage = event.message.text;

            console.log(`💬 LINE ได้รับข้อความ: ${userMessage}`);

            //ใช้ Axios ยิงสัญญาณข้อความตอบกลับไปหาผู้ใช้
            try {
                await axios.post('https://api.line.me/v2/bot/message/reply', {
                    replyToken: replyToken,
                    messages: [{ type: 'text', text: `ระบบ Unifind ได้รับข้อความ "${userMessage}" ของคุณแล้วค่ะ!` }]
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
    }
});

module.exports = router;