# 🔍 Unifind - Lost & Found Management System

**Unifind** คือระบบปิดสำหรับบริหารจัดการสิ่งของสูญหายและตามหาเจ้าของ (Lost and Found System) พัฒนาขึ้นโดยเฉพาะสำหรับใช้ในสถาบันการศึกษาเพื่ออำนวยความสะดวกในการจัดเก็บ ค้นหา ส่งคืน และบันทึกข้อมูลสิ่งของของหายอย่างเป็นระบบ ดำเนินงานโดยเจ้าหน้าที่ของมหาวิทยาลัยโดยตรง

---

## ✨ คุณสมบัติของระบบ (Key Features)

*   👥 **Staff-Only Portal (ระบบปิด):** ปิดฟังก์ชันการสมัครสมาชิกสำหรับบุคคลทั่วไป โดยจะให้เจ้าหน้าที่ผ่านการลงทะเบียนแบบมีขั้นตอนรอแอดมินอนุมัติสิทธิ์ (Admin Approval) เท่านั้น เพื่อความปลอดภัยของข้อมูลสิ่งของสูญหาย
*   📊 **Real-time Stats Dashboard:** แดชบอร์ดสรุปสถิติจำนวนสิ่งของแบบเรียลไทม์ (ทั้งหมด, กำลังตามหา, เก็บไว้ในคลัง, ส่งคืนแล้ว)
*   🔎 **Search & Multi-Filters:** ระบบค้นหาสิ่งของด้วยคีย์เวิร์ด (ชื่อ, รายละเอียด, สถานที่) และคัดกรองตามแถบแท็บสถานะได้รวดเร็ว
*   📝 **Dynamic Creation Modal:** หน้าต่างบันทึกข้อมูลสิ่งของหายรูปแบบป๊อปอัป (Modal) สะดวกในการทำงานด่วน พร้อมรองรับการอัปโหลดไฟล์รูปภาพ, ข้อมูลผู้เก็บได้ (เบอร์โทร, อีเมล, สถานะ), หมายเลขตู้ล็อกเกอร์ และรายละเอียดครบวงจร
*   🔄 **Quick Status Transition:** ช่องอัปเดตสถานะของแบบด่วนบนการ์ดสิ่งของ (เช่น ส่งคืนของให้เจ้าของแล้ว ➡️ บันทึกชื่อผู้รับ ➡️ อัปเดตเข้าระบบทันที)
*   👑 **User Management (Admin Panel):** แผงควบคุมสิทธิ์สำหรับ Admin สูงสุดในการตรวจสอบพนักงาน อนุมัติการเข้าใช้งาน (Approve) ระงับการใช้งานชั่วคราว (Deactivate) หรือลบบัญชีออกถาวร
*   ⚡ **Bypass Safe Mode:** โหมดทดสอบระบบแบบไม่ต้องเชื่อมต่อฐานข้อมูลจริง (ใช้งานผ่านข้อมูลจำลองแบบสมจริง) เพื่อความสะดวกรวดเร็วในการตรวจสอบสไตล์ UI

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### **Frontend (หน้าบ้าน)**
*   **Nuxt 3** & **Vue 3** (Composition API, Script Setup)
*   **Pinia** (State Management สำหรับระบบตรวจสอบสิทธิ์)
*   **TailwindCSS** (สำหรับการตกแต่งสไตล์ที่ทันสมัย สวยงาม และ Responsive)
*   **Axios** (สำหรับเชื่อมโยงยิง APIs)
*   **Day.js** (จัดการรูปแบบวันที่พบเจอของหาย)

### **Backend (หลังบ้าน)**
*   **Node.js** & **Express.js** (REST API)
*   **Sequelize ORM** (จัดการฐานข้อมูล MySQL)
*   **jsonwebtoken (JWT)** (ควบคุมการยืนยันตัวตนและการเข้าถึง API ปลอดภัย)
*   **bcryptjs** (เข้ารหัสรหัสผ่านอย่างปลอดภัยก่อนบันทึก)
*   **multer** (จัดเก็บภาพถ่ายสิ่งของขึ้นเซิร์ฟเวอร์)

### **Database & Infrastructure**
*   **MySQL 8.0** (ฐานข้อมูลความสัมพันธ์)
*   **Docker & Docker Compose** (สำหรับการคอนเทนเนอร์แยกบริการ ทำงานสะดวกทุกระบบปฏิบัติการ)

---

## 🚀 ขั้นตอนการติดตั้งและรันระบบ (Setup & Installation)

ตรวจสอบให้แน่ใจว่าคุณได้ติดตั้ง **Docker Desktop** ไว้บนเครื่องคอมพิวเตอร์ของคุณแล้ว

### **1. โคลนโครงการ (Clone Repository)**
```bash
git clone https://github.com/Phxtanes/Unifind.git
cd Unifind
```

### **2. สร้างไฟล์การตั้งค่าระบบ (.env)**
สร้างไฟล์ชื่อ **`.env`** ไว้ที่โฟลเดอร์ Root ของโปรเจกต์ (โฟลเดอร์เดียวกับ `docker-compose.yml`) และกรอกข้อความต่อไปนี้:
```env
DB_HOST=mysql_db
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=lost_and_found
JWT_SECRET=supersecretjwtkey123
```

### **3. สั่งรันระบบผ่าน Docker**
เปิด Terminal ที่โฟลเดอร์ Root ของโครงการแล้วสั่งคิวรีสร้าง Container ทั้งหมด:
```bash
docker-compose up --build -d
```
*ระบบจะเริ่มดาวน์โหลดและจัดตั้ง 3 ส่วนงาน (`lost_found_db`, `lost_found_backend`, `lost_found_frontend`) ให้อัตโนมัติในพื้นหลัง*

---

## 💻 พอร์ตบริการต่างๆ (Accessing the Services)

เมื่อรันระบบเรียบร้อยแล้ว คุณสามารถเข้าใช้งานบริการต่างๆ บนหน้าจอเบราว์เซอร์ได้ทันที:

| บริการ (Service) | ช่องทางเข้าใช้ (URL) | รายละเอียด |
| :--- | :--- | :--- |
| 🖥️ **Frontend Nuxt 3** | [http://localhost:9000](http://localhost:9000) | หน้าเว็บหลักของเจ้าหน้าที่ |
| ⚙️ **Backend REST APIs** | [http://localhost:9001/api](http://localhost:9001/api) | พอร์ตรับคำสั่ง APIs เชื่อมต่อหลังบ้าน |
| 🗄️ **MySQL Database** | Host: `127.0.0.1` \| Port: `3306` | เชื่อมต่อผ่าน MySQL Workbench (รหัสผ่าน: `rootpassword`) |

---

## 🔑 บัญชีเข้าใช้งานสำหรับทดสอบระบบ (Test Credentials)

ระบบหลังบ้านได้ตั้งระบบจำลองสิทธิ์แอดมินสูงสุดไว้ให้คุณเข้าใช้งานได้ทันทีเมื่อเปิดระบบเป็นครั้งแรก:

*   **ชื่อผู้ใช้ (Username):** `admin`
*   **รหัสผ่าน (Password):** `admin1234`
*   **อีเมล (Email):** `admin@utcc.ac.th`

---

## ✍️ สำหรับพัฒนาและแก้ไขโค้ดเพิ่มเติม (Local Development & VSCode Fix)

หากต้องการเปิดพัฒนาโค้ดบนเครื่องคอมพิวเตอร์ของคุณ แล้วโปรแกรมอย่าง VSCode ฟ้องขีดเส้นใต้แดง (TypeScript Error) หรือไม่เจอ Auto-imports แก้ได้ด้วยวิธีดังนี้:

1. เปิด Terminal เข้าไปที่โฟลเดอร์หน้าบ้าน:
   ```bash
   cd Unifind_Front
   ```
2. ติดตั้งแพ็กเกจภายในเครื่อง:
   ```bash
   npm install
   ```
3. สั่งให้ Nuxt เชื่อมประเภทข้อมูล Type Definitions:
   ```bash
   npx nuxi prepare
   ```
4. กด `Ctrl + Shift + P` เลือก **`Developer: Reload Window`** เพื่อรีเซตหน้าต่าง VSCode เส้นแดงทั้งหมดจะหายไปและพร้อมเขียนโค้ดต่อได้ทันทีครับ!

---

## 📁 โครงสร้างโปรเจกต์ (Project Directory)

```text
/ (Root)
├── docker-compose.yml
├── .env
├── README.md
├── Unifind_Back/ (Backend)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── config/ (ฐานข้อมูล)
│       ├── controllers/ (Logic ควบคุมการทำงาน)
│       ├── middleware/ ( JWT & Admin เช็คสิทธิ์)
│       ├── models/ (Sequelize Schema: User, LostItem)
│       └── server.js (แอดมินจำลอง + รันแอปพลิเคชัน)
└── Unifind_Front/ (Frontend)
    ├── Dockerfile
    ├── package.json
    ├── nuxt.config.ts ( watch polling ป้องกัน HMR ชนกันบน Docker)
    ├── assets/ ( ดีไซน์และ main.css จาก backup)
    ├── pages/ ( index และ dashboard หลัก)
    ├── stores/ ( Pinia auth)
    └── tsconfig.json ( Type auto-imports)
```

---

*พัฒนาขึ้นภายใต้ลิขสิทธิ์ของ สำนักกิจการนักศึกษา มหาวิทยาลัยหอการค้าไทย (UTCC)* 🎓🔍
