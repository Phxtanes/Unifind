# 🗄️ UniFind - Database Schema

เอกสารนี้อธิบายโครงสร้างฐานข้อมูล (Database Schema) ของระบบ **UniFind** (Lost & Found System) ที่ออกแบบมาเพื่อใช้งานร่วมกับ Supabase (PostgreSQL)

---

## 📌 ภาพรวม (Overview)
ฐานข้อมูลประกอบด้วย 11 ตารางหลัก โดยสามารถแบ่งออกเป็นกลุ่มได้ดังนี้:
1. **ระบบผู้ใช้งาน (Authentication):** `User`
2. **ข้อมูลหลัก (Master Data):** `Person`, `Category`, `Location`, `Locker`
3. **ข้อมูลสิ่งของ (Item Data):** `FoundItem`, `LostItem`, `ItemPhoto`
4. **ระบบการจัดการ (Process Data):** `Match`, `Claim`, `AuditLog`

---

## 📝 รายละเอียดแต่ละตาราง (Tables Dictionary)

### 1. User (บัญชีผู้ใช้งานระบบ) ⭐ *[NEW]*
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

**รายละเอียดสิทธิ์ (Role):**
- **ADMIN:** จัดการผู้ใช้งาน, ดูรายงานทั้งหมด, แก้ไขข้อมูลได้ทุกอย่าง
- **STAFF:** บันทึกของที่พบ, บันทึกของหาย, คืนสิ่งของ, ค้นหาข้อมูล

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

### 3. Category (หมวดหมู่)
เก็บข้อมูลหมวดหมู่สิ่งของ (เช่น เอกสาร, กระเป๋า, เครื่องประดับ)

| Field | Type | รายละเอียด |
|---|---|---|
| `category_id` | **PK** (BIGINT) | รหัสหมวดหมู่ |
| `category_name` | VARCHAR | ชื่อหมวดหมู่ |
| `description` | TEXT | คำอธิบาย |
| `is_active` | BOOLEAN | สถานะการใช้งาน (Default: true) |

### 4. Location (สถานที่)
เก็บข้อมูลสถานที่หลักที่เป็นอาคาร/ตึกภายในมหาวิทยาลัย

| Field | Type | รายละเอียด |
|---|---|---|
| `location_id` | **PK** (BIGINT) | รหัสสถานที่ |
| `location_name` | VARCHAR | ชื่อตึก/อาคาร (เช่น ตึก 1 ถึง ตึก 24) |
| `description` | TEXT | คำอธิบายเพิ่มเติม |

### 5. Locker (ตู้เก็บของ)
เก็บข้อมูลตู้สำหรับจัดเก็บสิ่งของที่เก็บได้ (มีตู้ที่ 1-12)

| Field | Type | รายละเอียด |
|---|---|---|
| `locker_id` | **PK** (BIGINT) | รหัสตู้เก็บของ |
| `locker_code` | VARCHAR | รหัสหน้าตู้ (เช่น ล็อกเกอร์ที่ 1 ถึง ล็อกเกอร์ที่ 12) - *UNIQUE* |
| `location_id` | **FK** (BIGINT) | อ้างอิงตาราง `Location` (ถ้ามี) |
| `status` | VARCHAR | สถานะ (`AVAILABLE`, `IN_USE`, `MAINTENANCE`) |

### 6. FoundItem (สิ่งของที่พบ)
เก็บข้อมูลสิ่งของที่มีคนเก็บได้และนำมาส่งมอบ

| Field | Type | รายละเอียด |
|---|---|---|
| `found_item_id` | **PK** (BIGINT) | รหัสสิ่งของที่พบ |
| `item_name` | VARCHAR | ชื่อสิ่งของ |
| `category_id` | **FK** (BIGINT) | อ้างอิงตาราง `Category` |
| `location_id` | **FK** (BIGINT) | อ้างอิงสถานที่พบ (`Location`) |
| `floor` | VARCHAR | ชั้นที่พบ (กรอกเอง) |
| `found_date` | DATE | วันที่พบสิ่งของ |
| `description` | TEXT | รายละเอียด/ตำหนิ |
| `status` | ENUM | สถานะ (`FOUND`, `STORED`, `MATCHED`, `CLAIMED`, `RETURNED`, `EXPIRED`) |
| `locker_id` | **FK** (BIGINT) | ตู้เก็บของที่จัดเก็บ (`Locker`) |
| `finder_id` | **FK** (BIGINT) | ผู้พบสิ่งของ (`Person`) |

### 7. LostItem (สิ่งของที่หาย)
เก็บข้อมูลการแจ้งของหาย

| Field | Type | รายละเอียด |
|---|---|---|
| `lost_item_id` | **PK** (BIGINT) | รหัสสิ่งของที่หาย |
| `item_name` | VARCHAR | ชื่อสิ่งของ |
| `category_id` | **FK** (BIGINT) | อ้างอิงตาราง `Category` |
| `location_id` | **FK** (BIGINT) | อ้างอิงสถานที่หาย (`Location`) |
| `floor` | VARCHAR | ชั้นที่หาย (กรอกเอง) |
| `lost_datetime` | TIMESTAMP | วันเวลาที่คาดว่าหาย |
| `description` | TEXT | รายละเอียด/ตำหนิ |
| `status` | ENUM | สถานะ (`LOST`, `MATCHED`, `CLOSED`) |
| `reporter_id` | **FK** (BIGINT) | ผู้แจ้งหาย (`Person`) |

### 8. Match (การจับคู่)
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

### 9. Claim (การรับคืน)
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

### 10. ItemPhoto (รูปภาพสิ่งของ)
เก็บข้อมูลรูปภาพของสิ่งของ เพื่อให้ 1 รายการสามารถมีได้หลายรูป

| Field | Type | รายละเอียด |
|---|---|---|
| `photo_id` | **PK** (BIGINT) | รหัสรูปภาพ |
| `item_type` | VARCHAR | ประเภทของ (`FOUND` หรือ `LOST`) |
| `item_id` | **FK** (BIGINT) | รหัสของสิ่งของ (อ้างอิง Found/Lost) |
| `file_url` | TEXT | ลิงก์รูปภาพ |
| `is_primary` | BOOLEAN | เป็นรูปหลักหรือไม่ |

### 11. AuditLog (ประวัติการแก้ไข)
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

---

*เอกสารนี้ถูกสร้างขึ้นเพื่อใช้ประกอบการพัฒนาโปรเจกต์ UniFind*
