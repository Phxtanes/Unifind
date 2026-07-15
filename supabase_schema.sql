-- ==========================================
-- 🔴 1. DROP EXISTING TABLES AND TYPES
-- ==========================================
-- ลบ Table เก่าทิ้งก่อน โดยเรียงลำดับจาก Table ลูก (ที่มี FK) ไปหา Table แม่
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "items" CASCADE;
DROP TABLE IF EXISTS "lost_items" CASCADE;
DROP TABLE IF EXISTS "locations" CASCADE;
DROP TABLE IF EXISTS "buildings" CASCADE;
DROP TABLE IF EXISTS "found_item_statuses" CASCADE;
DROP TABLE IF EXISTS "lost_item_statuses" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "persons" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- ลบ Table เก่า (ชื่อ PascalCase เผื่อมีอยู่จากสคีมาก่อนหน้า)
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "ItemPhoto" CASCADE;
DROP TABLE IF EXISTS "Claim" CASCADE;
DROP TABLE IF EXISTS "Match" CASCADE;
DROP TABLE IF EXISTS "LostItem" CASCADE;
DROP TABLE IF EXISTS "FoundItem" CASCADE;
DROP TABLE IF EXISTS "Locker" CASCADE;
DROP TABLE IF EXISTS "Location" CASCADE;
DROP TABLE IF EXISTS "Building" CASCADE;
DROP TABLE IF EXISTS "FoundItemStatus" CASCADE;
DROP TABLE IF EXISTS "LostItemStatus" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "Person" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ลบ Enum Types หากมีอยู่แล้ว
DROP TYPE IF EXISTS person_type_enum CASCADE;
DROP TYPE IF EXISTS match_status_enum CASCADE;
DROP TYPE IF EXISTS claim_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS user_status_enum CASCADE;

-- ==========================================
-- 🟢 2. CREATE TABLES
-- ==========================================

-- 1. users
CREATE TABLE "users" (
    user_id   SERIAL PRIMARY KEY,
    username  VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(50)  NOT NULL,
    nickname  VARCHAR(50),
    email     VARCHAR(50)  UNIQUE,
    role      VARCHAR(20)  DEFAULT 'STAFF',
    status    VARCHAR(20)  DEFAULT 'Active'
);

-- 2. persons
CREATE TABLE "persons" (
    person_id   SERIAL PRIMARY KEY,
    person_type VARCHAR(20)  NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    student_id  VARCHAR(50),
    email       VARCHAR(50),
    phone       VARCHAR(20),
    department  VARCHAR(50)
);

-- 3. categories
CREATE TABLE "categories" (
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    description   TEXT,
    is_active     BOOLEAN DEFAULT TRUE
);

-- 4. buildings
CREATE TABLE "buildings" (
    building_id   SERIAL PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT
);

-- 5. locations
CREATE TABLE "locations" (
    location_id   SERIAL PRIMARY KEY,
    location_name VARCHAR(200) NOT NULL,
    building_id   INT REFERENCES "buildings"(building_id) ON DELETE SET NULL,
    floor         NUMERIC,
    description   TEXT,
    is_active     BOOLEAN DEFAULT TRUE
);

-- 6. found_item_statuses
CREATE TABLE "found_item_statuses" (
    status_id      SERIAL PRIMARY KEY,
    status_code    VARCHAR(50)  NOT NULL UNIQUE,
    status_name_th VARCHAR(100) NOT NULL
);

-- 7. lost_item_statuses
CREATE TABLE "lost_item_statuses" (
    status_id      SERIAL PRIMARY KEY,
    status_code    VARCHAR(50)  NOT NULL UNIQUE,
    status_name_th VARCHAR(100) NOT NULL
);

-- 8. items  (unified table แทน FoundItem เดิม)
--    รวมข้อมูลของที่พบ รวมถึงข้อมูลการรับคืน (claimer / claim_date)
CREATE TABLE "items" (
    item_id     SERIAL PRIMARY KEY,
    item_name   VARCHAR(200) NOT NULL,
    category_id INT  REFERENCES "categories"(category_id) ON DELETE SET NULL,
    location_id INT  REFERENCES "locations"(location_id)  ON DELETE SET NULL,
    description TEXT,
    status_id   INT  REFERENCES "found_item_statuses"(status_id) ON DELETE SET NULL,
    locker_id   VARCHAR(50),                             -- รหัส locker (ไม่ใช่ FK เพราะ diagram ระบุเป็น VARCHAR)
    image_url   TEXT,
    found_date  TIMESTAMP WITH TIME ZONE,
    finder_id   INT  REFERENCES "persons"(person_id)    ON DELETE SET NULL,
    claimer_id  INT  REFERENCES "persons"(person_id)    ON DELETE SET NULL,
    claim_date  TIMESTAMP WITH TIME ZONE,
    remark      TEXT,
    created_by  INT  REFERENCES "users"(user_id)        ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. lost_items
CREATE TABLE "lost_items" (
    lost_item_id   SERIAL PRIMARY KEY,
    item_name      VARCHAR(200) NOT NULL,
    category_id    INT  REFERENCES "categories"(category_id)     ON DELETE SET NULL,
    location_id    INT  REFERENCES "locations"(location_id)       ON DELETE SET NULL,
    lost_datetime  TIMESTAMP WITH TIME ZONE,
    description    TEXT,
    status_id      INT  REFERENCES "lost_item_statuses"(status_id) ON DELETE SET NULL,
    image_url      TEXT,
    reporter_id    INT  REFERENCES "persons"(person_id)           ON DELETE SET NULL,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. audit_logs
CREATE TABLE "audit_logs" (
    log_id     SERIAL PRIMARY KEY,
    user_id    INT  REFERENCES "users"(user_id) ON DELETE SET NULL,
    action     VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id  INT          NOT NULL,
    ip_address VARCHAR(45)
);

-- ==========================================
-- 🔵 3. INSERT INITIAL DATA
-- ==========================================

-- เพิ่มผู้ใช้งานเริ่มต้น (Admin)
INSERT INTO "users" (username, password_hash, full_name, email, role, status)
VALUES ('admin', 'admin1234', 'Administrator', 'admin@unifind.local', 'ADMIN', 'Active');

-- เพิ่มอาคารเริ่มต้น
INSERT INTO "buildings" (building_name, description) VALUES
('อาคาร 24 (ตึกใบเรือ)', 'อาคารสัญลักษณ์มหาวิทยาลัยหอการค้าไทย'),
('อาคาร 6', 'อาคารเรียน/คณะบริหารธุรกิจ'),
('โรงอาหารกลาง', 'โรงอาหารหลัก'),
('ห้องสมุด (อาคาร 24 ชั้น 2-4)', 'หอสมุดกลาง');

-- เพิ่มสถานะ found_item_statuses เริ่มต้น
INSERT INTO "found_item_statuses" (status_code, status_name_th) VALUES
('FOUND',    'พบของแล้ว'),
('STORED',   'จัดเก็บในคลัง'),
('MATCHED',  'จับคู่แล้ว'),
('CLAIMED',  'รับคืนแล้ว'),
('RETURNED', 'ส่งมอบคืนแล้ว'),
('EXPIRED',  'หมดอายุ');

-- เพิ่มสถานะ lost_item_statuses เริ่มต้น
INSERT INTO "lost_item_statuses" (status_code, status_name_th) VALUES
('LOST',    'แจ้งของหาย'),
('MATCHED', 'จับคู่แล้ว'),
('CLOSED',  'ปิดรายการ');
