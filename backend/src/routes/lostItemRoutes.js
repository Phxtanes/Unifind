const express = require('express');
const router = express.Router();
const controller = require('../controllers/lostItemController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');

// Setup multer for images in lost-items
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// LostItem endpoints
router.get('/', controller.getLostItems);
router.get('/status/stored', controller.getStoredItems);
router.get('/status/removed', controller.getRemovedItems);
router.get('/:id', controller.getLostItemById);
router.get('/:id/image', controller.getLostItemImage);

// Protected lost-item endpoints (Staff/Admin only)
router.post('/', verifyToken, controller.createLostItem);
router.post('/:id/upload-image', verifyToken, upload.single('image'), controller.uploadLostItemImage);
router.put('/:id', verifyToken, controller.updateLostItem);
router.put('/status/removed/:id', verifyToken, controller.returnLostItem);
router.delete('/delete/:id', verifyToken, controller.deleteLostItem);

module.exports = router;
