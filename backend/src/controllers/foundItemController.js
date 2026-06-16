const supabase = require('../config/supabase');

// Helper to format Supabase response
const formatItem = (item) => {
  if (!item) return null;
  return {
    ...item,
    categoryName: item.Category?.category_name,
    locationName: item.Location?.location_name,
    lockerCode: item.Locker?.locker_code,
    finderName: item.Person?.full_name,
    finderPhone: item.Person?.phone
  };
};

// GET /api/found-items
exports.getFoundItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('FoundItem')
      .select('*, Category(category_name), Location(location_name), Locker(locker_code), Person!finder_id(full_name, phone, student_id, email, person_type)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      const itemIds = data.map(item => item.found_item_id);
      const { data: photos } = await supabase
        .from('ItemPhoto')
        .select('*')
        .eq('item_type', 'FOUND')
        .in('item_id', itemIds);

      data.forEach(item => {
        const primaryPhoto = photos?.find(p => p.item_id === item.found_item_id && p.is_primary) || photos?.find(p => p.item_id === item.found_item_id);
        item.image_url = primaryPhoto ? primaryPhoto.file_url : null;
      });
    }

    res.status(200).json({
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      items: (data || []).map(formatItem)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/found-items/:id
exports.getFoundItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('FoundItem')
      .select('*, Category(category_name), Location(location_name), Locker(locker_code), Person!finder_id(full_name, phone, student_id, email)')
      .eq('found_item_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'Found item not found' });
      throw error;
    }

    const { data: photos } = await supabase
      .from('ItemPhoto')
      .select('*')
      .eq('item_type', 'FOUND')
      .eq('item_id', id);

    const primaryPhoto = photos?.find(p => p.is_primary) || photos?.[0];
    data.image_url = primaryPhoto ? primaryPhoto.file_url : null;

    res.status(200).json(formatItem(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/found-items
exports.createFoundItem = async (req, res) => {
  try {
    console.log('POST /api/found-items - Body:', req.body);
    console.log('POST /api/found-items - File:', req.file);
    const {
      item_name,
      category_id,
      location_id,
      floor,
      found_date,
      description,
      status,
      locker_id,
      finder_id
    } = req.body;

    const categoryId = category_id ? parseInt(category_id) : null;
    const locationId = location_id ? parseInt(location_id) : null;
    const lockerId = locker_id ? parseInt(locker_id) : null;
    const finderId = finder_id ? parseInt(finder_id) : null;

    const { data, error } = await supabase
      .from('FoundItem')
      .insert({
        item_name,
        category_id: categoryId,
        location_id: locationId,
        floor,
        found_date,
        description,
        status: status || 'FOUND',
        locker_id: lockerId,
        finder_id: finderId
      })
      .select('*, Category(category_name), Location(location_name), Locker(locker_code), Person!finder_id(full_name, phone)')
      .single();

    if (error) throw error;

    // Upload to Supabase Storage if file exists
    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('item-photos')
          .getPublicUrl(fileName);

        const fileUrl = publicUrlData.publicUrl;

        const { error: photoError } = await supabase.from('ItemPhoto').insert({
          item_type: 'FOUND',
          item_id: data.found_item_id,
          file_url: fileUrl,
          file_name: file.originalname,
          is_primary: true
        });

        if (photoError) {
          console.error('Error inserting ItemPhoto to database:', photoError.message);
        } else {
          data.image_url = fileUrl;
        }
      }
    }

    res.status(201).json(formatItem(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/found-items/:id
exports.updateFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('PUT /api/found-items/:id - Body:', req.body);
    console.log('PUT /api/found-items/:id - File:', req.file);
    const {
      item_name,
      category_id,
      location_id,
      floor,
      found_date,
      description,
      status,
      locker_id,
      finder_id
    } = req.body;

    const categoryId = category_id !== undefined ? (category_id && category_id !== 'null' ? parseInt(category_id) : null) : undefined;
    const locationId = location_id !== undefined ? (location_id && location_id !== 'null' ? parseInt(location_id) : null) : undefined;
    const lockerId = locker_id !== undefined ? (locker_id && locker_id !== 'null' ? parseInt(locker_id) : null) : undefined;
    const finderId = finder_id !== undefined ? (finder_id && finder_id !== 'null' ? parseInt(finder_id) : null) : undefined;

    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (item_name !== undefined) updateData.item_name = item_name;
    if (categoryId !== undefined) updateData.category_id = categoryId;
    if (locationId !== undefined) updateData.location_id = locationId;
    if (floor !== undefined) updateData.floor = floor;
    if (found_date !== undefined) updateData.found_date = found_date;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (lockerId !== undefined) updateData.locker_id = lockerId;
    if (finderId !== undefined) updateData.finder_id = finderId;

    const { data: updatedItem, error } = await supabase
      .from('FoundItem')
      .update(updateData)
      .eq('found_item_id', id)
      .select('*, Category(category_name), Location(location_name), Locker(locker_code), Person!finder_id(full_name, phone)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'Found item not found' });
      throw error;
    }

    // Upload to Supabase Storage if file exists
    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('item-photos')
          .getPublicUrl(fileName);

        const fileUrl = publicUrlData.publicUrl;

        // Set is_primary to false for existing photos of this item
        await supabase
          .from('ItemPhoto')
          .update({ is_primary: false })
          .eq('item_type', 'FOUND')
          .eq('item_id', id);

        const { error: photoError } = await supabase.from('ItemPhoto').insert({
          item_type: 'FOUND',
          item_id: id,
          file_url: fileUrl,
          file_name: file.originalname,
          is_primary: true
        });

        if (photoError) {
          console.error('Error inserting ItemPhoto to database:', photoError.message);
        }
      }
    }

    // If assigned to locker, mark locker as IN_USE
    if (lockerId && status === 'STORED') {
        await supabase.from('Locker').update({ status: 'IN_USE' }).eq('locker_id', lockerId);
    }

    // Fetch the primary photo URL to return in response
    const { data: photos } = await supabase
      .from('ItemPhoto')
      .select('*')
      .eq('item_type', 'FOUND')
      .eq('item_id', id);

    const primaryPhoto = photos?.find(p => p.is_primary) || photos?.[0];
    updatedItem.image_url = primaryPhoto ? primaryPhoto.file_url : null;

    res.status(200).json({ message: 'Found item updated successfully', item: formatItem(updatedItem) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/found-items/:id
exports.deleteFoundItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { error: deleteError } = await supabase
      .from('FoundItem')
      .delete()
      .eq('found_item_id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: 'Found item deleted permanently' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
