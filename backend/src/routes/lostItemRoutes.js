const express = require('express');
const router = express.Router();
const controller = require('../controllers/lostItemController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', controller.getLostItems);
router.get('/:id', controller.getLostItemById);
router.post('/', verifyToken, upload.single('image'), controller.createLostItem);
router.put('/:id', verifyToken, upload.single('image'), controller.updateLostItem);
router.post('/analyze-match', verifyToken, controller.analyzeItemsMatch);
router.delete('/:id', verifyToken, controller.deleteLostItem);

module.exports = router;
