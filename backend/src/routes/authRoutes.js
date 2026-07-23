/**
 * =========================================================================
 * 🔑 AUTHENTICATION ROUTES (เส้นทางระบบยืนยันตัวตนและจัดการสิทธิ์)
 * =========================================================================
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Public Authentication Endpoints
router.post("/register", controller.register);
router.post("/login", controller.login);

// Admin User Management Endpoints
router.get("/users", verifyToken, isAdmin, controller.getUsers);
router.get("/users/pending", verifyToken, isAdmin, controller.getPendingUsers);
router.post("/users", verifyToken, isAdmin, controller.createUser);
router.put("/user/:userId", verifyToken, controller.updateUser);
router.delete("/user/:userId", verifyToken, isAdmin, controller.deleteUser);
router.put("/user/:userId/approve", verifyToken, isAdmin, controller.approveUser);
router.delete("/user/:userId/reject", verifyToken, isAdmin, controller.rejectUser);
router.put("/user/:userId/activate", verifyToken, isAdmin, controller.activateUser);
router.put("/user/:userId/deactivate", verifyToken, isAdmin, controller.deactivateUser);

module.exports = router;

