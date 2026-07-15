const fs = require("fs");
const path = require("path");
const axios = require("axios");

const envPath = path.resolve(__dirname, "../../.env");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};

envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const token = env.LINE_CHANNEL_ACCESS_TOKEN;
if (!token) {
  console.error("❌ LINE_CHANNEL_ACCESS_TOKEN not found in backend/.env");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const imagePath = path.resolve(
  __dirname,
  "../../uploads/rich_menu_clean_2500x1686.jpg",
);

async function setupRichMenu() {
  try {
    console.log("🚀 Starting LINE OA 4-Button Rich Menu setup...");

    const richMenuData = {
      size: { width: 2500, height: 1686 },
      selected: true,
      name: "Unifind 4-Button Rich Menu",
      chatBarText: "เปิดเมนูใช้งาน",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 1250, height: 843 },
          action: { type: "message", text: "แจ้งของหาย" },
        },
        {
          bounds: { x: 1250, y: 0, width: 1250, height: 843 },
          action: { type: "message", text: "วิธีใช้งาน" },
        },
        {
          bounds: { x: 0, y: 843, width: 1250, height: 843 },
          action: { type: "message", text: "ผูกบัญชี" },
        },
        {
          bounds: { x: 1250, y: 843, width: 1250, height: 843 },
          action: { type: "message", text: "ติดต่อเจ้าหน้าที่" },
        },
      ],
    };

    console.log("Creating Rich Menu structure...");
    const createRes = await axios.post(
      "https://api.line.me/v2/bot/richmenu",
      richMenuData,
      { headers },
    );
    const richMenuId = createRes.data.richMenuId;
    console.log(`✅ Created Rich Menu ID: ${richMenuId}`);

    console.log(`Reading image from: ${imagePath}`);
    const imageBuffer = fs.readFileSync(imagePath);

    console.log("Uploading image to LINE API...");
    await axios.post(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      imageBuffer,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "image/jpeg",
        },
      },
    );
    console.log("✅ Image uploaded successfully!");

    console.log("Setting new Rich Menu as default...");
    await axios.post(
      `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
      {},
      { headers },
    );
    console.log("✅ Default Rich Menu updated successfully for all users!");

    console.log("Cleaning up old Rich Menus...");
    const listRes = await axios.get(
      "https://api.line.me/v2/bot/richmenu/list",
      { headers },
    );
    const existingMenus = listRes.data.richmenus || [];
    for (const menu of existingMenus) {
      if (menu.richMenuId !== richMenuId) {
        console.log(
          `Deleting old Rich Menu: ${menu.richMenuId} (${menu.name})`,
        );
        await axios.delete(
          `https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`,
          { headers },
        );
      }
    }
    console.log("✅ Clean up complete!");
    console.log("\n✨ Rich Menu updated to 4 buttons successfully!");
  } catch (error) {
    console.error(
      "❌ Error setting up Rich Menu:",
      error.response ? error.response.data : error.message,
    );
  }
}

setupRichMenu();
