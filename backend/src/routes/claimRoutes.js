const express = require('express');
const router = express.Router();
const controller = require('../controllers/claimController');
const { verifyToken, isStaffOrAdmin } = require('../middleware/authMiddleware');

// User claims endpoints
router.post('/', verifyToken, controller.createClaim);

// Staff/Admin claims management endpoints
router.get('/', verifyToken, isStaffOrAdmin, controller.getClaims);
router.put('/:id/approve', verifyToken, isStaffOrAdmin, controller.approveClaim);
router.put('/:id/reject', verifyToken, isStaffOrAdmin, controller.rejectClaim);

module.exports = router;
