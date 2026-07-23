/**
 * =========================================================================
 * 📦 FOUND ITEM ROUTES (เส้นทางจัดการข้อมูลสิ่งของพบเจอ)
 * =========================================================================
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/itemController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Query Found Items
router.get("/", controller.getItems);
router.get("/:id", controller.getItemById);

// Manage Found Items
router.post("/", verifyToken, upload.single("image"), controller.createItem);
router.put("/:id", verifyToken, upload.single("image"), controller.updateItem);
router.delete("/:id", verifyToken, controller.deleteItem);

// Item Actions & AI Analytics
router.post("/:id/claim", verifyToken, controller.claimItem);
router.post("/analyze-match", verifyToken, controller.analyzeItemsMatch);

module.exports = router;
