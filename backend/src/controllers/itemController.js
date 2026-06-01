const Item = require('../models/Item');
const User = require('../models/User');

exports.createItem = async (req, res) => {
  try {
    const { name, description, location, date, status } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await Item.create({
      name, description, location, date, status, image_url, user_id: req.userId
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getItems = async (req, res) => {
  try {
    const items = await Item.findAll({ 
      include: { model: User, attributes: ['username'] }, 
      order: [['createdAt', 'DESC']] 
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, date, status } = req.body;
    
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.update({ name, description, location, date, status });
    res.status(200).json({ message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.destroy();
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
