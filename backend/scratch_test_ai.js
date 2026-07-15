const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

console.log("Starting AI Diagnostic Test...");
console.log("GEMINI_API_KEY from .env:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
if (process.env.GEMINI_API_KEY) {
  console.log("Length of key:", process.env.GEMINI_API_KEY.length);
}

const rawKeys = process.env.GEMINI_API_KEY || "";
const apiKeys = rawKeys.split(",").map(k => k.trim()).filter(Boolean);

console.log("Detected keys count:", apiKeys.length);

async function testModel(modelName, apiKey) {
  try {
    console.log(`\nTesting model "${modelName}" with key: ${apiKey.substring(0, 8)}...`);
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello, tell me a short joke."
    });
    console.log(`✅ Success for ${modelName}! Response:`, response.text.trim());
    return true;
  } catch (err) {
    console.error(`❌ Failed for ${modelName}:`, err.message || err);
    if (err.status) console.error("Status Code:", err.status);
    if (err.errorDetails) console.error("Error Details:", err.errorDetails);
    return false;
  }
}

async function runAll() {
  for (let i = 0; i < apiKeys.length; i++) {
    console.log(`\n=================== Testing Key #${i+1} ===================`);
    const key = apiKeys[i];
    await testModel("gemini-3.1-flash-lite", key);
    await testModel("gemini-1.5-flash", key);
    await testModel("gemini-2.5-flash-lite", key);
    await testModel("gemini-2.5-flash", key);
  }
}

runAll().then(() => console.log("\nDiagnostic finished."));
