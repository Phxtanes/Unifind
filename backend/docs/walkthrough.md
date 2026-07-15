# 🛠️ Walkthrough - แก้ไขบั๊กบอทค้นหาของหายไม่พบ (Supabase Proxy Wrapper Fix)

จากการสืบสวนหาสาเหตุที่บอท LINE OA ไม่สามารถสืบค้นสิ่งของที่พบคืนได้ ทั้งที่มีข้อมูลอยู่ในฐานข้อมูลคลาวด์ Supabase (เช่น "กระบอกน้ำเก็บความเย็นสีพาสเทล") เราได้พบบั๊กร้ายแรงในระดับ Proxy Database Wrapper และแก้ไขเรียบร้อยแล้วครับ

---

## 🔍 สาเหตุของปัญหา (Root Cause)
1. **คิวรี่ค้นหาจาก LINE Bot**: ในไฟล์ [lineRoutes.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/routes/lineRoutes.js) บอทจะทำการสืบค้นโดยระบุเงื่อนไขค้นหาชื่อสิ่งของหรือคำอธิบายคู่กัน โดยใช้คำสั่ง `.or()` เพื่อทำ logical OR:
   ```javascript
   let query = supabase.from('FoundItem').select('*, Location(*)').in('status', ['FOUND', 'STORED']);
   const orFilter = `item_name.ilike.%${searchData.keyword}%,description.ilike.%${searchData.keyword}%`;
   query = query.or(orFilter);
   ```
2. **คลาส Wrapper ขาดคำสั่ง**: ตัวแปลงคิวรี่ Proxy [supabase.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/config/supabase.js) (`WrappedQuery` class) **ไม่ได้ประกาศเมธอด `.or()` ไว้** ส่งผลให้เมื่อบอททำงานจริงจะเกิดข้อผิดพลาดประเภท `TypeError: query.or is not a function`
3. **การตกเข้าสู่ Fallback เปล่า**:
   * เมื่อเกิด Exception ขึ้น ตัวระบบบอทจะถูกสลับเข้าสู่โหมด `catch (err)` และพยายามอ่านแคชชั่วคราวจากไฟล์ท้องถิ่น [local_db.json](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/uploads/local_db.json) แทน
   * เนื่องจากในไฟล์แคชท้องถิ่น (Local DB) มีของหายจำลองเพียง 2 ชิ้นหลัก (ไม่มีกระบอกน้ำหรือแว่นตาที่เพิ่งแอดเข้ามาบนคลาวด์) บอทจึงตอบกลับผู้ใช้เสมอว่า *"ไม่พบสิ่งของลักษณะนี้ในระบบคลัง"* 

---

## 🛠️ รายละเอียดการแก้ไขโค้ด (Proposed Changes)

เราได้ทำการอัปเดตไฟล์ [supabase.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/config/supabase.js) สองจุดหลัก เพื่อรองรับคำสั่งค้นหาแบบ `.or()` ของระบบ:

```diff
+// 1. เพิ่มเมธอด or เข้าไปใน WrappedQuery Class เพื่อรองรับการเก็บเงื่อนไขใน Chain
+  or(filters, opts = null) {
+    this.chain.push({ type: "or", filters, opts });
+    return this;
+  }

 // 2. นำเงื่อนไข or มายิงคำสั่งใน Postgrest Builder ของ Supabase จริง (พร้อมดักกรณี options เป็น null เพื่อเลี่ยง TypeError ใน postgrest-js)
         } else if (op.type === "ilike") {
           query = query.ilike(translatedCol, op.val);
+        } else if (op.type === "or") {
+          query = query.or(op.filters, op.opts || {});
         } else if (op.type === "order") {
```

---

## 🧪 ผลการทดสอบและยืนยันความถูกต้อง (Verification Results)
เราได้เขียนสคริปต์ยิงทดสอบแบบ OR Query จริงผ่านหลังบ้านหลังจากทำการแก้โค้ดเสร็จสิ้น:
* **คีย์เวิร์ดที่ใช้ทดสอบ**: `"กระบอกน้ำ"`
* **ผลลัพธ์**: ตัวคิวรี่ทำงานได้อย่างสมบูรณ์แบบ สามารถดึงข้อมูล **"กระบอกน้ำเก็บความเย็นสีพาสเทล"** (ID: 38) ออกมาจาก Supabase บนคลาวด์พร้อมแนบพารามิเตอร์สถานที่ (`Location`) และ ล็อกเกอร์ที่จัดเก็บมาแสดงผลได้อย่างไม่มีการแจ้งเตือน Error อีกต่อไป

---

## 🛡️ ฟีเจอร์เพิ่มเติมเพื่อความเสถียรและการเดโม (New Stability Features)

จากการพัฒนาและทดสอบเพิ่มเติมร่วมกับผู้ใช้งาน เราได้ทำการอัปเดตระบบหลังบ้านเพิ่มอีก 3 จุดสำคัญ เพื่อให้มั่นใจว่าการพรีเซนต์ในวันที่ 16 กรกฎาคมนี้จะไม่มีข้อผิดพลาด:

### 1. การกู้คืนโค้ดดั้งเดิมกลับสู่สภาวะเสถียร (Code Restoration)
* กู้คืนระบบคิวรี่ใน [supabase.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/config/supabase.js) ให้มีคลาส Wrapper ครบถ้วน 553 บรรทัดตามเดิม
* กู้คืนระบบอีเมลข้ามสแปมฟิลเตอร์ใน [emailService.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/utils/emailService.js) ให้พร้อมส่งอีเมล OTP ไปยัง Outlook ของมหาวิทยาลัยหอการค้าไทยได้อย่างสมบูรณ์

### 🔄 2. ระบบสลับคีย์ API อัตโนมัติ (API Key Rotation & Hot-Reload)
* แก้ไข [aiHelper.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/utils/aiHelper.js) ให้ตรวจจับคำร้องขอ AI หากคีย์ตัวที่ 1 เต็มโควตา (ชนรหัสเออเรอร์ 429) ระบบจะสลับไปดึงเอาคีย์สำรองตัวถัดไปในไฟล์ `.env` (คั่นด้วยเครื่องหมายจุลภาค `,`) มาใช้งานต่อทันทีอย่างไร้รอยต่อ
* รองรับระบบ **Hot-Reload** ดึงคีย์ใหม่ที่แก้ไขลงไฟล์ `.env` เข้ามาใช้งานบนหน่วยความจำทันทีโดยไม่ต้องทำการรีสตาร์ทตัวคอนเทนเนอร์หลังบ้านใหม่

### ⏱️ 3. ระบบป้องกันการส่งสแปมข้อความในแชทบอท (Rate Limiting)
* สร้าง [rateLimiter.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/utils/rateLimiter.js) ตัวควบคุมการนับจำนวนข้อความรายบุคคลในหน่วยความจำ RAM ชั่วคราว
* จำกัดผู้ใช้ส่งข้อความคุยหรือส่งภาพให้บอทประมวลผล **สูงสุดไม่เกิน 6 ข้อความ ต่อ 1 นาที** เพื่อป้องกันกรณีผู้ใช้งานส่งสแปมเข้ามาถี่เกินไปจนเป็นเหตุให้โควตา API Key ฝั่ง AI ถูกตัดหมดไว
* บล็อกสัญญาณตั้งแต่ระดับ Webhook ใน [lineRoutes.js](file:///c:/Users/ACER/Documents/GitHub/Unifind/backend/src/routes/lineRoutes.js) และส่งข้อความเตือนให้ผู้ใช้งานเว้นระยะส่งข้อความแบบเป็นกันเองและสุภาพ นอกเหนือจากการล้างข้อมูลสเตตัสค้างคากรณี AI มีปัญหาโควตาเต็ม เพื่อป้องกันหน้าแชทผู้ใช้ค้างถาวร

