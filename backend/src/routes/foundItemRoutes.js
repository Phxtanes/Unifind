const express = require('express');
const router = express.Router();
const controller = require('../controllers/foundItemController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', controller.getFoundItems);
router.get('/:id', controller.getFoundItemById);
router.post('/', verifyToken, upload.single('image'), controller.createFoundItem);
router.put('/:id', verifyToken, upload.single('image'), controller.updateFoundItem);
router.delete('/:id', verifyToken, controller.deleteFoundItem);

module.exports = router;
