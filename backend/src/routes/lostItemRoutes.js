/**
 * =========================================================================
 * 🔍 LOST ITEM ROUTES (เส้นทางจัดการข้อมูลสิ่งของสูญหาย)
 * =========================================================================
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/lostItemController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Query Lost Items
router.get("/", controller.getLostItems);
router.get("/:id", controller.getLostItemById);

// Manage Lost Items
router.post("/", verifyToken, upload.single("image"), controller.createLostItem);
router.put("/:id", verifyToken, upload.single("image"), controller.updateLostItem);
router.delete("/:id", verifyToken, controller.deleteLostItem);

module.exports = router;
