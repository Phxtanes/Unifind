/**
 * =========================================================================
 * 🔗 LINE BINDINGS STORE (ระบบเชื่อมโยง LINE User ID กับ อีเมลมหาวิทยาลัย)
 * =========================================================================
 * ทำหน้าที่จัดการการผูกบัญชี (Email <-> LINE User ID)
 * โดยใช้ In-memory cache ร่วมกับ Supabase DB และสำรองข้อมูลลงไฟล์ line_bindings.json
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const fs = require("fs");
const path = require("path");
const supabase = require("./supabase");

const filePath = path.join(__dirname, "../../uploads/line_bindings.json");
let inMemoryBindings = {};
let useDb = false;

// โหลดข้อมูล LINE Bindings จาก Supabase หรือ Fallback เป็นไฟล์ JSON ท้องถิ่น
async function initialize() {
  try {
    console.log("[LINE Bindings] Initializing bindings...");
    
    // ดึงข้อมูลอีเมลและ LINE User ID จากตาราง persons ใน Supabase
    const { data, error } = await supabase
      .from("Person")
      .select("email, line_user_id");
      
    if (error) {
      console.warn("[LINE Bindings] Supabase 'line_user_id' column not found or query failed. Falling back to local JSON file. Error:", error.message);
      loadFromFile();
      useDb = false;
    } else {
      console.log(`[LINE Bindings] Successfully loaded ${data ? data.length : 0} persons from Supabase to inspect bindings.`);
      inMemoryBindings = {};
      let boundCount = 0;
      if (data) {
        for (const row of data) {
          if (row.email && row.line_user_id) {
            inMemoryBindings[row.email.toLowerCase().trim()] = row.line_user_id;
            boundCount++;
          }
        }
      }
      console.log(`[LINE Bindings] Loaded ${boundCount} active LINE bindings from Supabase.`);
      useDb = true;

      // ถ้าใน Database ยังไม่มีการผูกบัญชีเลย แต่มีข้อมูลในไฟล์ JSON ท้องถิ่น
      // ให้ทำการซิงก์จากไฟล์ท้องถิ่นขึ้น Database ให้โดยอัตโนมัติ
      if (boundCount === 0) {
        const localBindings = loadLocalBindingsOnly();
        const localEmails = Object.keys(localBindings);
        if (localEmails.length > 0) {
          console.log(`[LINE Bindings] Found ${localEmails.length} local bindings. Migrating them to Supabase...`);
          for (const email of localEmails) {
            const lineUserId = localBindings[email];
            // ทำการบันทึกผูกบัญชีใน memory และอัปเดตขึ้น Supabase
            exports.bind(email, lineUserId);
          }
        }
      }
    }
  } catch (err) {
    console.error("[LINE Bindings] Exception during initialization, falling back to local JSON file:", err);
    loadFromFile();
    useDb = false;
  }
}

function loadLocalBindingsOnly() {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data || "{}");
    }
  } catch (error) {
    console.error("[LINE Bindings] Error reading local file for migration:", error);
  }
  return {};
}

function loadFromFile() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
      inMemoryBindings = {};
      return;
    }
    const data = fs.readFileSync(filePath, "utf8");
    inMemoryBindings = JSON.parse(data || "{}");
  } catch (error) {
    console.error("[LINE Bindings] Error loading local file:", error);
    inMemoryBindings = {};
  }
}

function saveToFile() {
  try {
    fs.writeFileSync(filePath, JSON.stringify(inMemoryBindings, null, 2));
  } catch (error) {
    console.error("[LINE Bindings] Error saving local file:", error);
  }
}

exports.initialize = initialize;

exports.bind = (email, lineUserId) => {
  const normalizedEmail = email.toLowerCase().trim();
  inMemoryBindings[normalizedEmail] = lineUserId;
  
  if (useDb) {
    // ทำงานอัปเดตลงฐานข้อมูลแบบ Asynchronous (ไม่บล็อกการทำงานหลัก)
    supabase
      .from("Person")
      .update({ line_user_id: lineUserId })
      .eq("email", normalizedEmail)
      .then(({ error }) => {
        if (error) {
          console.error(`[LINE Bindings] Failed to sync bind for ${normalizedEmail} to Supabase:`, error.message);
        } else {
          console.log(`[LINE Bindings] Synced bind for ${normalizedEmail} to Supabase successfully.`);
        }
      });
  } else {
    saveToFile();
  }
};

exports.getLineUserId = (email) => {
  if (!email) return null;
  return inMemoryBindings[email.toLowerCase().trim()] || null;
};

exports.getEmailByLineUserId = (lineUserId) => {
  if (!lineUserId) return null;
  for (const [email, id] of Object.entries(inMemoryBindings)) {
    if (id === lineUserId) return email;
  }
  return null;
};

