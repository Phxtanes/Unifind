const LostItem = require('../models/LostItem');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// GET /api/lost-items (All items not soft deleted/deleted)
exports.getLostItems = async (req, res) => {
  try {
    const items = await LostItem.findAll({
      where: {
        status: ['stored', 'removed'] // Exclude 'deleted'
      },
      include: { model: User, as: 'recorder', attributes: ['username'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/status/stored (Only items currently stored)
exports.getStoredItems = async (req, res) => {
  try {
    const items = await LostItem.findAll({
      where: { status: 'stored' },
      include: { model: User, as: 'recorder', attributes: ['username'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/status/removed (History of returned/removed items)
exports.getRemovedItems = async (req, res) => {
  try {
    const items = await LostItem.findAll({
      where: { status: 'removed' },
      include: { model: User, as: 'recorder', attributes: ['username'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/:id (Details of a single item)
exports.getLostItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostItem.findByPk(id, {
      include: { model: User, as: 'recorder', attributes: ['username'] }
    });
    if (!item || item.status === 'deleted') {
      return res.status(404).json({ message: 'Lost item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/lost-items (Create new record)
exports.createLostItem = async (req, res) => {
  try {
    const {
      name,
      category,
      place,
      date,
      description,
      status,
      locker,
      finder_type,
      finder_phoneNumber,
      finder_studentId,
      finder_universityEmail,
      namereport,
      staffName
    } = req.body;

    const item = await LostItem.create({
      name,
      category,
      place,
      date,
      description,
      status: status || 'stored',
      locker,
      finder_type,
      finder_phoneNumber,
      finder_studentId,
      finder_universityEmail,
      namereport,
      staffName,
      user_id: req.userId // Recorded by this staff/admin
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/lost-items/:id/upload-image (Upload image)
exports.uploadLostItemImage = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Delete old picture if it exists
    if (item.picture) {
      const oldPath = path.join(__dirname, '../../', item.picture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const picturePath = `/uploads/${req.file.filename}`;
    await item.update({ picture: picturePath });

    res.status(200).json({ message: 'Image uploaded successfully', picture: picturePath, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/:id/image (Serve image)
exports.getLostItemImage = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostItem.findByPk(id);
    if (!item || !item.picture) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imagePath = path.join(__dirname, '../../', item.picture);
    if (fs.existsSync(imagePath)) {
      return res.sendFile(imagePath);
    } else {
      return res.status(404).json({ message: 'File not found on server' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/lost-items/:id (Edit item details)
exports.updateLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    const {
      name,
      category,
      place,
      date,
      description,
      status,
      locker,
      finder_type,
      finder_phoneNumber,
      finder_studentId,
      finder_universityEmail,
      namereport,
      receiver,
      staffName
    } = req.body;

    await item.update({
      name,
      category,
      place,
      date,
      description,
      status,
      locker,
      finder_type,
      finder_phoneNumber,
      finder_studentId,
      finder_universityEmail,
      namereport,
      receiver,
      staffName
    });

    res.status(200).json({ message: 'Lost item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/lost-items/status/removed/:id (Quick return item)
exports.returnLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver } = req.body;

    const item = await LostItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    await item.update({
      status: 'removed',
      receiver: receiver || 'Anonymous Claimer'
    });

    res.status(200).json({ message: 'Item marked as returned successfully', item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/lost-items/delete/:id (Delete record permanently)
exports.deleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    // Delete associated image file from disk
    if (item.picture) {
      const imagePath = path.join(__dirname, '../../', item.picture);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await item.destroy();
    res.status(200).json({ message: 'Lost item deleted permanently from database' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
