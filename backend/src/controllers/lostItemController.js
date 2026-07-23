/**
 * =========================================================================
 * 🔍 LOST ITEM CONTROLLER (ตัวจัดการข้อมูลสิ่งของสูญหาย)
 * =========================================================================
 * ทำหน้าที่ควบคุมและประมวลผลการแจ้งเรื่องของหาย (Lost Items) 
 * ทั้งการบันทึกจากฝั่งเจ้าหน้าที่บนเว็บไซต์ และการบันทึกที่ส่งสัญญาณมาจาก LINE OA บอท
 * รวมถึงทำการประสานงานกับ AI Matching เพื่อจับคู่สิ่งของกับคลังแบบ Real-time
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const supabase = require('../config/supabase');

/* =========================================================================
 * 🛠️ 1. DATA FORMATTING & HELPER FUNCTIONS
 * ========================================================================= */

/** Map status_code string → status_id from lost_item_statuses */
const getLostStatusId = async (statusCode) => {
  if (!statusCode) return null;
  const { data } = await supabase
    .from('lost_item_statuses')
    .select('status_id')
    .eq('status_code', statusCode.toUpperCase())
    .maybeSingle();
  return data ? data.status_id : null;
};

const formatLostItem = (item) => {
  if (!item) return null;
  const locationName = item.locations
    ? item.locations.location_name + (item.locations.floor ? ` ชั้น ${item.locations.floor}` : '')
    : 'ไม่ระบุสถานที่';

  return {
    lost_item_id: item.lost_item_id,
    id: item.lost_item_id,
    item_name: item.item_name,
    name: item.item_name,
    description: item.description,
    image_url: item.image_url || null,
    picture: item.image_url || null,
    lost_datetime: item.lost_datetime,
    date: item.lost_datetime,
    category_id: item.category_id,
    location_id: item.location_id,
    status_id: item.status_id,
    reporter_id: item.reporter_id,
    categoryName: item.categories?.category_name || null,
    category: item.categories?.category_name || null,
    locationName,
    place: locationName,
    status: item.lost_item_statuses?.status_code || 'LOST',
    statusName: item.lost_item_statuses?.status_name_th || null,
    reporterName: item.reporter?.full_name || null,
    reporterPhone: item.reporter?.phone || null,
    reporterType: item.reporter?.person_type || null,
    reporterStudentId: item.reporter?.student_id || null,
    reporterEmail: item.reporter?.email || null,
    Person: item.reporter || null,
    type: 'lost',
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

const SELECT_FIELDS = `
  *,
  categories(category_name),
  locations(location_name, floor),
  lost_item_statuses(status_code, status_name_th),
  reporter:persons!lost_items_reporter_id_fkey(full_name, phone, student_id, email, person_type)
`.trim();


/* =========================================================================
 * 📥 2. LOST ITEM QUERY HANDLERS (การดึงข้อมูลสิ่งของสูญหาย)
 * ========================================================================= */

/** GET /api/lost-items - ดึงรายการแจ้งของหายทั้งหมดแบบ Pagination */
exports.getLostItems = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const statusCode = req.query.status;

    let query = supabase
      .from('lost_items')
      .select(SELECT_FIELDS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusCode) {
      const statusId = await getLostStatusId(statusCode);
      if (statusId) query = query.eq('status_id', statusId);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.status(200).json({
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      items: (data || []).map(formatLostItem),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/lost-items/:id - ดึงข้อมูลแจ้งของหายตาม ID */
exports.getLostItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('lost_items')
      .select(SELECT_FIELDS)
      .eq('lost_item_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'Lost item not found' });
      throw error;
    }

    res.status(200).json(formatLostItem(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================================================
 * 📝 3. LOST ITEM MUTATION HANDLERS (การสร้าง แก้ไข ลบรายการของหาย)
 * ========================================================================= */

/** POST /api/lost-items - บันทึกการแจ้งของหายใหม่เข้าสู่ระบบ */
exports.createLostItem = async (req, res) => {
  try {
    const {
      item_name,
      category_id,
      location_id,
      lost_datetime,
      description,
      status,
      reporter_id,
    } = req.body;

    const statusId = await getLostStatusId(status || 'LOST');

    let imageUrl = null;
    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      } else {
        console.error('Storage upload error:', uploadError.message);
      }
    }

    const { data, error } = await supabase
      .from('lost_items')
      .insert({
        item_name,
        category_id: category_id ? parseInt(category_id) : null,
        location_id: location_id ? parseInt(location_id) : null,
        lost_datetime: lost_datetime || new Date().toISOString(),
        description,
        status_id: statusId,
        image_url: imageUrl,
        reporter_id: reporter_id ? parseInt(reporter_id) : null,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    try {
      const matchingService = require('../services/matchingService');
      const aiMatch = await matchingService.checkLostItemMatch(data);
      return res.status(201).json({ ...formatLostItem(data), aiMatch });
    } catch (matchErr) {
      console.warn('AI matching error (non-fatal):', matchErr.message);
    }

    res.status(201).json(formatLostItem(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/lost-items/:id - อัปเดตแก้ไขข้อมูลรายการแจ้งของหาย */
exports.updateLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_name,
      category_id,
      location_id,
      lost_datetime,
      description,
      status,
      reporter_id,
    } = req.body;

    const updateData = { updated_at: new Date().toISOString() };

    if (item_name    !== undefined) updateData.item_name    = item_name;
    if (description  !== undefined) updateData.description  = description;
    if (lost_datetime !== undefined) updateData.lost_datetime = lost_datetime;
    if (category_id !== undefined)
      updateData.category_id = category_id ? parseInt(category_id) : null;
    if (location_id !== undefined)
      updateData.location_id = location_id ? parseInt(location_id) : null;
    if (reporter_id !== undefined)
      updateData.reporter_id = reporter_id ? parseInt(reporter_id) : null;

    if (status !== undefined) {
      const statusId = await getLostStatusId(status);
      if (statusId) updateData.status_id = statusId;
    }

    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(fileName);
        updateData.image_url = urlData.publicUrl;
      }
    }

    const { data: updatedItem, error } = await supabase
      .from('lost_items')
      .update(updateData)
      .eq('lost_item_id', id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'Lost item not found' });
      throw error;
    }

    res.status(200).json({ message: 'Lost item updated successfully', item: formatLostItem(updatedItem) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/lost-items/:id - ลบรายการแจ้งของหายออกจากระบบ */
exports.deleteLostItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('lost_items')
      .delete()
      .eq('lost_item_id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Lost item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
