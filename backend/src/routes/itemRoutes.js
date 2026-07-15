const express = require("express");
const router = express.Router();
const controller = require("../controllers/itemController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", controller.getItems);
router.get("/:id", controller.getItemById);
router.post("/", verifyToken, upload.single("image"), controller.createItem);
router.put("/:id", verifyToken, upload.single("image"), controller.updateItem);
router.delete("/:id", verifyToken, controller.deleteItem);

router.post("/:id/claim", verifyToken, controller.claimItem);

router.post("/analyze-match", verifyToken, controller.analyzeItemsMatch);

module.exports = router;
