const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

// Helper to get category name by ID
const getCategoryName = (categoryId) => {
  const mapping = {
    1: 'เอกสาร',
    2: 'กระเป๋า',
    3: 'โทรศัพท์',
    4: 'กุญแจ',
    5: 'เครื่องประดับ'
  };
  return mapping[categoryId] || 'อื่นๆ';
};

// Helper to map category name to category_id
const getCategoryId = async (categoryName) => {
  const mapping = {
    'Electronics': 3,
    'โทรศัพท์': 3,
    'Documents': 1,
    'เอกสาร': 1,
    'Clothing': 5,
    'เครื่องประดับ': 5,
    'Accessories': 2,
    'กระเป๋า': 2,
    'กุญแจ': 4,
    'Other': 5,
    'อื่นๆ': 5
  };
  return mapping[categoryName] || 5;
};

// Helper to map location name to location_id
const getLocationId = async (locationName) => {
  if (!locationName) return 1;
  const mapping = {
    'อาคารเรียน 1': 1,
    'ตึก 1': 1,
    'ห้องสมุด': 2,
    'โรงอาหาร': 3,
    'ลานจอดรถ': 4
  };
  for (const [key, val] of Object.entries(mapping)) {
    if (locationName.includes(key)) return val;
  }
  return 1; // Default to Location 1
};

// Helper to get locker_id by code
const getLockerId = async (lockerCode) => {
  if (!lockerCode) return null;
  const { data } = await supabase
    .from('Locker')
    .select('locker_id')
    .ilike('locker_code', `%${lockerCode}%`)
    .limit(1)
    .maybeSingle();
  return data ? data.locker_id : null;
};

// Helper to parse JSON description
const parseDescription = (desc) => {
  try {
    const parsed = JSON.parse(desc);
    if (parsed && typeof parsed === 'object' && ('textDescription' in parsed)) {
      return {
        textDescription: parsed.textDescription || '',
        finder_type: parsed.finder_type || null,
        finder_phoneNumber: parsed.finder_phoneNumber || null,
        finder_studentId: parsed.finder_studentId || null,
        finder_universityEmail: parsed.finder_universityEmail || null
      };
    }
  } catch (e) {
    // Not valid JSON
  }
  return {
    textDescription: desc || '',
    finder_type: null,
    finder_phoneNumber: null,
    finder_studentId: null,
    finder_universityEmail: null
  };
};

// Formatter for LostItem
const formatLostItem = (item, photos) => {
  const photo = photos.find(p => p.item_type === 'LOST' && p.item_id === item.lost_item_id);
  const locationName = item.Location ? item.Location.location_name : 'ไม่ระบุสถานที่';
  const floorName = item.floor ? ` ชั้น ${item.floor}` : '';
  const parsed = parseDescription(item.description);
  return {
    id: item.lost_item_id,
    name: item.item_name,
    category: getCategoryName(item.category_id),
    place: locationName + floorName,
    date: item.lost_datetime,
    description: parsed.textDescription,
    status: 'lost',
    locker: null,
    finder_type: parsed.finder_type,
    finder_phoneNumber: parsed.finder_phoneNumber,
    finder_studentId: parsed.finder_studentId,
    finder_universityEmail: parsed.finder_universityEmail,
    picture: photo ? photo.file_url : null,
    namereport: item.User ? item.User.username : null,
    receiver: null,
    staffName: item.User ? item.User.username : null
  };
};

// Formatter for FoundItem
const formatFoundItem = (item, photos) => {
  const photo = photos.find(p => p.item_type === 'FOUND' && p.item_id === item.found_item_id);
  const locationName = item.Location ? item.Location.location_name : 'ไม่ระบุสถานที่';
  const floorName = item.floor ? ` ชั้น ${item.floor}` : '';
  const parsed = parseDescription(item.description);
  return {
    id: item.found_item_id,
    name: item.item_name,
    category: getCategoryName(item.category_id),
    place: locationName + floorName,
    date: item.found_date,
    description: parsed.textDescription,
    status: item.status === 'CLAIMED' ? 'removed' : 'stored', // Map to frontend expected: 'stored' (found/stored) or 'removed' (claimed)
    locker: item.Locker ? item.Locker.locker_code : null,
    finder_type: parsed.finder_type || 'Staff',
    finder_phoneNumber: parsed.finder_phoneNumber,
    finder_studentId: parsed.finder_studentId,
    finder_universityEmail: parsed.finder_universityEmail,
    picture: photo ? photo.file_url : null,
    namereport: item.User ? item.User.username : null,
    receiver: null,
    staffName: item.User ? item.User.username : null
  };
};


// GET /api/lost-items (All items merged and sorted)
exports.getLostItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Fetch photos
    const { data: photos } = await supabase.from('ItemPhoto').select('*');

    // Fetch LostItems (without User join)
    const { data: lostData, error: lostError } = await supabase
      .from('LostItem')
      .select('*, Location(*), Category(*)');

    if (lostError) throw lostError;

    // Fetch FoundItems (without User join)
    const { data: foundData, error: foundError } = await supabase
      .from('FoundItem')
      .select('*, Location(*), Category(*), Locker(*)');

    if (foundError) throw foundError;

    // Fetch users separately
    const userIds = [
      ...new Set([
        ...(lostData || []).map(d => d.reporter_id).filter(Boolean),
        ...(foundData || []).map(d => d.finder_id).filter(Boolean)
      ])
    ];

    let users = [];
    if (userIds.length > 0) {
      const { data: userData } = await supabase
        .from('User')
        .select('user_id, username')
        .in('user_id', userIds);
      users = userData || [];
    }

    const lostFormatted = (lostData || []).map(item => {
      const user = users.find(u => u.user_id === item.reporter_id);
      return formatLostItem({ ...item, User: user }, photos || []);
    });

    const foundFormatted = (foundData || []).map(item => {
      const user = users.find(u => u.user_id === item.finder_id);
      return formatFoundItem({ ...item, User: user }, photos || []);
    });
    
    let allItems = [...lostFormatted, ...foundFormatted];
    
    // Sort by date descending
    allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Paginate in memory
    const paginatedItems = allItems.slice(offset, offset + limit);

    res.status(200).json({
      totalItems: allItems.length,
      totalPages: Math.ceil(allItems.length / limit),
      currentPage: page,
      items: paginatedItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/status/stored (Only items currently stored/found)
exports.getStoredItems = async (req, res) => {
  try {
    const { data: photos } = await supabase.from('ItemPhoto').select('*');
    const { data, error } = await supabase
      .from('FoundItem')
      .select('*, Location(*), Locker(*)')
      .in('status', ['FOUND', 'STORED'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch users
    const userIds = [...new Set((data || []).map(d => d.finder_id).filter(Boolean))];
    let users = [];
    if (userIds.length > 0) {
      const { data: userData } = await supabase.from('User').select('user_id, username').in('user_id', userIds);
      users = userData || [];
    }

    const formattedRows = (data || []).map(item => {
      const user = users.find(u => u.user_id === item.finder_id);
      return formatFoundItem({ ...item, User: user }, photos || []);
    });
    res.status(200).json(formattedRows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/status/removed (History of returned items)
exports.getRemovedItems = async (req, res) => {
  try {
    const { data: photos } = await supabase.from('ItemPhoto').select('*');
    const { data, error } = await supabase
      .from('FoundItem')
      .select('*, Location(*), Locker(*)')
      .eq('status', 'CLAIMED')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch users
    const userIds = [...new Set((data || []).map(d => d.finder_id).filter(Boolean))];
    let users = [];
    if (userIds.length > 0) {
      const { data: userData } = await supabase.from('User').select('user_id, username').in('user_id', userIds);
      users = userData || [];
    }

    const formattedRows = (data || []).map(item => {
      const user = users.find(u => u.user_id === item.finder_id);
      return formatFoundItem({ ...item, User: user }, photos || []);
    });
    res.status(200).json(formattedRows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/:id (Details of a single item)
exports.getLostItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: photos } = await supabase.from('ItemPhoto').select('*');

    // Check FoundItem first
    let { data: foundItem } = await supabase
      .from('FoundItem')
      .select('*, Location(*), Locker(*)')
      .eq('found_item_id', id)
      .maybeSingle();

    if (foundItem) {
      let user = null;
      if (foundItem.finder_id) {
        const { data: userData } = await supabase.from('User').select('username').eq('user_id', foundItem.finder_id).maybeSingle();
        user = userData;
      }
      return res.status(200).json(formatFoundItem({ ...foundItem, User: user }, photos || []));
    }

    // Check LostItem
    let { data: lostItem } = await supabase
      .from('LostItem')
      .select('*, Location(*)')
      .eq('lost_item_id', id)
      .maybeSingle();

    if (lostItem) {
      let user = null;
      if (lostItem.reporter_id) {
        const { data: userData } = await supabase.from('User').select('username').eq('user_id', lostItem.reporter_id).maybeSingle();
        user = userData;
      }
      return res.status(200).json(formatLostItem({ ...lostItem, User: user }, photos || []));
    }

    return res.status(404).json({ message: 'Item not found' });
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
      finder_universityEmail
    } = req.body;

    const categoryId = await getCategoryId(category);
    const locationId = await getLocationId(place);
    const floor = place && place.includes('ชั้น') ? place.split('ชั้น')[1].trim() : null;

    const dbDescription = JSON.stringify({
      textDescription: description || '',
      finder_type: finder_type || null,
      finder_phoneNumber: finder_phoneNumber || null,
      finder_studentId: finder_studentId || null,
      finder_universityEmail: finder_universityEmail || null
    });

    // Fetch user username to format output
    const { data: user } = await supabase.from('User').select('username').eq('user_id', req.userId).maybeSingle();

    if (status === 'lost') {
      // Create LostItem
      const { data, error } = await supabase
        .from('LostItem')
        .insert({
          item_name: name,
          category_id: categoryId,
          location_id: locationId,
          floor,
          lost_datetime: date || new Date().toISOString(),
          description: dbDescription,
          status: 'LOST',
          reporter_id: req.userId
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger Matching asynchronously
      const matchingService = require('../services/matchingService');
      matchingService.checkLostItemMatch(data);

      res.status(201).json(formatLostItem({ ...data, User: user }, []));
    } else {
      // Create FoundItem
      const lockerId = await getLockerId(locker);
      const { data, error } = await supabase
        .from('FoundItem')
        .insert({
          item_name: name,
          category_id: categoryId,
          location_id: locationId,
          floor,
          found_date: date ? date.split('T')[0] : new Date().toISOString().split('T')[0],
          description: dbDescription,
          status: status === 'claimed' ? 'CLAIMED' : 'STORED',
          locker_id: lockerId,
          finder_id: req.userId
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger Matching asynchronously if not claimed
      if (status !== 'claimed') {
        const matchingService = require('../services/matchingService');
        matchingService.checkFoundItemMatch(data);
      }

      res.status(201).json(formatFoundItem({ ...data, User: user }, []));
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/lost-items/:id/upload-image (Upload image)
exports.uploadLostItemImage = async (req, res) => {
  try {
    const { id } = req.params;

    let isLost = false;
    let { data: foundItem } = await supabase.from('FoundItem').select('found_item_id').eq('found_item_id', id).maybeSingle();
    
    if (!foundItem) {
      let { data: lostItem } = await supabase.from('LostItem').select('lost_item_id').eq('lost_item_id', id).maybeSingle();
      if (!lostItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      isLost = true;
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Check if there is an existing primary photo, and delete the physical file
    const { data: oldPhoto } = await supabase
      .from('ItemPhoto')
      .select('*')
      .eq('item_type', isLost ? 'LOST' : 'FOUND')
      .eq('item_id', id)
      .eq('is_primary', true)
      .maybeSingle();

    if (oldPhoto) {
      const oldPath = path.join(__dirname, '../../', oldPhoto.file_url);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error(e); }
      }
      // Delete old photo record
      await supabase.from('ItemPhoto').delete().eq('photo_id', oldPhoto.photo_id);
    }

    const picturePath = `/uploads/${req.file.filename}`;

    const { data: photo, error: photoError } = await supabase
      .from('ItemPhoto')
      .insert({
        item_type: isLost ? 'LOST' : 'FOUND',
        item_id: parseInt(id),
        file_url: picturePath,
        file_name: req.file.filename,
        is_primary: true
      })
      .select()
      .single();

    if (photoError) throw photoError;

    res.status(200).json({ message: 'Image uploaded successfully', picture: picturePath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/lost-items/:id/image (Serve image)
exports.getLostItemImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists in FoundItem or LostItem
    let isLost = false;
    let { data: foundItem } = await supabase.from('FoundItem').select('found_item_id').eq('found_item_id', id).maybeSingle();
    
    if (!foundItem) {
      let { data: lostItem } = await supabase.from('LostItem').select('lost_item_id').eq('lost_item_id', id).maybeSingle();
      if (!lostItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      isLost = true;
    }

    const { data: photo, error } = await supabase
      .from('ItemPhoto')
      .select('file_url')
      .eq('item_type', isLost ? 'LOST' : 'FOUND')
      .eq('item_id', id)
      .eq('is_primary', true)
      .maybeSingle();

    if (error || !photo || !photo.file_url) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imagePath = path.join(__dirname, '../../', photo.file_url);
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
      finder_universityEmail
    } = req.body;

    const categoryId = await getCategoryId(category);
    const locationId = await getLocationId(place);
    const floor = place && place.includes('ชั้น') ? place.split('ชั้น')[1].trim() : null;

    const dbDescription = JSON.stringify({
      textDescription: description || '',
      finder_type: finder_type || null,
      finder_phoneNumber: finder_phoneNumber || null,
      finder_studentId: finder_studentId || null,
      finder_universityEmail: finder_universityEmail || null
    });

    // Determine which table has this ID
    let isLost = false;
    let { data: foundItem } = await supabase.from('FoundItem').select('*').eq('found_item_id', id).maybeSingle();
    
    if (!foundItem) {
      let { data: lostItem } = await supabase.from('LostItem').select('*').eq('lost_item_id', id).maybeSingle();
      if (!lostItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      isLost = true;
    }

    // Fetch user username to format output
    const { data: user } = await supabase.from('User').select('username').eq('user_id', req.userId).maybeSingle();

    if (isLost) {
      const { data: updatedItem, error } = await supabase
        .from('LostItem')
        .update({
          item_name: name,
          category_id: categoryId,
          location_id: locationId,
          floor,
          lost_datetime: date,
          description: dbDescription,
          status: status === 'removed' || status === 'claimed' ? 'CLAIMED' : 'LOST'
        })
        .eq('lost_item_id', id)
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ message: 'Lost item updated successfully', item: formatLostItem({ ...updatedItem, User: user }, []) });
    } else {
      const lockerId = await getLockerId(locker);
      const { data: updatedItem, error } = await supabase
        .from('FoundItem')
        .update({
          item_name: name,
          category_id: categoryId,
          location_id: locationId,
          floor,
          found_date: date ? date.split('T')[0] : undefined,
          description: dbDescription,
          status: status === 'removed' || status === 'claimed' ? 'CLAIMED' : 'STORED',
          locker_id: lockerId
        })
        .eq('found_item_id', id)
        .select()
        .single();

      if (error) throw error;
      res.status(200).json({ message: 'Found item updated successfully', item: formatFoundItem({ ...updatedItem, User: user }, []) });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/lost-items/status/removed/:id (Quick return item)
exports.returnLostItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: updatedItem, error } = await supabase
      .from('FoundItem')
      .update({
        status: 'CLAIMED'
      })
      .eq('found_item_id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Lost item not found' });
      }
      throw error;
    }

    res.status(200).json({ message: 'Item marked as returned successfully', item: formatFoundItem(updatedItem, []) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/lost-items/delete/:id (Delete record permanently)
exports.deleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's FoundItem or LostItem
    let isLost = false;
    let { data: foundItem } = await supabase.from('FoundItem').select('found_item_id').eq('found_item_id', id).maybeSingle();
    
    if (!foundItem) {
      let { data: lostItem } = await supabase.from('LostItem').select('lost_item_id').eq('lost_item_id', id).maybeSingle();
      if (!lostItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      isLost = true;
    }

    // Get and delete primary photo
    const { data: photo } = await supabase
      .from('ItemPhoto')
      .select('*')
      .eq('item_type', isLost ? 'LOST' : 'FOUND')
      .eq('item_id', id)
      .maybeSingle();

    if (photo && photo.file_url) {
      const imagePath = path.join(__dirname, '../../', photo.file_url);
      if (fs.existsSync(imagePath)) {
        try { fs.unlinkSync(imagePath); } catch (e) { console.error(e); }
      }
      // Delete from DB
      await supabase.from('ItemPhoto').delete().eq('photo_id', photo.photo_id);
    }

    if (isLost) {
      const { error } = await supabase.from('LostItem').delete().eq('lost_item_id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('FoundItem').delete().eq('found_item_id', id);
      if (error) throw error;
    }

    res.status(200).json({ message: 'Item deleted permanently from database' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
