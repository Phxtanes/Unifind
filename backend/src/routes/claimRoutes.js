const express = require('express');
const router = express.Router();
const controller = require('../controllers/claimController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, controller.getClaims);
router.post('/', verifyToken, controller.createClaim);
router.put('/:id/return', verifyToken, controller.markAsReturned);
router.put('/:id/cancel', verifyToken, controller.cancelClaim);

module.exports = router;
