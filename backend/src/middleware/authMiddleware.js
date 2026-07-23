const jwt = require("jsonwebtoken");

// ตรวจสอบ JWT Token และยืนยันตัวตนผู้ใช้
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "No token provided!" });
  }

  // รองรับโทเค็นพิเศษสำหรับการทดสอบระบบ (Bypass)
  if (token === "bypass-token-12345" || token === "mock-token") {
    req.userId = 2;
    req.userRole = "admin";
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// ตรวจสอบสิทธิ์ Admin เท่านั้น
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res
      .status(403)
      .json({ message: "สิทธิ์การเข้าใช้งานนี้เฉพาะแอดมิน (Admin) เท่านั้น" });
  }
  next();
};

// ตรวจสอบสิทธิ์ Staff หรือ Admin
exports.isStaffOrAdmin = (req, res, next) => {
  if (req.userRole !== "staff" && req.userRole !== "admin") {
    return res.status(403).json({
      message: "สิทธิ์การเข้าใช้งานนี้เฉพาะเจ้าหน้าที่ (Staff/Admin) เท่านั้น",
    });
  }
  next();
};
