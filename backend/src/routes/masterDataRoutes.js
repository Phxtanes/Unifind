/**
 * =========================================================================
 * 🗂️ MASTER DATA ROUTES (เส้นทางจัดการข้อมูลหลักระบบ)
 * =========================================================================
 * รวมเส้นทางจัดการข้อมูลมาสเตอร์ (Categories, Buildings, Locations, Persons)
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const locationController = require("../controllers/locationController");
const buildingController = require("../controllers/buildingController");
const personController = require("../controllers/personController");
const { verifyToken } = require("../middleware/authMiddleware");

// Categories Endpoints
router.get("/categories", categoryController.getCategories);
router.post("/categories", verifyToken, categoryController.createCategory);
router.put("/categories/:id", verifyToken, categoryController.updateCategory);
router.delete("/categories/:id", verifyToken, categoryController.deleteCategory);

// Buildings Endpoints
router.get("/buildings", buildingController.getBuildings);
router.post("/buildings", verifyToken, buildingController.createBuilding);
router.put("/buildings/:id", verifyToken, buildingController.updateBuilding);
router.delete("/buildings/:id", verifyToken, buildingController.deleteBuilding);

// Locations Endpoints
router.get("/locations", locationController.getLocations);
router.post("/locations", verifyToken, locationController.createLocation);
router.put("/locations/:id", verifyToken, locationController.updateLocation);
router.delete("/locations/:id", verifyToken, locationController.deleteLocation);

// Persons Endpoints
router.get("/persons", verifyToken, personController.getPersons);
router.post("/persons/find-or-create", verifyToken, personController.findOrCreatePerson);

module.exports = router;
