# 🗺️ โพยนำเสนอโค้ดสำหรับเปิดโชว์กรรมการ (Presentation Code Cheat Sheet - Backend Edition)

เอกสารนี้ทำหน้าที่เป็น **"พิมพ์เขียวและคู่มือติวโค้ดฝั่ง Backend ของระบบ Unifind แบบละเอียดทุกซอกทุกมุม"** สำหรับใช้อ้างอิงเปิดไฟล์จริงใน VS Code โชว์คณะกรรมการหรือใช้อ่านติวทำความเข้าใจกับเพื่อนร่วมทีมครับ

---

## ⚙️ ส่วนที่ 1: แผนผังระบบและไฟล์ทั้งหมดของ Backend (Backend Folder Structure)

ระบบ Backend พัฒนาบน **Node.js (Express Framework)** ทำหน้าที่เป็นตัวกลางรับส่งข้อมูล (RESTful API), ผสานการทำงานกับฐานข้อมูล Supabase PostgreSQL, ระบบ LINE Messaging API, และระบบ Google Gemini AI โดยแบ่งโครงสร้างไฟล์ดังนี้:

* 📁 **`src/server.js`**: ไฟล์ทางเข้าหลัก (Entry Point) เริ่มต้นเซิร์ฟเวอร์ Express และสร้างบัญชีผู้ดูแลระบบ (Admin Seed)
* 📁 **`src/config/`**: แฟ้มกำหนดค่าเชื่อมต่อฐานข้อมูลและตัวแปรระบบ
  * `supabase.js`: ตัวเชื่อมต่อฐานข้อมูล Supabase Client
  * `localDb.js`: ตัวบันทึกคลังแคชออฟไลน์สำรองในเครื่อง (`local_db.json`)
  * `lineBindings.js`: ตัวบันทึกข้อมูลผูกไอดี LINE และอีเมลนักศึกษาลงไฟล์ (`line_bindings.json`)
* 📁 **`src/middleware/`**: แฟ้มดักกรองคำขอ (Middleware)
  * `authMiddleware.js`: ตัวถอดรหัสความปลอดภัย JWT และบายพาสโทเค็น
  * `uploadMiddleware.js`: ตัวดักจัดเก็บรูปภาพผ่าน Multer ลงโฟลเดอร์ `uploads/`
* 📁 **`src/controllers/`**: แฟ้มประมวลผลฐานข้อมูลตามคำขอเว็บ
  * `authController.js`: การลงทะเบียนและล็อกอินของเจ้าหน้าที่
  * `itemController.js`: ตัวลงคลังของเจอและการเชื่อม AI Matching
  * `lostItemController.js`: ตัวลงคลังของหายและประเมินผล AI Matching
  * `personController.js`: ตัวสร้างประวัตินักศึกษา/บุคคลในระบบ
* 📁 **`src/routes/`**: แฟ้มกำหนดเส้นทางการสัญจรของเครือข่าย API
  * `authRoutes.js`, `itemRoutes.js`, `lostItemRoutes.js`, `masterDataRoutes.js`
  * `lineRoutes.js`: ตัวจัดการ LINE Webhook, คัดแยกประเภทแชท และสกัดข้อมูลด้วย Gemini AI
* 📁 **`src/services/`**: แฟ้มบริการหลักของระบบ
  * `matchingService.js`: ตัวสแกนจับคู่ความคล้ายคลึงของเจอและของหายด้วย AI
* 📁 **`src/utils/`**: แฟ้มเครื่องมืออำนวยความสะดวก
  * `aiHelper.js`: ตัวจัดการเรียก Gemini AI, สลับคีย์สำรองเมื่อจำกัดโควตา และระบบแคชคำตอบ
  * `otpStore.js`: ตัวเก็บรหัส OTP และตั้งค่าหมดเวลา 5 นาที
  * `userSessionStore.js`: ตัวล็อกจำสถานะคุยของแชทบอท LINE OA
  * `rateLimiter.js`: ตัวสกัดกั้นการถล่มข้อความพิมพ์สแปมแชทบอท
  * `emailService.js`: ตัวส่งอีเมลรหัส OTP ด้วยโปรโตคอล SMTP

---

## 🛠️ ส่วนที่ 2: เจาะลึกโค้ดและหมายเลขบรรทัดสำคัญ (Backend Code Walkthrough)

ด้านล่างนี้คือพิกัดไฟล์ หมายเลขบรรทัด และสิปเพ็ตโค้ดจริงที่ใช้ควบคุมแกนกลางของหลังบ้านทั้งหมดครับ:

### 🔌 2.1 ไฟล์ทางเข้าหลักและสร้างบัญชีเริ่มต้น (`server.js`)
* 📁 **ที่อยู่ไฟล์**: [backend/src/server.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/server.js) (บรรทัดที่ 32-69)
* 🔍 **ฟังก์ชันสำคัญ**: `seedAdmin`
* 💡 **คำอธิบายโค้ด**: เมื่อเปิดโปรแกรม ระบบจะสแกนตาราง `users` ใน Supabase หากไม่พบผู้ใช้งานระดับ `ADMIN` อยู่เลย โค้ดส่วนนี้จะเข้ารหัสผ่าน `"admin1234"` ด้วย Bcrypt และสร้างบัญชีแอดมินระบบอัตโนมัติ (Username: `admin` / Email: `admin@utcc.ac.th`)
* **โค้ด**:
```javascript
const seedAdmin = async () => {
  try {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "ADMIN");

    if (error) {
      console.error("⚠️ Error checking admin count in Supabase:", error.message);
      return;
    }

    if (count === 0) {
      const hashedPassword = await bcrypt.hash("admin1234", 8);
      const { error: insertError } = await supabase.from("users").insert({
        username: "admin",
        full_name: "System Admin",
        email: "admin@utcc.ac.th",
        password_hash: hashedPassword,
        role: "ADMIN",
        status: "Active",
      });

      if (insertError) {
        console.error("⚠️ Seeding admin error:", insertError.message);
      } else {
        console.log("👑 Default Admin seeded successfully: admin / admin1234");
      }
    } else {
      console.log("✅ Admin user already exists in Supabase");
    }
  } catch (err) {
    console.error("⚠️ Unexpected seeding error:", err);
  }
};
```

---

### 🔑 2.2 ระบบความปลอดภัยและการบายพาสสิทธิ์เจ้าหน้าที่ (`authMiddleware.js`)
* 📁 **ที่อยู่ไฟล์**: [backend/src/middleware/authMiddleware.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/middleware/authMiddleware.js) (บรรทัดที่ 3-23)
* 🔍 **ฟังก์ชันสำคัญ**: `verifyToken`
* 💡 **คำอธิบายโค้ด**: 
  1. ดึงโทเค็นการยืนยันตัวตนออกจาก Header ที่แนบมากับเบราว์เซอร์
  2. หากโทเค็นที่ได้ตรงกับข้อความบายพาสสำหรับการทดสอบ (`bypass-token-12345` หรือ `mock-token`) จะปล่อยให้ผ่านสิทธิ์ระดับแอดมินทันทีเพื่อป้องกันปัญหาระบบล็อกอินขัดข้องตอนทดลองโปรเจกต์
  3. หากเป็นโทเค็นปกติ จะถอดรหัสด้วย `jwt.verify` เทียบกับคีย์ลับหลังบ้าน `JWT_SECRET`
* **โค้ด**:
```javascript
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  // รองรับโทเค็นพิเศษสำหรับการทดสอบระบบ (Bypass)
  if (token === "bypass-token-12345" || token === "mock-token") {
    req.userId = 1;
    req.userRole = "admin";
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};
```

---

### 📍 2.3 ระบบจับคู่สถานที่จากฐานข้อมูลแบบเรียลไทม์ (`lineRoutes.js`)
* 📁 **ที่อยู่ไฟล์**: [backend/src/routes/lineRoutes.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/routes/lineRoutes.js) (บรรทัดที่ 1155-1182)
* 🔍 **ฟังก์ชันสำคัญ**: `getLocationId`
* 💡 **คำอธิบายโค้ด**: แทนที่จะเขียนรายชื่อสถานที่ล็อกตายตัว (Hardcoded) โค้ดนี้จะไปดึงรายการตึกและสถานที่จริงทั้งหมดจาก Supabase (`locations` table) มาเรียงลำดับความยาวชื่อสถานที่ จากนั้นเปรียบเทียบหาตึกในประโยคที่นักพิมพ์มา หากตึกนั้นตรงกับในฐานข้อมูลจะดึงไอดีสถานที่ไปใช้งานบันทึกข้อมูลทันที
* **โค้ด**:
```javascript
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
        // เรียงลำดับชื่อสถานที่ยาวที่สุดก่อน เพื่อตรวจพบคำที่ระบุเจาะจงได้แม่นยำที่สุด
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
  };
```

---

### 💬 2.4 ระบบจำแนกประโยคและ Intent ของผู้ใช้งานผ่าน AI (`lineRoutes.js`)
* 📁 **ที่อยู่ไฟล์**: [backend/src/routes/lineRoutes.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/routes/lineRoutes.js) (บรรทัดที่ 980-1010)
* 🔍 **ฟังก์ชันสำคัญ**: โฟลว์วิเคราะห์ข้อความแชทบอทใน `handleTextEvent`
* 💡 **คำอธิบายโค้ด**: เมื่อนักศึกษาพิมพ์ข้อความเข้ามา บอทจะเช็ก Regex คำสั่งด่วนก่อน (เช่น "สวัสดี", "ผูกบัญชี", รหัสตัวเลข OTP) หากไม่ใช่คำสั่งตรงตัว ระบบจะป้อนประโยคข้อความดิบเข้าไปถาม Gemini AI ผ่านคำสั่ง `classificationPrompt` เพื่อคัดแยกเจตนาว่านักศึกษาต้องการอะไร:
  * `SUMMARY`: ขอดูรายการของหายทั้งหมดในวันนี้
  * `SEARCH`: กำลังสืบค้นของหายชิ้นใดชิ้นหนึ่ง
  * `REPORT_LOST`: ต้องการลงทะเบียนของหายชิ้นใหม่
  * `CHITCHAT`: พิมพ์ทักทายคุยทั่วไป
* **โค้ด**:
```javascript
    // ป้อนคำสั่ง Prompt เพื่อบังคับโครงสร้างข้อมูลให้ Gemini AI ตอบเป็น JSON สเตท
    const classificationPrompt = `
      You are a classifier for a university Lost and Found Line Bot.
      Given user message, classify intent into one of: 'SUMMARY', 'SEARCH', 'REPORT_LOST', 'CHITCHAT'.
      User message: "${text}"
      Return ONLY valid JSON in format: {"intent": "..."}
    `;
    const response = await aiHelper.generateContentWithFallback(ai, {
      contents: classificationPrompt,
      taskType: "classification"
    });
    // ... ดึงผลลัพธ์ JSON ไปตัดสินใจทิศทางแชทโต้ตอบ
```

---

### ⏱️ 2.5 ระบบความจำสเตทบอทและตาราง OTP 5 นาที (`userSessionStore.js` & `otpStore.js`)
* 📁 **ที่อยู่ไฟล์**: [backend/src/utils/userSessionStore.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/utils/userSessionStore.js) (บรรทัดที่ 3-34) และ [backend/src/utils/otpStore.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/utils/otpStore.js) (บรรทัดที่ 10-26)
* 🔍 **ฟังก์ชันสำคัญ**: `getState` / `setState` (สำหรับสเตทสนทนา) และ `createPending` (สำหรับเวลาหมดอายุ OTP)
* 💡 **คำอธิบายโค้ด**:
  * **ความจำแชท**: ตัวแปร `sessions` ทำตัวเป็นหน่วยความจำสเตทคุย ป้องกันแชทค้างสถานะรอข้ามชั่วโมงด้วยการเคลียร์ตัวเองอัตโนมัติหากไม่มีความเคลื่อนไหวเกิน 30 นาที
  * **ตรรกะ OTP 5 นาที**: เมื่อมีการผูกบัญชี อีเมลและรหัส OTP 6 หลักจะถูกบันทึกลงในหน่วยความจำ พร้อมกำหนดขอบเขตเวลาหมดอายุ โดยการคำนวณจาก `Date.now() + 5 * 60 * 1000` (มีค่าเท่ากับ เวลาปัจจุบันบวกไปอีก 5 นาที)
* **โค้ด OTP**:
```javascript
function createPending(lineUserId, details) {
  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // กำหนดหมดอายุใน 5 นาที (5 นาที * 60 วินาที * 1000 มิลลิวินาที)

  pendingOtps[lineUserId] = {
    email: details.email,
    studentId: details.studentId,
    role: details.role,
    otp: otp,
    expiresAt: expiresAt,
  };
  return otp;
}
```

---

### 🤖 2.6 สมองกลเปรียบเทียบวิเคราะห์จับคู่ความเหมือนสิ่งของ (`matchingService.js`)
* 📁 **ที่อยู่ไฟล์**: [backend/src/services/matchingService.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/services/matchingService.js) (บรรทัดที่ 97-150)
* 🔍 **ฟังก์ชันสำคัญ**: `checkFoundItemMatch`
* 💡 **คำอธิบายโค้ด**: เมื่อมีการเพิ่มสิ่งของพบเจอลงคลัง ระบบจะดึงรายการของหายทั้งหมดที่มีหมวดหมู่เดียวกัน จากนั้นนำคุณลักษณะ (สี, รูปร่าง, ลักษณะพิเศษ) ส่งให้ Gemini AI ช่วยวิเคราะห์ประเมินแบบสอดคล้องเชิงความหมาย (Semantic Similarity) หากได้คะแนนสูงจะดึงข้อมูล LINE ID เพื่อส่ง Push Notification หานักศึกษาโดยอัตโนมัติ
* **โค้ด**:
```javascript
exports.checkFoundItemMatch = async (foundItem) => {
  try {
    console.log(`🔍 Checking matches for Found Item: "${foundItem.item_name}"`);
    
    // ดึงรายการแจ้งของหายในระบบที่กำลังเปิดตามหาเจ้าของ
    const query = supabase
      .from("lost_items")
      .select("*, locations(location_name, floor), reporter:persons(full_name, email, phone)")
      .eq("category_id", foundItem.category_id);
    
    const { data: lostItems, error } = await query;
    if (error) throw error;

    // ... นำรายการของสูญหายมาวิเคราะห์ความเข้ากันได้เทียบกับของที่เก็บได้ด้วย AI
```

---

### 🔄 2.7 ระบบหมุนเวียนกุญแจ AI สำรองแก้โควตาเต็ม (`aiHelper.js`)
* 📁 **ที่อยู่ไฟล์**: [backend/src/utils/aiHelper.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/utils/aiHelper.js) (บรรทัดที่ 7-25, 120-184)
* 🔍 **ฟังก์ชันสำคัญ**: `rotateClient` และ `generateContentWithFallback`
* 💡 **คำอธิบายโค้ด**: อ่านรายชื่อ API Key ของ Gemini จากไฟล์ `.env` ที่คั่นด้วย `,` เข้ามาเก็บไว้ในอาเรย์ หากเกิดข้อผิดพลาดในการประมวลผล `429 (Rate Limit)` ฟังก์ชัน `rotateClient` จะสลับไปใช้คีย์ตัวถัดไปในอาร์เรย์ทันที ทำให้แชทบอทตอบแชทได้ยาวนานและลดปัญหาระบบล่ม
* **โค้ด**:
```javascript
let rawKeys = process.env.GEMINI_API_KEY || "";
let apiKeys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
let clients = apiKeys.map((key) => new GoogleGenAI({ apiKey: key }));
let currentClientIndex = 0;

function rotateClient() {
  if (clients.length <= 1) return;
  const oldIndex = currentClientIndex;
  currentClientIndex = (currentClientIndex + 1) % clients.length;
  console.log(`🔄 [AI Rotation] คีย์เต็มโควตา สลับไปใช้คีย์ลำดับที่ ${currentClientIndex + 1} อัตโนมัติ`);
}
```
