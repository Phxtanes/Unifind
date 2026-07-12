# 🗄️ UniFind - Database Schema

เอกสารนี้อธิบายโครงสร้างฐานข้อมูล (Database Schema) ของระบบ **UniFind** (Lost & Found System) ที่ออกแบบมาเพื่อใช้งานร่วมกับ Supabase (PostgreSQL)

---

## 📌 ภาพรวม (Overview)
ฐานข้อมูลประกอบด้วย 14 ตารางหลัก โดยสามารถแบ่งออกเป็นกลุ่มได้ดังนี้:
1. **ระบบผู้ใช้งาน (Authentication):** `User`
2. **ข้อมูลหลัก (Master Data):** `Person`, `Category`, `Building`, `Location`, `Locker`, `FoundItemStatus`, `LostItemStatus`
3. **ข้อมูลสิ่งของ (Item Data):** `FoundItem`, `LostItem`, `ItemPhoto`
4. **ระบบการจัดการ (Process Data):** `Match`, `Claim`, `AuditLog`

---

## 📝 รายละเอียดแต่ละตาราง (Tables Dictionary)

### 1. User (บัญชีผู้ใช้งานระบบ)
เก็บข้อมูลบัญชีของเจ้าหน้าที่และผู้ดูแลระบบ สำหรับการ Login เข้าสู่ระบบ Staff Portal

| Field | Type | รายละเอียด |
|---|---|---|
| `user_id` | **PK** (BIGINT) | รหัสผู้ใช้ |
| `username` | VARCHAR | ชื่อผู้ใช้สำหรับ Login (*UNIQUE*) |
| `password_hash` | VARCHAR | รหัสผ่านที่เข้ารหัสแล้ว (bcrypt) |
| `full_name` | VARCHAR | ชื่อเจ้าหน้าที่ |
| `email` | VARCHAR | อีเมล |
| `role` | ENUM | สิทธิ์การใช้งาน (`ADMIN`, `STAFF`) |
| `status` | ENUM | สถานะบัญชี (`Active`, `Inactive`) |
| `last_login` | TIMESTAMP | วันเวลาที่เข้าระบบล่าสุด |
| `created_at` | TIMESTAMP | วันที่สร้างบัญชี |
| `updated_at` | TIMESTAMP | วันที่แก้ไขบัญชีล่าสุด |

---

### 2. Person (ผู้ใช้งานทั่วไป / บุคคลที่เกี่ยวข้อง)
เก็บข้อมูลบุคคลที่เกี่ยวข้องกับของ เช่น ผู้พบของ ผู้ทำของหาย

| Field | Type | รายละเอียด |
|---|---|---|
| `person_id` | **PK** (BIGINT) | รหัสบุคคล |
| `person_type` | ENUM | ประเภทบุคคล (`STUDENT`, `STAFF`, `EXTERNAL`) |
| `full_name` | VARCHAR | ชื่อ-นามสกุล |
| `student_id` | VARCHAR | รหัสนักศึกษา (ถ้ามี) |
| `email` | VARCHAR | อีเมล |
| `phone` | VARCHAR | เบอร์โทรศัพท์ |
| `department` | VARCHAR | คณะ / หน่วยงาน |

---

### 3. Category (หมวดหมู่)
เก็บข้อมูลหมวดหมู่สิ่งของ (เช่น เอกสาร, กระเป๋า, เครื่องประดับ)

| Field | Type | รายละเอียด |
|---|---|---|
| `category_id` | **PK** (BIGINT) | รหัสหมวดหมู่ |
| `category_name` | VARCHAR | ชื่อหมวดหมู่ |
| `description` | TEXT | คำอธิบาย |
| `is_active` | BOOLEAN | สถานะการใช้งาน (Default: true) |

---

### 4. Building (อาคาร/ตึก) ⭐ *[NEW]*
เก็บข้อมูลหลักของอาคาร/ตึก เพื่อป้องกันการระบุชื่อตึกซ้ำซ้อน

| Field | Type | รายละเอียด |
|---|---|---|
| `building_id` | **PK** (BIGINT) | รหัสตึก |
| `building_name` | VARCHAR | ชื่อตึก (เช่น อาคาร 24, อาคาร 6) - *UNIQUE* |
| `description` | TEXT | คำอธิบายเพิ่มเติม |
| `is_active` | BOOLEAN | สถานะการใช้งาน |

---

### 5. Location (สถานที่/ห้อง) ⭐ *[UPDATED]*
เก็บข้อมูลสถานที่ย่อยที่เป็นห้องหรือจุดระบุภายในอาคาร

| Field | Type | รายละเอียด |
|---|---|---|
| `location_id` | **PK** (BIGINT) | รหัสสถานที่ |
| `location_name` | VARCHAR | ชื่อสถานที่ (เช่น ห้องเรียน 2402, โรงอาหารหลัก) |
| `building_id` | **FK** (BIGINT) | อ้างอิงตาราง `Building` |
| `description` | TEXT | คำอธิบายเพิ่มเติม |
| `is_active` | BOOLEAN | สถานะการใช้งาน |

---

### 6. Locker (ตู้เก็บของ)
เก็บข้อมูลตู้สำหรับจัดเก็บสิ่งของที่เก็บได้ (มีตู้ที่ 1-12)

| Field | Type | รายละเอียด |
|---|---|---|
| `locker_id` | **PK** (BIGINT) | รหัสตู้เก็บของ |
| `locker_code` | VARCHAR | รหัสหน้าตู้ - *UNIQUE* |
| `location_id` | **FK** (BIGINT) | อ้างอิงตาราง `Location` (ถ้ามี) |
| `status` | VARCHAR | สถานะ (`AVAILABLE`, `IN_USE`, `MAINTENANCE`) |

---

### 7. FoundItemStatus (สถานะสิ่งของที่พบ) ⭐ *[NEW]*
ตาราง lookup เก็บสถานะและรายละเอียดแสดงผลสำหรับสิ่งของที่พบ

| Field | Type | รายละเอียด |
|---|---|---|
| `status_id` | **PK** (BIGINT) | รหัสสถานะ |
| `status_code` | VARCHAR | รหัสสากล (เช่น FOUND, STORED, MATCHED, CLAIMED) - *UNIQUE* |
| `status_name_th` | VARCHAR | คำอธิบายภาษาไทย (แสดงบนเว็บ) |
| `description` | TEXT | รายละเอียดสถานะ |

---

### 8. LostItemStatus (สถานะสิ่งของที่หาย) ⭐ *[NEW]*
ตาราง lookup เก็บสถานะและรายละเอียดแสดงผลสำหรับแจ้งของหาย

| Field | Type | รายละเอียด |
|---|---|---|
| `status_id` | **PK** (BIGINT) | รหัสสถานะ |
| `status_code` | VARCHAR | รหัสสากล (เช่น LOST, MATCHED, CLOSED) - *UNIQUE* |
| `status_name_th` | VARCHAR | คำอธิบายภาษาไทย (แสดงบนเว็บ) |
| `description` | TEXT | รายละเอียดสถานะ |

---

### 9. FoundItem (สิ่งของที่พบ) ⭐ *[UPDATED]*
เก็บข้อมูลสิ่งของที่มีคนเก็บได้และนำมาส่งมอบ

| Field | Type | รายละเอียด |
|---|---|---|
| `found_item_id` | **PK** (BIGINT) | รหัสสิ่งของที่พบ |
| `item_name` | VARCHAR | ชื่อสิ่งของ |
| `category_id` | **FK** (BIGINT) | อ้างอิงตาราง `Category` |
| `location_id` | **FK** (BIGINT) | อ้างอิงตาราง `Location` |
| `floor` | INTEGER | ชั้นที่พบ (เปลี่ยนเป็นตัวเลข) |
| `found_date` | DATE | วันที่พบสิ่งของ |
| `description` | TEXT | รายละเอียด/ตำหนิ |
| `status_id` | **FK** (BIGINT) | อ้างอิงตาราง `FoundItemStatus` |
| `locker_id` | **FK** (BIGINT) | ตู้เก็บของที่จัดเก็บ (`Locker`) |
| `finder_id` | **FK** (BIGINT) | ผู้พบสิ่งของ (`Person`) |

---

### 10. LostItem (สิ่งของที่หาย) ⭐ *[UPDATED]*
เก็บข้อมูลการแจ้งของหาย

| Field | Type | รายละเอียด |
|---|---|---|
| `lost_item_id` | **PK** (BIGINT) | รหัสสิ่งของที่หาย |
| `item_name` | VARCHAR | ชื่อสิ่งของ |
| `category_id` | **FK** (BIGINT) | อ้างอิงตาราง `Category` |
| `location_id` | **FK** (BIGINT) | อ้างอิงตาราง `Location` |
| `floor` | INTEGER | ชั้นที่หาย (เปลี่ยนเป็นตัวเลข) |
| `lost_datetime` | TIMESTAMP | วันเวลาที่คาดว่าหาย |
| `description` | TEXT | รายละเอียด/ตำหนิ |
| `status_id` | **FK** (BIGINT) | อ้างอิงตาราง `LostItemStatus` |
| `reporter_id` | **FK** (BIGINT) | ผู้แจ้งหาย (`Person`) |

---

### 11. Match (การจับคู่)
ตารางเก็บประวัติการจับคู่ระหว่างของที่พบ (Found) และของที่หาย (Lost)

| Field | Type | รายละเอียด |
|---|---|---|
| `match_id` | **PK** (BIGINT) | รหัสการจับคู่ |
| `found_item_id` | **FK** (BIGINT) | อ้างอิงตาราง `FoundItem` |
| `lost_item_id` | **FK** (BIGINT) | อ้างอิงตาราง `LostItem` |
| `match_score` | NUMERIC | คะแนนความเหมือน (จาก AI หรือ Rule-based) |
| `status` | ENUM | สถานะ (`PENDING`, `CONFIRMED`, `REJECTED`) |
| `matched_by` | **FK** (BIGINT) | ผู้ดำเนินการ/ตรวจสอบ (`User`) |
| `remark` | TEXT | หมายเหตุ |

---

### 12. Claim (การรับคืน)
บันทึกประวัติการส่งมอบสิ่งของคืนให้เจ้าของ

| Field | Type | รายละเอียด |
|---|---|---|
| `claim_id` | **PK** (BIGINT) | รหัสการส่งคืน |
| `found_item_id` | **FK** (BIGINT) | อ้างอิงของที่ส่งคืน (`FoundItem`) |
| `claimer_id` | **FK** (BIGINT) | ผู้ที่มารับคืน (`Person`) |
| `claim_date` | DATE | วันที่ทำเรื่องขอรับคืน |
| `return_date` | DATE | วันที่ส่งมอบจริง |
| `status` | ENUM | สถานะ (`CLAIMED`, `RETURNED`, `CANCELLED`) |
| `created_by` | **FK** (BIGINT) | เจ้าหน้าที่ผู้ทำรายการ (`User`) |

---

### 13. ItemPhoto (รูปภาพสิ่งของ)
เก็บข้อมูลรูปภาพของสิ่งของ เพื่อให้ 1 รายการสามารถมีได้หลายรูป

| Field | Type | รายละเอียด |
|---|---|---|
| `photo_id` | **PK** (BIGINT) | รหัสรูปภาพ |
| `item_type` | VARCHAR | ประเภทของ (`FOUND` หรือ `LOST`) |
| `item_id` | **FK** (BIGINT) | รหัสของสิ่งของ (อ้างอิง Found/Lost) |
| `file_url` | TEXT | ลิงก์รูปภาพ |
| `is_primary` | BOOLEAN | เป็นรูปหลักหรือไม่ |

---

### 14. AuditLog (ประวัติการแก้ไข)
เก็บ Log การกระทำต่างๆ ในระบบ เพื่อความปลอดภัยและการตรวจสอบ (Audit)

| Field | Type | รายละเอียด |
|---|---|---|
| `log_id` | **PK** (BIGINT) | รหัส Log |
| `user_id` | **FK** (BIGINT) | เจ้าหน้าที่ที่กระทำ (`User`) |
| `action` | VARCHAR | การกระทำ (เช่น INSERT, UPDATE, DELETE) |
| `table_name` | VARCHAR | ตารางที่มีการแก้ไข |
| `record_id` | BIGINT | รหัสข้อมูลที่มีการแก้ไข |
| `old_value` | JSONB | ข้อมูลก่อนแก้ (JSON) |
| `new_value` | JSONB | ข้อมูลใหม่ (JSON) |
| `ip_address` | VARCHAR | IP ของผู้ใช้ |
