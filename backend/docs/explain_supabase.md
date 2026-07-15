# 📖 คำอธิบายการทำงานของโค้ด: `supabase.js` (ตัวเชื่อมและแปลงคิวรี่ Supabase)

ไฟล์ `supabase.js` ทำหน้าที่สำคัญในด้าน **Database Adapter & Translation Layer** เนื่องจากฐานข้อมูลใหม่เป็นแบบตัวพิมพ์เล็กเชื่อมด้วยขีดล่าง (`snake_case`) แต่โค้ดดั้งเดิมในโปรเจกต์หลายจุดใช้ตัวพิมพ์ใหญ่ผสมพิมพ์เล็ก (`CamelCase` / `PascalCase`) ตัวไฟล์นี้จึงทำหน้าที่เป็น Proxy ในการแปลงไวยากรณ์คำสั่งให้โดยอัตโนมัติ

---

## 🔌 1. การเชื่อมต่อฐานข้อมูลเบื้องต้น (บรรทัด 1 - 21)

```javascript
1: const { createClient } = require("@supabase/supabase-js");
```
* **บรรทัด 1**: นำเข้า SDK หลักของ Supabase
```javascript
5: if (typeof global.WebSocket === "undefined") {
6:   global.WebSocket = require("ws");
7: }
```
* **บรรทัด 5 - 7**: ทำการจำลองออบเจกต์ **WebSocket** สำหรับระบบ Node.js รุ่นเก่าที่ต่ำกว่าเวอร์ชัน 22 เนื่องจากไคลเอนต์ Supabase Realtime มีความจำเป็นต้องใช้อินเตอร์เฟส WebSocket ในการสื่อสาร
```javascript
18: const supabase = createClient(supabaseUrl, supabaseKey);
```
* **บรรทัด 18**: สร้างอินสแตนซ์ Supabase Client หลักด้วย URL และ API Key

---

## 🛡️ 2. ตารางการจับคู่โครงสร้างและโมเดลข้อมูล (บรรทัด 22 - 216)

ในส่วนนี้ประกอบด้วยออบเจกต์การทำ **Mapping** ของโครงสร้างตารางและคอลัมน์ต่าง ๆ:

```javascript
const COLUMN_MAPS = {
  lost_items: {
    LostItemId: "lost_item_id",
    ItemName: "item_name",
    CategoryId: "category_id",
    Description: "description",
    ...
  },
  items: {
    ItemId: "item_id",
    ItemName: "item_name",
    ...
  }
};
```
* **หน้าที่หลัก**: เมื่อโค้ดระบบหลังบ้านเรียกหาตัวแปรแบบ PascalCase เช่น `LostItemId` ระบบจะวิ่งมามองตารางนี้และเปลี่ยนให้เป็นชื่อคอลัมน์จริงในฐานข้อมูลคือ `lost_item_id` ก่อนส่งคำสั่งไปประมวลผลบน Cloud
```javascript
function translateCol(tableName, col) { ... }
function translateRow(tableName, row) { ... }
```
* **หน้าที่หลัก**: ฟังก์ชันย่อยสำหรับสแกนคีย์ของข้อมูลและทำการสลับหน้าตาคีย์ (Translate) ทั้งขากลับและขาไป (ขาอ่านข้อมูลจะสลับเป็น PascalCase กลับมาให้, ขาเขียนข้อมูลจะสลับเป็น snake_case ส่งไป)

---

## ⛓️ 3. คลาส `WrappedQuery` ตัวบันทึกประวัติการเรียกคิวรี่ (บรรทัด 217 - 300)

เนื่องจากคิวรี่ของ Supabase ทำงานแบบห่วงโซ่เมธอด (Method Chaining) เช่น `.select().eq().order()` คลาสนี้จะทำตัวเป็น Proxy ชั่วคราวคอยสะสมคำสั่งไว้ก่อนรันจริง:

```javascript
class WrappedQuery {
  constructor(table) {
    this.table = table;
    this.chain = []; // เก็บอาร์เรย์คำสั่งสะสม
  }
  
  select(cols = "*") {
    this.chain.push({ type: "select", cols });
    return this; // ส่งคืนตัวเองเพื่อทำ Chaining ต่อไปได้
  }
  
  eq(col, val) {
    this.chain.push({ type: "eq", col, val });
    return this;
  }
```
* **หน้าที่หลัก**: สะสมคิวรี่ต่าง ๆ ที่เรียกใช้ ลงไปในอาร์เรย์ `this.chain`
```javascript
  or(filters, opts = null) {
    this.chain.push({ type: "or", filters, opts });
    return this;
  }
```
* **ฟังก์ชันอัปเดตใหม่**: บันทึกคำสั่ง Logical OR ฟิลเตอร์ สำหรับการค้นหาของแบบยืดหยุ่นผ่านข้อความ

---

## 🚀 4. ตรรกะการประมวลผลคิวรี่และแปลงค่าจริง (บรรทัด 301 - 553)

เมื่อห่วงโซ่คำสั่งทำงานเสร็จสิ้นหรือถูกเรียกใช้ในเมธอด `.then()` (ซึ่งตัวแปลภาษา JavaScript จะเรียกใช้โดยอัตโนมัติเมื่อมีการ `await` คิวรี่) คลาสนี้จะเริ่มทำการดึงเอาคำสั่งที่บันทึกไว้ใน `this.chain` ออกมาแปลงและรันบน Supabase จริง:

```javascript
  async then(onfulfilled, onrejected) {
    try {
      // 1. ดึงคำสั่งตัวตั้งต้น (เช่น table)
      let query = supabase.from(dbTable);
      
      // 2. วนลูปแกะคิวรี่ที่สะสมไว้มาทำงานทีละรายการ
      for (const op of this.chain) {
        if (op.type === "select") {
          query = query.select(op.cols);
        } else if (op.type === "eq") {
          query = query.eq(translatedCol, op.val);
        } else if (op.type === "or") {
          query = query.or(op.filters, op.opts || {}); // ฟังก์ชันอัปเดตสำหรับเรียกใช้ OR
        }
      }
      
      // 3. รันคิวรี่จริงไปบนเซิร์ฟเวอร์
      const res = await query;
      
      // 4. แปลงข้อมูลแถวที่ได้รับให้กลายเป็น PascalCase ก่อนส่งคืนผู้ใช้
      const translatedData = translateResult(this.table, res.data);
      return onfulfilled({ data: translatedData, error: null });
    }
  }
```
* **ตรรกะหัวใจสำคัญ**: เมธอด `then` ทำหน้าที่ยิงและรอรับผลลัพธ์จาก Supabase คลาวด์ ทำการดักจับข้อผิดพลาด (Error Handling) และทำการเรียกใช้ฟังก์ชัน `translateResult` เพื่อคืนค่าข้อมูลที่เป็นตัวแปรสไตล์ดั้งเดิมให้กับระบบส่วนอื่น ๆ โดยที่โค้ดส่วนอื่นไม่ต้องแก้ไขตัวแปรตามฐานข้อมูลใหม่
