const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', controller.register);
router.post('/login', controller.login);

// Admin-only User Management endpoints
router.get('/users', verifyToken, isAdmin, controller.getUsers);
router.get('/users/pending', verifyToken, isAdmin, controller.getPendingUsers);
router.put('/user/:userId/approve', verifyToken, isAdmin, controller.approveUser);
router.put('/user/:userId/reject', verifyToken, isAdmin, controller.rejectUser);
router.put('/user/:userId/activate', verifyToken, isAdmin, controller.activateUser);
router.put('/user/:userId/deactivate', verifyToken, isAdmin, controller.deactivateUser);
router.delete('/user/:userId', verifyToken, isAdmin, controller.deleteUser);

module.exports = router;
