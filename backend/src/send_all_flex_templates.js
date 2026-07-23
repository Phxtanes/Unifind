module.paths.push('c:/Users/ACER/Documents/GitHub/Unifind/backend/node_modules');

const path = require('path');
const dotenvPath = 'c:/Users/ACER/Documents/GitHub/Unifind/backend/.env';
require('dotenv').config({ path: dotenvPath });

const axios = require("axios");

// Import matching service for sendPushToLine and buildMatchNotificationFlexMessage if exported
// But wait, buildMatchNotificationFlexMessage is not exported. We will re-define all builders here for testing.

const LINE_USER_ID = "U7bb9099541a2584f24701ff7774c8b2f";

// 1. Binding Success Flex Message
function buildBindingSuccessFlexMessage(role, details) {
  let rows = [
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "รหัสนักศึกษาที่ผูก:",
          color: "#888888",
          size: "sm",
          flex: 4,
        },
        {
          type: "text",
          text: details.studentId,
          color: "#333333",
          size: "sm",
          weight: "bold",
          flex: 6,
        },
      ],
    },
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "อีเมลที่ผูก:",
          color: "#888888",
          size: "sm",
          flex: 4,
        },
        {
          type: "text",
          text: details.email,
          color: "#333333",
          size: "sm",
          weight: "bold",
          wrap: true,
          flex: 6,
        },
      ],
    }
  ];

  const welcomeText = `ยินดีต้อนรับครับ! ตอนนี้บัญชี LINE ของคุณผูกกับอีเมลเรียบร้อยแล้ว ต่อจากนี้ถ้ามีใครเก็บของที่คล้ายกับของหายของคุณได้ ผมจะรีบส่งข้อความมาสะกิดบอกทันทีเลยครับ`;

  return {
    type: "flex",
    altText: "ผูกบัญชีเรียบร้อยแล้วครับ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "image",
            url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/UTCC_Sub_Logo.svg/512px-UTCC_Sub_Logo.svg.png",
            size: "xxs",
            aspectMode: "fit",
            aspectRatio: "1:1",
            flex: 0,
          },
        ],
        paddingBottom: "none",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#e8f5e9",
            cornerRadius: "md",
            paddingAll: "10px",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: "ผูกบัญชีเรียบร้อยแล้วครับ",
                weight: "bold",
                color: "#2e7d32",
                size: "md",
                align: "center",
              },
            ],
          },
          {
            type: "text",
            text: welcomeText,
            wrap: true,
            color: "#4a4a4a",
            size: "sm",
            lineSpacing: "3px",
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "md",
            contents: rows,
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#f5f5f5",
            paddingAll: "10px",
            cornerRadius: "sm",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "ระบบจะคอยเฝ้าระวังและแจ้งเตือนให้คุณทันทีที่มีข้อมูลอัปเดตครับ",
                size: "xs",
                color: "#777777",
                wrap: true,
              },
            ],
          },
        ],
      },
    },
  };
}

// 2. User Guide Flex Message (Bound / Unbound)
function buildUserGuideFlexMessage(isBound) {
  if (isBound) {
    return {
      type: "flex",
      altText: "คู่มือการใช้งาน Unifind 🚀",
      contents: {
        type: "bubble",
        size: "mega",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#1e3a8a",
          paddingAll: "20px",
          contents: [
            {
              type: "text",
              text: "คู่มือการใช้งาน Unifind 🚀",
              weight: "bold",
              color: "#ffffff",
              size: "md",
              align: "center"
            },
            {
              type: "text",
              text: "ช่องทางช่วยตามหาของหายชาว UTCC",
              color: "#bfdbfe",
              size: "xs",
              align: "center",
              margin: "xs"
            }
          ]
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "lg",
          contents: [
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "🔍 ค้นหาของหายในคลัง",
                      weight: "bold",
                      size: "sm",
                      color: "#1e3a8a",
                      flex: 8
                    }
                  ]
                },
                {
                  type: "text",
                  text: "พิมพ์สิ่งของที่กำลังตามหาเพื่อเช็กว่ามีคนเก็บได้หรือยัง\n💡 ตัวอย่าง: \"มีใครเจอกระเป๋าสีดำบ้างไหม\"",
                  wrap: true,
                  color: "#4b5563",
                  size: "xs",
                  lineSpacing: "4px"
                }
              ]
            },
            {
              type: "separator"
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "📝 บันทึกแจ้งของหาย",
                      weight: "bold",
                      size: "sm",
                      color: "#1e3a8a",
                      flex: 8
                    }
                  ]
                },
                {
                  type: "text",
                  text: "หากของยังไม่ขึ้นคลัง สามารถพิมพ์บอกรายละเอียดเพื่อให้บอทช่วยเฝ้าระวังแมตช์อัตโนมัติ 24 ชม.\n💡 ตัวอย่าง: \"ทำร่มสีแดงหายแถวตึก 24 ชั้น 3\"",
                  wrap: true,
                  color: "#4b5563",
                  size: "xs",
                  lineSpacing: "4px"
                }
              ]
            },
            {
              type: "separator"
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "📸 ส่งรูปตามหาของ",
                      weight: "bold",
                      size: "sm",
                      color: "#1e3a8a",
                      flex: 8
                    }
                  ]
                },
                {
                  type: "text",
                  text: "ส่งรูปถ่ายสิ่งของที่ต้องการตรวจจับ บอทจะใช้ AI ประมวลผลและเช็กกับของในคลังให้ทันที",
                  wrap: true,
                  color: "#4b5563",
                  size: "xs",
                  lineSpacing: "4px"
                }
              ]
            },
            {
              type: "separator"
            },
            {
              type: "box",
              layout: "horizontal",
              backgroundColor: "#e8f5e9",
              paddingAll: "10px",
              cornerRadius: "md",
              alignItems: "center",
              contents: [
                {
                  type: "text",
                  text: "สถานะบัญชี:",
                  color: "#555555",
                  size: "xs",
                  flex: 4
                },
                {
                  type: "text",
                  text: "ผูกข้อมูลเรียบร้อยแล้ว ✅",
                  color: "#2e7d32",
                  weight: "bold",
                  size: "xs",
                  align: "end",
                  flex: 6
                }
              ]
            }
          ]
        }
      }
    };
  } else {
    return {
      type: "flex",
      altText: "ขั้นตอนการผูกบัญชี Unifind 🎓",
      contents: {
        type: "bubble",
        size: "mega",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#b91c1c",
          paddingAll: "20px",
          contents: [
            {
              type: "text",
              text: "เริ่มต้นใช้งาน Unifind 🔑",
              weight: "bold",
              color: "#ffffff",
              size: "md",
              align: "center"
            },
            {
              type: "text",
              text: "กรุณาผูกบัญชีเพื่อเปิดสิทธิ์การใช้งานระบบ",
              color: "#fecaca",
              size: "xs",
              align: "center",
              margin: "xs"
            }
          ]
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "lg",
          contents: [
            {
              type: "text",
              text: "ยินดีต้อนรับสู่ Unifind ช่องทางช่วยตามหาของหายและรับแจ้งเตือนสำหรับชาว UTCC นะครับ! เพื่อความปลอดภัย รบกวนทำตามขั้นตอนด้านล่างนี้เลยครับ 👇",
              wrap: true,
              color: "#4b5563",
              size: "xs",
              lineSpacing: "4px"
            },
            {
              type: "separator"
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "xs",
              contents: [
                {
                  type: "text",
                  text: "ขั้นตอนการผูกบัญชี:",
                  weight: "bold",
                  size: "xs",
                  color: "#b91c1c"
                },
                {
                  type: "text",
                  text: "1. ✉️ พิมพ์ส่งอีเมลมหาวิทยาลัยของคุณเข้ามาในแชทนี้ (เช่น 2210511101xxx@live4.utcc.ac.th)\n2. 🔑 ระบบจะส่งรหัสผ่าน OTP ไปที่อีเมลดังกล่าวเพื่อยืนยันตัวตน\n3. 💬 นำรหัสผ่าน OTP มาพิมพ์ตอบกลับในแชทนี้เพื่อทำการเชื่อมโยงข้อมูล",
                  wrap: true,
                  color: "#4b5563",
                  size: "xs",
                  lineSpacing: "5px"
                }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              backgroundColor: "#fee2e2",
              paddingAll: "10px",
              cornerRadius: "md",
              alignItems: "center",
              contents: [
                {
                  type: "text",
                  text: "สถานะบัญชี:",
                  color: "#991b1b",
                  size: "xs",
                  flex: 4
                },
                {
                  type: "text",
                  text: "ยังไม่ได้ผูกข้อมูล ❌",
                  color: "#b91c1c",
                  weight: "bold",
                  size: "xs",
                  align: "end",
                  flex: 6
                }
              ]
            }
          ]
        }
      }
    };
  }
}

// 3. Match Notification Flex Message
function buildMatchNotificationFlexMessage(lostItemName, foundItemName, descriptionText, matchReason) {
  return {
    type: "flex",
    altText: `🔍 ตรวจพบของที่ตรงกับที่คุณแจ้งหาย: ${lostItemName}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1e3a8a",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "แจ้งเตือนการพบของหาย 🔔",
            weight: "bold",
            color: "#ffffff",
            size: "md",
            align: "center"
          },
          {
            type: "text",
            text: "ระบบตรวจพบคู่แมตช์ในคลังสิ่งของ",
            color: "#bfdbfe",
            size: "xs",
            align: "center",
            margin: "xs"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "ยินดีด้วยครับ! ระบบ Unifind ตรวจพบลักษณะของหายที่คุณแจ้งเข้าระบบ ตรงกับของที่มีคนเก็บมาส่งมอบในคลังกลางครับ 🎉",
            wrap: true,
            color: "#4b5563",
            size: "xs",
            lineSpacing: "4px"
          },
          {
            type: "separator"
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📌 ของที่แจ้งหาย:",
                    color: "#888888",
                    size: "xs",
                    flex: 4
                  },
                  {
                    type: "text",
                    text: lostItemName,
                    color: "#1f2937",
                    weight: "bold",
                    size: "xs",
                    wrap: true,
                    flex: 6
                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📍 ของที่พบคืน:",
                    color: "#888888",
                    size: "xs",
                    flex: 4
                  },
                  {
                    type: "text",
                    text: foundItemName,
                    color: "#1e3a8a",
                    weight: "bold",
                    size: "xs",
                    wrap: true,
                    flex: 6
                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📝 รายละเอียด:",
                    color: "#888888",
                    size: "xs",
                    flex: 4
                  },
                  {
                    type: "text",
                    text: descriptionText || "-",
                    color: "#4b5563",
                    size: "xs",
                    wrap: true,
                    flex: 6
                  }
                ]
              }
            ]
          },
          {
            type: "separator"
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#eff6ff",
            paddingAll: "10px",
            cornerRadius: "md",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "✨ จุดที่แมตช์สอดคล้องกัน (AI วิเคราะห์):",
                color: "#1e3a8a",
                weight: "bold",
                size: "xs"
              },
              {
                type: "text",
                text: matchReason,
                color: "#1e40af",
                size: "xs",
                wrap: true,
                lineSpacing: "4px"
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#f9fafb",
            paddingAll: "10px",
            cornerRadius: "sm",
            contents: [
              {
                type: "text",
                text: "👉 แนะนำให้ท่านเตรียมหลักฐานยืนยันความเป็นเจ้าของ และติดต่อขอรับของคืน ณ ตึกบริการของมหาวิทยาลัยได้เลยครับ!",
                size: "xs",
                color: "#6b7280",
                wrap: true,
                lineSpacing: "4px"
              }
            ]
          }
        ]
      }
    }
  };
}

// 5. Found Item Flex Message (Card)
function buildFoundItemFlexMessage(item) {
  return {
    type: "flex",
    altText: `พบข้อมูลของหาย: ${item.item_name}`,
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: item.item_name,
            weight: "bold",
            size: "lg",
            color: "#1a1a1a",
            wrap: true,
          },
          {
            type: "separator",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "สถานะ:",
                    color: "#888888",
                    size: "sm",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: "อยู่ในคลัง",
                    color: "#1e40af",
                    weight: "bold",
                    size: "sm",
                    flex: 7,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "หมวดหมู่:",
                    color: "#888888",
                    size: "sm",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: "กระเป๋า",
                    color: "#333333",
                    size: "sm",
                    flex: 7,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "สถานที่พบ:",
                    color: "#888888",
                    size: "sm",
                    flex: 3,
                  },
                  {
                    type: "text",
                    text: "อาคาร 24 ชั้น 2",
                    color: "#333333",
                    size: "sm",
                    wrap: true,
                    flex: 7,
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0f3057",
            height: "sm",
            action: {
              type: "message",
              label: "ติดต่อขอรับของคืน",
              text: `ติดต่อขอรับของคืนสำหรับ ${item.item_name} (ID: ${item.id})`,
            },
          },
        ],
        paddingTop: "none",
      },
    },
  };
}

async function sendPush(lineUserId, flexOrTextMessage) {
  try {
    const payload = typeof flexOrTextMessage === "string" 
      ? { type: "text", text: flexOrTextMessage }
      : flexOrTextMessage;

    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: lineUserId,
        messages: [payload],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      },
    );
    console.log(`✉️ Pushed successfully!`);
  } catch (error) {
    console.error(
      "❌ Push Error:",
      error.response ? error.response.data : error.message,
    );
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log("==========================================");
  console.log("🚀 Starting LINE OA Notification Sequence");
  console.log("Recipient LINE User ID:", LINE_USER_ID);
  console.log("==========================================");

  // 1. เพิ่มเพื่อนครั้งแรก (Welcome Text + Step Flex)
  console.log("\n[1/6] 🟢 1. ข้อความต้อนรับเมื่อเพิ่มเพื่อนครั้งแรก (Text Greeting + Guide Flex)...");
  await sendPush(LINE_USER_ID, "ยินดีต้อนรับเข้าสู่ Unifind นะครับผม! 🎉 ช่องทางช่วยตามหาของหายและรับแจ้งเตือนสำหรับชาว UTCC\n\nกรุณาผูกบัญชีผู้ใช้เพื่อความปลอดภัยและเปิดสิทธิ์ใช้งานระบบตามหาของหาย โดยพิมพ์ส่งอีเมลมหาวิทยาลัยของคุณเข้ามาในแชทนี้เพื่อทำการผูกบัญชีได้เลยครับ 🎓💼");
  await sleep(1000);
  await sendPush(LINE_USER_ID, buildUserGuideFlexMessage(false));
  await sleep(2000);

  // 2. ขั้นตอนขอรหัส OTP
  console.log("\n[2/6] 🔑 2. ข้อความแจ้งเตือนส่งรหัส OTP ไปยังอีเมล...");
  await sendPush(LINE_USER_ID, "🔑 ระบบได้ส่งรหัสยืนยัน OTP (6 หลัก) ไปยังอีเมล 2210511101011@live4.utcc.ac.th เรียบร้อยแล้วครับ\n\nโปรดตรวจสอบกล่องข้อความในอีเมลของท่าน และนำรหัส 6 หลักมาพิมพ์ตอบกลับในแชทนี้ได้เลยครับ (รหัสมีอายุ 5 นาที)");
  await sleep(2000);

  // 3. แจ้งเตือนผูกบัญชีสำเร็จ
  console.log("\n[3/6] ✅ 3. การแจ้งเตือนผูกบัญชีเรียบร้อยแล้ว (Binding Success Flex)...");
  await sendPush(LINE_USER_ID, buildBindingSuccessFlexMessage("STUDENT", {
    studentId: "2210511101011",
    email: "2210511101011@live4.utcc.ac.th"
  }));
  await sleep(2000);

  // 4. คู่มือใช้งานสำหรับผู้ผูกบัญชีแล้ว
  console.log("\n[4/6] 📘 4. คู่มือการใช้งาน Unifind สำหรับผู้ผูกบัญชีเรียบร้อยแล้ว (Bound User Guide Flex)...");
  await sendPush(LINE_USER_ID, buildUserGuideFlexMessage(true));
  await sleep(2000);

  // 5. ตัวอย่างการ์ดค้นพบของในคลัง
  console.log("\n[5/6] 📦 5. การ์ดแสดงผลสิ่งของที่พบในคลัง (Found Item Flex Card)...");
  await sendPush(LINE_USER_ID, buildFoundItemFlexMessage({
    id: "FOUND-9981",
    item_name: "กระเป๋าสตางค์หนังสีดำ (มีบัตรนักศึกษา)"
  }));
  await sleep(2000);

  // 6. การแจ้งเตือน AI Match Found Notification
  console.log("\n[6/6] 🔔 6. การแจ้งเตือนแมตช์ของหายอัตโนมัติจาก AI (Match Notification Flex)...");
  await sendPush(LINE_USER_ID, buildMatchNotificationFlexMessage(
    "แก้วน้ำสีดำ",
    "แก้วน้ำ stainless สีดำ",
    "สีดำ มีพวงกุญแจรูปดาวสีเหลืองติดอยู่กับแก้ว",
    "สิ่งของมีชื่อและคุณลักษณะตรงกัน ทั้งสีดำและพวงกุญแจรูปดาวสีเหลือง สถานที่พบคือโรงอาหารกลาง ชั้น 1 ซึ่งเป็นจุดเดียวกับที่แจ้งหาย"
  ));

  console.log("\n==========================================");
  console.log("🎉 All 6 Notification steps sent successfully!");
  console.log("==========================================");
}

runTest();

