const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.post("/register", controller.register);
router.post("/login", controller.login);

router.post("/bind-line", verifyToken, controller.bindLine);

router.get("/users", verifyToken, isAdmin, controller.getUsers);
router.get("/users/pending", verifyToken, isAdmin, controller.getPendingUsers);
router.post("/users", verifyToken, isAdmin, controller.createUser);

router.put(
  "/user/:userId/approve",
  verifyToken,
  isAdmin,
  controller.activateUser,
);

router.delete(
  "/user/:userId/reject",
  verifyToken,
  isAdmin,
  controller.deleteUser,
);

router.put(
  "/user/:userId/activate",
  verifyToken,
  isAdmin,
  controller.activateUser,
);
router.put(
  "/user/:userId/deactivate",
  verifyToken,
  isAdmin,
  controller.deactivateUser,
);
router.put("/user/:userId", verifyToken, isAdmin, controller.updateUser);
router.delete("/user/:userId", verifyToken, isAdmin, controller.deleteUser);

module.exports = router;

