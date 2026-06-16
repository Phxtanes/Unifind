# Unifind - System Overview & Tech Stack

ไฟล์นี้สร้างขึ้นเพื่อให้ AI Assistant ใช้เป็น Context ในการทำความเข้าใจระบบและ Tech Stack ของโปรเจกต์ **Unifind** สำหรับการถาม-ตอบ หรือเขียนโค้ดในครั้งต่อๆ ไป

## 📌 ภาพรวมของระบบ (System Overview)
**Unifind** คือระบบปิดสำหรับบริหารจัดการสิ่งของสูญหายและตามหาเจ้าของ (Lost and Found System) พัฒนาขึ้นสำหรับใช้ในสถาบันการศึกษา (เช่น มหาวิทยาลัยหอการค้าไทย - UTCC) 
เพื่อให้เจ้าหน้าที่สามารถจัดการของหาย บันทึกข้อมูล ค้นหา และส่งคืนได้อย่างเป็นระบบ 
*ระบบเป็นแบบ Staff-Only Portal ที่ต้องให้ Admin อนุมัติสิทธิ์ก่อนจึงจะเข้าใช้งานได้*

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### 🎨 Frontend (หน้าบ้าน)
อยู่ในโฟลเดอร์ `/frontend`
- **Core Framework:** Nuxt 3 & Vue 3 (ใช้ Composition API รูปแบบ `<script setup>`)
- **Styling:** TailwindCSS
- **State Management:** Pinia (สำหรับจัดการ State และ Auth)
- **HTTP Client:** Axios
- **Date Management:** Day.js

### ⚙️ Backend (หลังบ้าน)
อยู่ในโฟลเดอร์ `/backend`
- **Core Framework:** Node.js & Express.js (REST API)
- **Database Engine:** Supabase (PostgreSQL) - โปรเจกต์ได้ทำการย้ายฐานข้อมูลมาใช้ Supabase เป็นหลัก
- **Database Client:** `@supabase/supabase-js` (โค้ดเก่าที่เป็น Sequelize และ MySQL ยังมีหลงเหลือในโปรเจกต์แต่ไม่ได้ใช้งานหลักแล้ว)
- **Authentication & Security:** 
  - `jsonwebtoken` (JWT) สำหรับระบบ Login และป้องกัน API Route
  - `bcryptjs` สำหรับแฮชรหัสผ่าน
- **File Upload:** `multer` (จัดการอัปโหลดรูปภาพสิ่งของ)
- **Real-time & AI (ฟีเจอร์เพิ่มเติม):**
  - `@google/genai` (เชื่อมต่อกับ Google Gemini AI)
  - `@supabase/supabase-js` (บริการเพิ่มเติมจาก Supabase)
  - `ws` (WebSockets สำหรับการสื่อสารแบบ Real-time)

### 🐳 Infrastructure & Deployment
- **Containerization:** Docker & Docker Compose
- รันผ่าน `docker-compose up --build -d` ซึ่งประกอบด้วย 3 Services:
  1. Frontend Service (Nuxt 3)
  2. Backend Service (Express API)
  3. Database Service (MySQL)

## 📁 โครงสร้างโปรเจกต์ที่สำคัญ (Key Directories)
- `/frontend/pages/` - หน้า UI ต่างๆ
- `/frontend/store/` หรือ `/frontend/stores/` - Pinia State
- `/backend/src/controllers/` - Logic การทำงานของ API ต่างๆ
- `/backend/src/models/` - (โค้ดเก่า Sequelize Models ที่ไม่ได้ใช้งานหลักแล้ว)
- `/backend/src/routes/` - Express Router
- `/uploads/` - โฟลเดอร์สำหรับเก็บไฟล์รูปภาพที่อัปโหลด (จัดเก็บในฝั่ง Backend)

## 💡 แนวทางปฏิบัติสำหรับ AI (AI Instructions)
- **Frontend:** เขียนโค้ดด้วย Vue 3 Composition API เสมอ และตกแต่ง UI ด้วย TailwindCSS 
- **Backend:** การจัดการฐานข้อมูลให้ใช้ **Supabase Client (`supabase-js`)** เป็นหลัก และควรครอบ API ที่สำคัญด้วย Middleware ตรวจสอบ JWT
- **General:** ทุกครั้งที่มีการเพิ่ม Package หรือเปลี่ยน Config อย่าลืมตรวจสอบผลกระทบกับการทำงานบน Docker ด้วย
