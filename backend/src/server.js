/**
 * =========================================================================
 * 🌐 UNIFIND BACKEND SERVER (เซิร์ฟเวอร์หลักของระบบ)
 * =========================================================================
 * ทำหน้าที่เริ่มต้น Express Server, ตั้งค่า CORS & Static Route,
 * โหลด API Router ทั้งหมด, เช็ก/สร้างบัญชี Default Admin, และเริ่มต้น Sync Engine
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcryptjs");

// นำเข้าการตั้งค่าและ Router ทั้งหมด
const supabase = require("./config/supabase");
const lineBindings = require("./config/lineBindings");
const dbSync = require("./utils/dbSync");

const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const lostItemRoutes = require("./routes/lostItemRoutes");
const lineRoutes = require("./routes/lineRoutes");
const masterDataRoutes = require("./routes/masterDataRoutes");

const app = express();

/* =========================================================================
 * ⚙️ 1. MIDDLEWARES & STATIC FOLDERS SETUP
 * ========================================================================= */

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* =========================================================================
 * 🛣️ 2. API ROUTE BINDINGS
 * ========================================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/lost-items", lostItemRoutes);
app.use("/api/line", lineRoutes);
app.use("/api/master", masterDataRoutes);

/* =========================================================================
 * 👑 3. ADMIN INITIALIZATION SEEDER
 * ========================================================================= */

const seedAdmin = async () => {
  try {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "ADMIN");

    if (error) {
      console.error(
        "⚠️ Error checking admin count in Supabase:",
        error.message,
      );
      return;
    }

    if (count === 0) {
      const hashedPassword = await bcrypt.hash("admin1234", 8);
      const { error: insertError } = await supabase.from("users").insert({
        username: "admin",
        full_name: "System Admin",
        email: "admin@utcc.ac.th",
        password_hash: hashedPassword,
        role: "ADMIN",
        status: "Active",
      });

      if (insertError) {
        console.error("⚠️ Seeding admin error:", insertError.message);
      } else {
        console.log("👑 Default Admin seeded successfully: admin / admin1234");
      }
    } else {
      console.log("✅ Admin user already exists in Supabase");
    }
  } catch (err) {
    console.error("⚠️ Unexpected seeding error:", err);
  }
};

/* =========================================================================
 * 🚀 4. SERVER LISTENER & BACKGROUND SERVICES
 * ========================================================================= */

const PORT = process.env.PORT || 9001;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  await lineBindings.initialize();
  dbSync.startPeriodicSync();
  await seedAdmin();
});
