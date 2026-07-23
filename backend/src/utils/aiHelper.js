/**
 * =========================================================================
 * 🧠 GEMINI AI HELPER (ยูทิลิตีระบบสมองกล AI และการทำ Rotation)
 * =========================================================================
 * ทำหน้าที่บริหารจัดการการเชื่อมต่อ Gemini AI API, การสลับ Key อัตโนมัติ (Rotation),
 * การสลับโมเดลกรณีเต็มโควตา (Fallback), และระบบ Prompt Caching
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const { GoogleGenAI } = require("@google/genai");

const promptCache = new Map();
const MAX_CACHE_SIZE = 100;

// โหลดรายการ API Keys ทั้งหมดจาก .env
let rawKeys = process.env.GEMINI_API_KEY || "";
let apiKeys = rawKeys
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

// สร้างรายการ clients สำหรับแต่ละคีย์
let clients = apiKeys.map((key) => new GoogleGenAI({ apiKey: key }));
let currentClientIndex = 0;

// ฟังก์ชันภายในสำหรับสลับคีย์เมื่อตัวเก่าเต็มโควตา
function rotateClient() {
  if (clients.length <= 1) return;
  const oldIndex = currentClientIndex;
  currentClientIndex = (currentClientIndex + 1) % clients.length;
  console.log(
    `🔄 [AI Rotation] คีย์ลำดับที่ ${oldIndex + 1} เต็มโควตา สลับไปใช้คีย์ลำดับที่ ${currentClientIndex + 1} อัตโนมัติ`,
  );
}

// ฟังก์ชันเรียกดูไคลเอนต์ปัจจุบันและรองรับ Hot-Reload
function getActiveClient(passedClient) {
  const latestRaw = process.env.GEMINI_API_KEY || "";
  const latestKeys = latestRaw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  // ตรวจสอบว่ามีการอัปเดตคีย์ใน .env หรือไม่ หากเปลี่ยนจะทำการโหลดใหม่
  if (
    latestKeys.length !== apiKeys.length ||
    latestKeys.some((k, idx) => k !== apiKeys[idx])
  ) {
    console.log(
      `⚙️ [AI Helper] ตรวจพบการปรับเปลี่ยนคีย์ใน .env ทำการโหลดรายชื่อใหม่ (Hot-Reload)`,
    );
    apiKeys.length = 0;
    apiKeys.push(...latestKeys);
    clients = apiKeys.map((key) => new GoogleGenAI({ apiKey: key }));
    currentClientIndex = 0;
  }

  if (clients.length > 0) {
    return clients[currentClientIndex];
  }
  return passedClient;
}

async function generateContentWithFallback(aiClient, options) {
  const cacheKey =
    typeof options.contents === "string" ? options.contents.trim() : null;
  if (cacheKey && promptCache.has(cacheKey)) {
    console.log(
      "⚡ [AI Utility] ตรวจพบข้อมูลประมวลผลคำสั่งในระบบ Cache (Cache Hit) ข้ามการติดต่อเซิร์ฟเวอร์ AI",
    );
    return promptCache.get(cacheKey);
  }

  let taskType = options.taskType || "general";
  if (Array.isArray(options.contents)) {
    const hasImage = options.contents.some(
      (item) => item && typeof item === "object" && item.inlineData,
    );
    if (hasImage) {
      taskType = "vision";
    }
  }

  let models = [];
  if (taskType === "vision") {
    models = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-3.5-flash",
    ];
  } else if (taskType === "chitchat" || taskType === "classification") {
    models = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
    ];
  } else if (taskType === "extraction" || taskType === "matching") {
    models = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-pro-exp-02-05",
    ];
  } else {
    models = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-3.5-flash",
      "gemini-1.5-pro",
    ];
  }

  let lastError;
  let client = getActiveClient(aiClient);

  for (const model of models) {
    let retries = 3;
    let delay = 1500;

    while (retries > 0) {
      try {
        const clientIndex = currentClientIndex;
        console.log(
          `🤖 [AI Utility] ส่งคำสั่งไปยังโมเดล: ${model} (พยายามครั้งที่ ${4 - retries}/3) ด้วยคีย์หลักลำดับที่ ${clientIndex + 1}`,
        );

        const response = await client.models.generateContent({
          ...options,
          model: model,
        });

        if (cacheKey) {
          if (promptCache.size >= MAX_CACHE_SIZE) {
            const firstKey = promptCache.keys().next().value;
            promptCache.delete(firstKey);
          }
          promptCache.set(cacheKey, response);
        }

        return response;
      } catch (err) {
        const errMsg =
          err.message || (err.response && err.response.data) || String(err);
        console.error(`⚠️ [AI Utility] โมเดล ${model} ทำงานล้มเหลว:`, errMsg);
        lastError = err;

        const isRateLimit =
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("exhausted") ||
          errMsg.toLowerCase().includes("rate limit");

        if (isRateLimit) {
          if (clients.length > 1) {
            rotateClient();
            client = getActiveClient(aiClient);
            retries--;
            continue;
          }

          if (retries > 1) {
            console.log(
              `⏳ [AI Utility] ตรวจพบการชน Rate Limit โควตาเต็มชั่วคราว จะหน่วงเวลาพยายามใหม่ในอีก ${delay}ms...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            retries--;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

module.exports = {
  generateContentWithFallback,
};
