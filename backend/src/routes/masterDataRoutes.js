const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const locationController = require('../controllers/locationController');
const lockerController = require('../controllers/lockerController');
const personController = require('../controllers/personController');
const { verifyToken } = require('../middleware/authMiddleware');

// Categories
router.get('/categories', categoryController.getCategories);
router.post('/categories', verifyToken, categoryController.createCategory);

// Locations
router.get('/locations', locationController.getLocations);
router.post('/locations', verifyToken, locationController.createLocation);

// Lockers
router.get('/lockers', lockerController.getLockers);
router.post('/lockers', verifyToken, lockerController.createLocker);

// Persons
router.get('/persons', verifyToken, personController.getPersons);
router.post('/persons/find-or-create', verifyToken, personController.findOrCreatePerson);

module.exports = router;
