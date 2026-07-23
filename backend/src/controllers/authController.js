/**
 * =========================================================================
 * 🔑 AUTHENTICATION & USER CONTROLLER (ระบบพิสูจน์ตัวตนและจัดการสิทธิ์ผู้ใช้งาน)
 * =========================================================================
 * ทำหน้าที่ประมวลผลการเข้าสู่ระบบ (Login), ลงทะเบียน (Register),
 * จัดการบัญชีผู้ใช้ระบบ (Staff/Admin Accounts) และสิทธิ์การใช้งานระบบ Web Admin
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const supabase = require("../config/supabase");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* =========================================================================
 * 🛠️ 1. DATA FORMATTING HELPERS
 * ========================================================================= */

const formatUser = (user) => {
  if (!user) return null;
  return {
    id: user.user_id,
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role ? user.role.toLowerCase() : "staff",
    status: user.status,
    isActive: user.status === "Active",
    isApproved:
      user.status === "Active" ||
      user.role === "ADMIN" ||
      user.role === "STAFF",
  };
};


/* =========================================================================
 * 🔐 2. AUTHENTICATION HANDLERS (Login & Self Register)
 * ========================================================================= */

/** POST /api/auth/register - ยื่นขอลงทะเบียนเจ้าหน้าที่ใหม่ (รอการอนุมัติ) */
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, nickname } = req.body;

    const { data: existingUser } = await supabase
      .from("users")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const { data: existingEmail } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const { error: insertError } = await supabase.from("users").insert({
      username,
      email,
      password_hash: hashedPassword,
      full_name: full_name || username,
      nickname: nickname || null,
      role: "STAFF",
      status: "Inactive",
    });

    if (insertError) throw insertError;

    res.status(201).json({
      message: "Register request submitted! Please wait for Admin approval.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/auth/login - เข้าสู่ระบบสำหรับ Admin & Staff */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.status === "Inactive" || user.status === "Suspended") {
      return res.status(403).json({
        message:
          "บัญชีของคุณยังไม่ได้รับการอนุมัติสิทธิ์เข้าใช้งาน หรือ ถูกระงับการใช้งานชั่วคราว",
      });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordIsValid) {
      return res.status(401).json({ message: "Invalid Password!" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: 86400 },
    );

    res.status(200).json({
      id: user.user_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role.toLowerCase(),
      accessToken: token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================================================
 * 👥 3. USER MANAGEMENT HANDLERS (Admin Actions)
 * ========================================================================= */

/** GET /api/auth/users - ดึงรายการผู้ใช้ระบบทั้งหมด */
exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("user_id, username, nickname, email, full_name, role, status")
      .in("role", ["ADMIN", "STAFF"])
      .in("status", ["Active", "Suspended"]);

    if (error) throw error;

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/auth/users - สร้างบัญชีผู้ใช้ใหม่โดยตรงจากหน้า Admin */
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      nickname,
      email,
      password,
      full_name,
      role = "STAFF",
      status = "Active",
    } = req.body;


    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const { data: existingEmail } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        full_name: full_name || username,
        nickname: nickname || null,
        role: role.toUpperCase(),
        status,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      message: "User created successfully",
      user: formatUser(newUser),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/auth/users/pending - ดึงรายการผู้ใช้ที่รออนุมัติสิทธิ์ (Inactive) */
exports.getPendingUsers = async (req, res) => {
  try {
    const { data: pendingUsers, error } = await supabase
      .from("users")
      .select("user_id, username, email, full_name, role, status")
      .eq("role", "STAFF")
      .eq("status", "Inactive");

    if (error) throw error;

    res.status(200).json((pendingUsers || []).map(formatUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/auth/users/:userId/approve - อนุมัติสิทธิ์เจ้าหน้าที่เข้าใช้งานระบบ */
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from("users")
      .update({ role: "STAFF", status: "Active" })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116")
        return res.status(404).json({ message: "User not found" });
      throw error;
    }

    res.status(200).json({
      message: `Approved user ${user.username} as Staff successfully!`,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/auth/users/:userId/reject - ปฏิเสธและลบคำขอลงทะเบียนบัญชี */
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;

    res.status(200).json({ message: "User request rejected and removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/auth/user/:userId - ลบบัญชีผู้ใช้งานออกจากระบบถาวร */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/auth/users/:userId/activate - เปิดใช้งานบัญชีผู้ใช้ */
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from("users")
      .update({ status: "Active" })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116")
        return res.status(404).json({ message: "User not found" });
      throw error;
    }

    res.status(200).json({
      message: "Account activated successfully",
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/auth/users/:userId/deactivate - ระงับการใช้งานบัญชีผู้ใช้ชั่วคราว */
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from("users")
      .update({ status: "Suspended" })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116")
        return res.status(404).json({ message: "User not found" });
      throw error;
    }

    res.status(200).json({
      message: "Account deactivated successfully",
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/auth/user/:userId - แก้ไขข้อมูลผู้ใช้ (เช่น Nickname, Role, Status) */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, nickname, email, role, status, password } = req.body;

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (nickname !== undefined) updates.nickname = nickname;
    if (email !== undefined) updates.email = email;
    if (role !== undefined && req.userRole?.toLowerCase() === "admin") updates.role = role.toUpperCase();
    if (status !== undefined && req.userRole?.toLowerCase() === "admin") updates.status = status;
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116")
        return res.status(404).json({ message: "User not found" });
      throw error;
    }

    res.status(200).json({
      message: "User updated successfully",
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
