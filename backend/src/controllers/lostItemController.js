const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

// Helper to map Supabase lowercase fields to camelCase for frontend compatibility
const formatItem = (item) => {
  if (!item) return null;
  const { users, finder_phonenumber, finder_studentid, finder_universityemail, staffname, ...rest } = item;
  return {
    ...rest,
    finder_phoneNumber: finder_phonenumber,
    finder_studentId: finder_studentid,
    finder_universityEmail: finder_universityemail,
    staffName: staffname,
    recorder: users ? { username: users.username } : null
  };
};

// GET /api/lost-items (All items not soft deleted/deleted)
exports.getLostItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('items')
      .select('*, users:user_id(username)', { count: 'exact' })
      .in('status', ['stored', 'removed', 'lost', 'found', 'claimed'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formattedRows = (data || []).map(formatItem);

    res.status(200).json({
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      items: formattedRows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/status/stored (Only items currently stored)
exports.getStoredItems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*, users:user_id(username)')
      .eq('status', 'stored')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedRows = (data || []).map(formatItem);
    res.status(200).json(formattedRows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/status/removed (History of returned/removed items)
exports.getRemovedItems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*, users:user_id(username)')
      .eq('status', 'removed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedRows = (data || []).map(formatItem);
    res.status(200).json(formattedRows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/:id (Details of a single item)
exports.getLostItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('items')
      .select('*, users:user_id(username)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Lost item not found' });
      }
      throw error;
    }

    if (data.status === 'deleted') {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    res.status(200).json(formatItem(data));
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

    const { data, error } = await supabase
      .from('items')
      .insert({
        name,
        category,
        place,
        date: date || new Date().toISOString(),
        description,
        status: status || 'stored',
        locker,
        finder_type,
        finder_phonenumber: finder_phoneNumber,
        finder_studentid: finder_studentId,
        finder_universityemail: finder_universityEmail,
        namereport,
        staffname: staffName,
        user_id: req.userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(formatItem(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/lost-items/:id/upload-image (Upload image)
exports.uploadLostItemImage = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: item, error: findError } = await supabase
      .from('items')
      .select()
      .eq('id', id)
      .single();

    if (findError || !item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    if (item.picture) {
      const oldPath = path.join(__dirname, '../../', item.picture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const picturePath = `/uploads/${req.file.filename}`;

    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update({ picture: picturePath })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Image uploaded successfully', picture: picturePath, item: formatItem(updatedItem) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/:id/image (Serve image)
exports.getLostItemImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: item, error } = await supabase
      .from('items')
      .select('picture')
      .eq('id', id)
      .single();

    if (error || !item || !item.picture) {
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
      picture,
      receiver,
      staffName
    } = req.body;

    const { data: updatedItem, error } = await supabase
      .from('items')
      .update({
        name,
        category,
        place,
        date,
        description,
        status,
        locker,
        finder_type,
        finder_phonenumber: finder_phoneNumber,
        finder_studentid: finder_studentId,
        finder_universityemail: finder_universityEmail,
        namereport,
        picture,
        receiver,
        staffname: staffName
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Lost item not found' });
      }
      throw error;
    }

    res.status(200).json({ message: 'Lost item updated successfully', item: formatItem(updatedItem) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/lost-items/status/removed/:id (Quick return item)
exports.returnLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { receiver } = req.body;

    const { data: updatedItem, error } = await supabase
      .from('items')
      .update({
        status: 'removed',
        receiver: receiver || 'Anonymous Claimer'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Lost item not found' });
      }
      throw error;
    }

    res.status(200).json({ message: 'Item marked as returned successfully', item: formatItem(updatedItem) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/lost-items/delete/:id (Delete record permanently)
exports.deleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: item, error: findError } = await supabase
      .from('items')
      .select('picture')
      .eq('id', id)
      .single();

    if (findError || !item) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    if (item.picture) {
      const imagePath = path.join(__dirname, '../../', item.picture);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: 'Lost item deleted permanently from database' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
