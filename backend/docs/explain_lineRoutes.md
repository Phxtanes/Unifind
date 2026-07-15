# 📖 คำอธิบายการทำงานของโค้ด: `lineRoutes.js` (สบถทีละบรรทัด/ทีละบล็อก)

ไฟล์ `lineRoutes.js` เป็นหัวใจของการควบคุมการเชื่อมต่อทั้งหมดระหว่าง LINE Official Account (LINE OA) กับระบบหลังบ้าน Unifind โดยควบคุมตั้งแต่การถอดสัญญาณ Webhook, การตรวจจำแนก AI ด้วย Gemini และการบันทึกฐานข้อมูล

---

## 📦 1. ส่วนนำเข้าไลบรารีและโมดูล (บรรทัด 1 - 27)

```javascript
1: /** ... JSDoc คำอธิบายไฟล์ ... */
13: const express = require('express');
```
* **บรรทัด 13**: นำเข้าไลบรารี **Express** เพื่อสร้างตัวจัดการเส้นทาง (Router) ของ HTTP Request
```javascript
14: const crypto = require('crypto');
```
* **บรรทัด 14**: นำเข้าโมดูล **crypto** (สร้างขึ้นมาใน Node.js) เพื่อใช้สำหรับการเข้ารหัสและตรวจสอบ Signature ความถูกต้องของ LINE Webhook
```javascript
15: const axios = require('axios');
```
* **บรรทัด 15**: นำเข้า **axios** เพื่อใช้สำหรับยิง HTTP Request ไปยัง API ภายนอก เช่น การส่งข้อความกลับไปยัง LINE Messaging API
```javascript
16: const { GoogleGenAI, Type } = require('@google/genai');
```
* **บรรทัด 16**: นำเข้า **GoogleGenAI** และ **Type** (สำหรับการทำ JSON Schema) เพื่อติดต่อประมวลผลคำพูดและรูปภาพด้วย Google Gemini AI
```javascript
19: const supabase = require('../config/supabase');
```
* **บรรทัด 19**: นำเข้าตัวเชื่อมต่อฐานข้อมูลหลัก **Supabase** (ที่เป็นเวอร์ชัน Wrapper แปลงสัญกรณ์ภาษา)
```javascript
20: const lineBindings = require('../config/lineBindings');
```
* **บรรทัด 20**: นำเข้า **lineBindings** สำหรับบันทึกสถานะการจับคู่ (Binding) ระหว่าง LINE User ID กับอีเมลของผู้ใช้ลงระบบไฟล์คลังท้องถิ่น
```javascript
21: const localDb = require('../config/localDb');
```
* **บรรทัด 21**: นำเข้าคลังแคชข้อมูลออฟไลน์ **localDb** สำหรับกรณีเน็ตภายนอกขัดข้องหรือ Supabase ออฟไลน์
```javascript
24: const aiHelper = require('../utils/aiHelper');
```
* **บรรทัด 24**: นำเข้าฟังก์ชันตัวช่วยระบบ Gemini เพื่อการรันโมเดลสำรอง (Model Fallback) ในกรณีโมเดลหลักขัดข้อง
```javascript
25: const otpStore = require('../utils/otpStore');
```
* **บรรทัด 25**: นำเข้าคลังเก็บรหัส **OTP** เพื่อใช้ยืนยันสิทธิ์ตอนทำรายการผูกบัญชีชั่วคราว
```javascript
26: const emailService = require('../utils/emailService');
```
* **บรรทัด 26**: นำเข้าระบบส่งเมล **emailService** เพื่อยิงรหัสผ่าน OTP ไปยัง Outlook ของนิสิต/เจ้าหน้าที่
```javascript
27: const userSessionStore = require('../utils/userSessionStore');
```
* **บรรทัด 27**: นำเข้าตัวจดจำสเตทบทสนทนา **userSessionStore** (สำหรับเช็กว่าผู้ใช้พิมพ์ตอบข้อมูลอะไรค้างอยู่)

---

## 🛠️ 2. การสร้างอินสแตนซ์และตัวแปรเสริม (บรรทัด 28 - 142)

```javascript
29: const router = express.Router();
```
* **บรรทัด 29**: สร้างโมดูลย่อย Router เพื่อส่งออก (export) ไปให้เซิร์ฟเวอร์หลัก `server.js` เรียกใช้
```javascript
32: const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```
* **บรรทัด 32**: เริ่มต้นสร้าง Client สำหรับเชื่อมต่อ Gemini AI โดยดึงคีย์ API จากสภาพแวดล้อม (`.env`)
```javascript
35: const CATEGORY_MAP = { ... };
```
* **บรรทัด 35 - 57**: กำหนดตารางหมวดหมู่คงที่ (Static Map) สำหรับแปลงไอดีเลขหมวดหมู่จากฐานข้อมูล ออกมาเป็นภาษาไทยเพื่อตอบกลับผู้ใช้ใน LINE OA
```javascript
59: function getCategoryName(categoryId) { ... }
```
* **บรรทัด 59 - 62**: ฟังก์ชันย่อยสำหรับตรวจสอบว่าถ้าระบบส่ง ID หมวดหมู่มา จะได้ชื่อภาษาไทยคำว่าอะไร (หากไม่มีจะระบุเป็น "อื่น ๆ")

---

## 💬 3. ฟังก์ชันตัวช่วยการสื่อสาร LINE API (บรรทัด 143 - 238)

```javascript
144: async function replyToLine(replyToken, messages) { ... }
```
* **บรรทัด 144 - 173**: ฟังก์ชันสำหรับตอบกลับ (Reply Message) หาผู้ใช้แชททันที โดยใช้ `replyToken` ที่ถูกส่งมาคู่กับ LINE Event 
```javascript
175: async function sendLineMessage(toUserId, messages) { ... }
```
* **บรรทัด 175 - 204**: ฟังก์ชันสำหรับส่งข้อความแบบผลัก (Push Message) ไปหาผู้ใช้แบบเจาะจงรายไอดีโดยไม่ต้องรอให้ผู้ใช้พิมพ์ข้อความเข้ามาก่อน
```javascript
206: async function replyWithWelcome(replyToken) { ... }
```
* **บรรทัด 206 - 238**: ฟังก์ชันตอบกลับด่วนเพื่อส่ง **Flex Message ต้อนรับ** และให้คำแนะนำสำหรับผู้ที่กดติดตาม LINE OA เข้ามาเป็นครั้งแรก

---

## 📷 4. การจัดการคำค้นหาด้วยรูปภาพ (บรรทัด 239 - 331)

```javascript
239: async function handleImageEvent(event, bindingInfo, baseUrl) { ... }
```
* **บรรทัด 239**: ฟังก์ชันหลักสำหรับวิเคราะห์รูปภาพสิ่งของที่ผู้ใช้ส่งแชทเข้ามาใน LINE OA
```javascript
243:     const replyToken = event.replyToken;
244:     const messageId = event.message.id;
```
* **บรรทัด 243 - 244**: แกะไอดีข้อความและ replyToken เพื่อใช้ประมวลผล
```javascript
248:     const imageResponse = await axios.get(
249:         `https://api-data.line.me/v2/bot/message/${messageId}/content`,
250:         { ... }
251:     );
```
* **บรรทัด 248 - 251**: ยิง HTTP Get ไปหาเซิร์ฟเวอร์ LINE เพื่อดาวน์โหลดไบนารีรูปภาพ (Buffer) ที่ผู้ใช้ส่งเข้ามา
```javascript
263:     const imageBuffer = Buffer.from(imageResponse.data);
264:     const base64Image = imageBuffer.toString('base64');
```
* **บรรทัด 263 - 264**: แปลงข้อมูลรูปภาพดิบให้กลายเป็นสัญกรณ์ Base64 เพื่อให้ส่งต่อเข้าสู่โมเดลของ Gemini ได้
```javascript
267:     const imagePart = {
268:         inlineData: {
269:             data: base64Image,
270:             mimeType: 'image/jpeg'
271:         }
272:     };
```
* **บรรทัด 267 - 272**: จัดรูปแบบข้อมูลรูปภาพตามสเปกโครงสร้างของ Google GenAI SDK
```javascript
275:     let allItems = [];
276:     try {
277:         const { data: dbItems } = await supabase.from('items').select('*');
...
281:     } catch (dbErr) {
282:         allItems = localDb.getLocalFoundItems();
283:     }
```
* **บรรทัด 275 - 283**: ดึงรายการสิ่งของที่พบทั้งหมด (Found Items) จาก Supabase หากเชื่อมต่อไม่สำเร็จ จะสลับไปหยิบจากไฟล์แคชโลคอลแทน
```javascript
287:     const itemsSummary = allItems.map(item => ({
288:         itemId: item.item_id,
289:         itemName: item.item_name,
290:         description: item.description
291:     }));
```
* **บรรทัด 287 - 291**: กรองคัดเลือกเฉพาะข้อมูลรหัส ชื่อของ และลักษณะสำคัญ เพื่อประหยัด Token ก่อนส่งไปให้ AI ประมวลผล
```javascript
293:     const imageAnalysisPrompt = `วิเคราะห์ภาพนี้เทียบกับข้อมูลของที่มีอยู่...`;
```
* **บรรทัด 293 - 315**: เขียน Prompt สั่งการให้ Gemini ทำตัวเป็นแมตชิ่งโมเดล ค้นหาว่าของในรูปตรงกับรายการสิ่งของในคลังหรือไม่ และให้ตอบกลับเป็นโครงสร้าง JSON เท่านั้น
```javascript
318:     const aiImageResult = await aiHelper.generateContentWithFallback(ai, { ... });
319:     const resultData = JSON.parse(aiImageResult.text.trim());
```
* **บรรทัด 318 - 319**: ยิงคำร้องประมวลผลรูปภาพไปยัง Gemini และทำการ Parse ข้อความ JSON ผลลัพธ์ออกเป็น Object ของ JavaScript
```javascript
323:     if (resultData.match && resultData.itemId) { ... }
```
* **บรรทัด 323 - 331**: ตรวจสอบผลลัพธ์:
  * **ถ้าเจอของหายที่ตรงกัน (Match)**: บอทจะพิมพ์ยินดีด้วย และแจ้งจุดติดต่อของกองกิจการนักศึกษา
  * **ถ้าไม่เจอปฏิกิริยาคู่กัน (No Match)**: บอทจะบอกว่าภาพนี้คือประเภทอะไร แต่ยังไม่มีบันทึกข้อมูลของชิ้นนี้เข้าระบบมา

---

## 🤝 5. ส่วนจัดการบัญชีและการสลับ Intent แชทตัวอักษร (บรรทัด 332 - 440)

```javascript
332: async function handleTextEvent(event, baseUrl) { ... }
```
* **บรรทัด 332**: ฟังก์ชันหลักสำหรับวิเคราะห์ข้อความตัวหนังสือของผู้ใช้ทุกคนในแชท LINE
```javascript
337:     const userMessage = event.message.text.trim();
338:     const lineUserId = event.source.userId;
```
* **บรรทัด 337 - 338**: ดึงข้อความที่พิมพ์ และดึง ID LINE เฉพาะตัวของผู้ใช้มาบันทึกสิทธิ์
```javascript
341:     const isBound = lineBindings.isLineUserBound(lineUserId);
```
* **บรรทัด 341**: เรียกใช้ `lineBindings` เพื่อเช็คว่าไอดี LINE นี้นำไปผูกเข้ากับอีเมลมหาวิทยาลัยเรียบร้อยหรือยัง
```javascript
344:     if (userMessage === 'ผูกบัญชี') { ... }
```
* **บรรทัด 344 - 363**: เช็คประโยคทางลัด:
  * หากพิมพ์ว่า **"ผูกบัญชี"**: ระบบจะแนะนำขั้นตอนการพิมพ์ส่งอีเมลและส่งฟอร์มตัวอย่างกลับไปทันที
```javascript
365:     if (userMessage === 'ยกเลิก') { ... }
```
* **บรรทัด 365 - 380**: หากผู้ใช้พิมพ์ว่า **"ยกเลิก"**: ระบบจะล้างสถานะสเตชันแชทค้างคา (`AWAITING_REPORT_DETAILS`) ของไอดีนี้ทิ้ง และตอบกลับว่ายกเลิกรายการเรียบร้อยแล้ว
```javascript
382:     // ส่วนจัดเก็บข้อมูลแบบ State Machine (กรณีพิมพ์แจ้งความคืบหน้า)
383:     const currentSession = userSessionStore.getState(lineUserId);
384:     if (currentSession === 'AWAITING_REPORT_DETAILS') { ... }
```
* **บรรทัด 382 - 438**: ตรรกะตรวจเช็คว่า ถ้าก่อนหน้านี้ผู้ใช้ได้แจ้งทำของหายไว้ แต่ข้อมูลสั้นเกินไป AI เลยสั่งให้อยู่ในสถานะ **"รอรายละเอียดเพิ่ม"**:
  * เมื่อผู้ใช้พิมพ์ข้อความใหม่เข้ามา ระบบจะนำข้อความนี้ไปรวมกับข้อความเดิม แล้วเรียกฟังก์ชันย่อย `handleReportLostIntent` เพื่อทำการเพิ่มรายการแจ้งของหายในฐานข้อมูลโดยตรง

---

## 🔐 6. การตรวจสอบสิทธิ์การผูกบัญชีและรหัส OTP (บรรทัด 439 - 581)

```javascript
441:     const parsedBinding = parseBindingMessage(cleanMessage);
```
* **บรรทัด 441 - 534**: ตรวจจับรูปแบบข้อความอีเมลที่พิมพ์เข้ามาเพื่อทำการผูกบัญชี:
  * นำข้อความแชทไปสกัดเป็นอีเมลและบทบาท (เช่น นักศึกษา/เจ้าหน้าที่)
  * หากอีเมลถูกต้องและยังไม่เคยผูกบัญชี -> จะสร้างรหัส OTP 6 หลักผ่าน `otpStore.createPending`
  * เรียกใช้ `emailService.sendOtpEmail` เพื่อยิงส่งเมล OTP เข้ากระเป๋าเมลผู้ใช้จริง และแชทบอกรหัสถูกส่งแล้ว
```javascript
536:     if (!isBound) { ... }
```
* **บรรทัด 536 - 580**: กรณีที่ผู้ใช้แชทเข้ามาแต่ยังไม่เคยผูกบัญชี:
  * เช็กว่ารหัสที่พิมพ์มาเป็นตัวเลข 6 หลักตรงกับ OTP ค้างส่งในระบบ (`otpStore.getPending`) หรือไม่
  * **ถ้าตรงกัน**: เรียก `handleBindingCredentials` เพื่อบันทึกความสัมพันธ์ถาวร และเปลี่ยน Rich Menu
  * **ถ้าพิมพ์ตัวอื่น**: แจ้งเตือนสิทธิ์การจำกัดผู้ใช้งานในมหาวิทยาลัยหอการค้าไทย เพื่อคัดกรองบุคลากรภายนอก

---

## 🤖 7. ตัวคัดแยกคำสั่ง Hybrid AI Router (บรรทัด 582 - 808)

เมื่อผู้ใช้ทำการผูกบัญชีผ่านสิทธิ์เรียบร้อยแล้ว ทุกข้อความจะถูกส่งเข้าสู่ตัวจำแนกเจตจำนงด้วย AI (Gemini Classification):

```javascript
583:     try {
584:         const classificationPrompt = `วิเคราะห์ประโยคของผู้ใช้ภาษาไทยต่อไปนี้...`;
593:         const classificationResult = await aiHelper.generateContentWithFallback(ai, { ... });
599:         const intentData = JSON.parse(classificationResult.text.trim());
```
* **บรรทัด 583 - 599**: ส่งข้อความไปหา Gemini และสกัดโครงสร้างตัวแปรเอาท์พุตออกมาเป็น JSON Intent (`SUMMARY`, `SEARCH`, `REPORT_LOST`, `CHITCHAT`)

### A. เคสคำสั่ง "SUMMARY" (สถิติรวมของหายในคลัง)
* **บรรทัด 602 - 649**: คิวรี่ฐานข้อมูล `lost_items` และ `items` เพื่อสรุปนับสถิติจำนวนสิ่งของแยกตามหมวดหมู่ แล้วพิมพ์ตารางรายงานกลับไปทางห้องแชท

### B. เคสคำสั่ง "SEARCH" (สืบค้นและค้นหาของเฉพาะเจาะจง)
* **บรรทัด 651 - 654**: จะส่งต่อรายละเอียดข้อความของผู้ใช้ไปให้ฟังก์ชันย่อย `handleSearchIntent` จัดการต่อ

### C. เคสคำสั่ง "REPORT_LOST" (บันทึกข้อมูลของทำหายชิ้นใหม่)
* **บรรทัด 656 - 681**: เช็กระดับความละเอียดของประโยค เช่น ทำร่มหายที่ไหนเวลาใด หากไม่ละเอียดพอ จะบันทึกสถานะให้รอพิมพ์เพิ่ม แต่หากครบถ้วนแล้ว จะเรียก `handleReportLostIntent` บันทึกลง Supabase ทันที

### D. เคสคำสั่ง "CHITCHAT" (การสนทนาทั่วไป)
* **บรรทัด 683 - 686**: ตอบข้อความทักทายทั่วไป หรือระบายความในใจด้วยบทสนทนาที่เป็นมิตรผ่านฟังก์ชัน `handleChitchatIntent`

---

## 🔍 8. ฟังก์ชันวิเคราะห์ Intent การสืบค้นของหาย (บรรทัด 809 - 959)

```javascript
813: async function handleSearchIntent(dest, userMessage) { ... }
```
* **บรรทัด 813**: ฟังก์ชันสำหรับสืบค้นสิ่งของที่เจ้าหน้าที่เก็บได้ในคลัง (`items`) เพื่อนำมาตอบนักศึกษา
```javascript
815:     const extractionPrompt = `วิเคราะห์ข้อความแจ้งของหายต่อไปนี้ แล้วสกัดเอาคีย์เวิร์ด...`;
817:     const aiResponse = await aiHelper.generateContentWithFallback(ai, { ... });
```
* **บรรทัด 815 - 830**: ส่งข้อมูลเข้า Gemini เพื่อคัดแยกเอาคีย์เวิร์ดสิ่งของ (`keyword`) และสถานที่ (`place`) ออกมา
```javascript
833:     const searchData = JSON.parse(aiResponse.text.trim());
```
* **บรรทัด 833**: แปลงสตริงให้กลายเป็นออบเจกต์ผลลัพธ์
```javascript
844:         const { data: dbItems } = await supabase.from('items')
845:             .select('*, locations(location_name)')
846:             .or(`item_name.ilike.%${searchData.keyword}%,description.ilike.%${searchData.keyword}%`);
```
* **บรรทัด 844 - 846**: คิวรี่ตาราง `items` บน Supabase โดยใช้เงื่อนไข Logical OR ตรวจหาแถวข้อมูลที่ชื่อสิ่งของหรือลักษณะของ มีคำตรงกับคีย์เวิร์ดที่สกัดได้
```javascript
863:     const checkPrompt = `วิเคราะห์ว่าข้อมูลสิ่งของที่พบในฐานข้อมูลชิ้นไหนที่ตรงกับคำค้นหา...`;
```
* **บรรทัด 863 - 889**: ส่งผลลัพธ์ที่ดึงได้จาก DB พร้อมคำถามดั้งเดิมส่งไปให้ Gemini ช่วยตรวจสอบความตรงกันของข้อมูล (Matching Verification) อีกครั้งหนึ่ง
```javascript
915:     if (matchedItems.length > 0) { ... }
```
* **บรรทัด 915 - 959**: สรุปและตอบกลับ:
  * **กรณีเจอของตรง**: บอทจะพิมพ์ตอบรายละเอียดพร้อมสร้าง **Flex Message แสดงรายการของที่ใกล้เคียง** และปุ่มสำหรับการขอคืนของ
  * **กรณีไม่เจอ**: บอทจะแนะนำและแสดงคำร้องสำหรับการพิมพ์ลงทะเบียนบันทึกเป็นผู้ทำของหายแทน

---

## 📝 9. ฟังก์ชันจัดการ Intent การลงทะเบียนแจ้งทำของหาย (บรรทัด 960 - 1133)

```javascript
961: async function handleReportLostIntent(replyToken, userMessage, email, imageUrl = null) { ... }
```
* **บรรทัด 961**: ฟังก์ชันรับข้อมูลแจ้งของหายของนิสิต บันทึกลงตาราง `lost_items` 
```javascript
965:     const aiResponse = await aiHelper.generateContentWithFallback(ai, { ... });
```
* **บรรทัด 965 - 991**: ส่งให้ Gemini วิเคราะห์ประโยคสกัดเป็นตัวแปรโครงสร้างฐานข้อมูล (`item_name`, `category_id`, `description`, `location_id`)
```javascript
1016:         const { data: newLostItem } = await supabase.from('lost_items').insert({ ... }).select().single();
```
* **บรรทัด 1016 - 1056**: บันทึกคำแจ้งทำของหายชิ้นนี้ลงบนฐานข้อมูล Supabase หากระบบออนไลน์อยู่
```javascript
1058:     } catch (dbErr) {
1059:         const savedItem = localDb.saveLocalLostItem({ ... });
```
* **บรรทัด 1058 - 1063**: หากเกิดข้อผิดพลาดในการเขียนลง Supabase จะทำงานในโหมด **Offline Fallback** โดยเซฟลงไฟล์ออฟไลน์โลคอลทันที เพื่อให้บอทไม่พัง
```javascript
1075:     // เข้าสู่ลูปตรวจสอบระบบจับคู่สิ่งของทันที (AI Match Checking)
1076:     const matchResult = await matchingService.checkLostItemMatch(newLostItem || localSavedData);
```
* **บรรทัด 1075 - 1076**: เมื่อบันทึกสำเร็จ ระบบจะเรียกใช้ระบบค้นหาคู่จับคู่อัจฉริยะแบบเรียลไทม์ เพื่อดูว่ามีของชิ้นนี้รออยู่ในคลังอยู่แล้วหรือไม่

---

## 📡 10. Webhook API Endpoint จุดเชื่อมรับสัญญาณ LINE (บรรทัด 1498 - 1555)

```javascript
1501: router.post('/webhook', async (req, res) => { ... })
```
* **บรรทัด 1501**: จุดเปิดรับสัญญาณ HTTP POST จากภายนอกที่ LINE OA จะยิงอีเวนต์ทั้งหมดเข้ามา
```javascript
1505:     if (channelSecret && req.rawBody) {
1506:         const hash = crypto.createHmac('SHA256', channelSecret).update(req.rawBody).digest('base64');
1512:         if (hash !== signature) { return res.status(401).send('Invalid signature'); }
1516:     }
```
* **บรรทัด 1505 - 1516**: ทำการตรวจสอบระบบความปลอดภัยโดยแฮชข้อมูล `rawBody` เทียบกับรหัสลับของชาแนลบอท หากไม่ถูกต้องจะส่งรหัส 401 ปฏิเสธการเข้าถึงทันที
```javascript
1519:     res.sendStatus(200);
```
* **บรรทัด 1519**: ตอบรับสถานะ HTTP 200 กลับไปหา LINE Server ทันทีภายใน 1 วินาที เพื่อไม่ให้ความหน่วงในการรันโมเดล AI ส่งผลให้เกิด Timeout
```javascript
1527:     for (let event of events) { ... }
```
* **บรรทัด 1527 - 1553**: ทำการแกะ Event ในคิวออกมาประมวลผล หากเป็นข้อความรูปภาพจะเรียกใช้ `handleImageEvent` หากเป็นข้อความตัวหนังสือจะเรียกใช้ `handleTextEvent` 
```javascript
1555: module.exports = router;
```
* **บรรทัด 1555**: ส่งออก Router ชุดนี้ให้แอปพลิเคชันหลักเรียกใช้งาน
