/**
 * =========================================================================
 * 📦 FOUND ITEM CONTROLLER (ตัวจัดการข้อมูลสิ่งของพบเจอ)
 * =========================================================================
 * ทำหน้าที่ประมวลผลคำขอเกี่ยวกับสิ่งของพบเจอ (Found Items) ทั้งการดึงข้อมูล,
 * การลงทะเบียนสิ่งของใหม่โดยเจ้าหน้าที่, การรับของคืน (Claim), 
 * รวมถึงการเชื่อมต่อระบบวิเคราะห์คู่แมตช์อัตโนมัติ (AI Matching Process)
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const supabase = require('../config/supabase');

/* =========================================================================
 * 🛠️ 1. DATA FORMATTING & HELPER FUNCTIONS
 * ========================================================================= */

/** Map status_code string → status_id from found_item_statuses */
const getStatusId = async (statusCode) => {
  if (!statusCode) return null;
  const { data } = await supabase
    .from('found_item_statuses')
    .select('status_id')
    .eq('status_code', statusCode.toUpperCase())
    .maybeSingle();
  return data ? data.status_id : null;
};

/** Format a row from "items" table into the shape the frontend expects */
const formatItem = (item) => {
  if (!item) return null;
  return {
    item_id: item.item_id,
    id: item.item_id,
    item_name: item.item_name,
    name: item.item_name,
    description: item.description,
    locker_id: item.locker_id || null,
    image_url: item.image_url || null,
    picture: item.image_url || null,
    found_date: item.found_date,
    date: item.found_date,
    remark: item.remark || null,
    category_id: item.category_id,
    location_id: item.location_id,
    status_id: item.status_id,
    finder_id: item.finder_id,
    claimer_id: item.claimer_id,
    claim_date: item.claim_date || null,
    created_by: item.created_by,
    categoryName: item.categories?.category_name || null,
    locationName: item.locations
      ? item.locations.location_name + (item.locations.floor ? ` ชั้น ${item.locations.floor}` : '')
      : null,
    status: item.found_item_statuses?.status_code || null,
    statusName: item.found_item_statuses?.status_name_th || null,
    finderName: item.finder?.full_name || null,
    finderPhone: item.finder?.phone || null,
    finderType: item.finder?.person_type || null,
    finderStudentId: item.finder?.student_id || null,
    finderEmail: item.finder?.email || null,
    Person: item.finder || null,
    claimerName: item.claimer?.full_name || null,
    claimerPhone: item.claimer?.phone || null,
    claimerStudentId: item.claimer?.student_id || null,
    claimerEmail: item.claimer?.email || null,
    claimerType: item.claimer?.person_type || null,
    staffName: item.staff?.nickname || item.staff?.username || null,
    namereport: item.staff?.nickname || item.staff?.username || null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

const SELECT_FIELDS = `
  *,
  categories(category_name),
  locations(location_name, floor),
  found_item_statuses(status_code, status_name_th),
  finder:persons!items_finder_id_fkey(full_name, phone, student_id, email, person_type),
  claimer:persons!items_claimer_id_fkey(full_name, phone, student_id, email, person_type),
  staff:users!items_created_by_fkey(username, nickname)
`.trim();


/* =========================================================================
 * 📥 2. ITEM QUERY & DISCOVERY HANDLERS (การดึงข้อมูลสิ่งของ)
 * ========================================================================= */

/** GET /api/items - ดึงรายการสิ่งของพบเจอทั้งหมดแบบ Pagination */
exports.getItems = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const statusCode = req.query.status;

    let query = supabase
      .from('items')
      .select(SELECT_FIELDS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusCode) {
      const statusId = await getStatusId(statusCode);
      if (statusId) query = query.eq('status_id', statusId);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.status(200).json({
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      items: (data || []).map(formatItem),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/items/:id - ดึงข้อมูลสิ่งของพบเจอตาม ID */
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('items')
      .select(SELECT_FIELDS)
      .eq('item_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'Item not found' });
      throw error;
    }

    res.status(200).json(formatItem(data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================================================
 * 📝 3. ITEM MUTATION HANDLERS (การเพิ่ม แก้ไข ลบสิ่งของ)
 * ========================================================================= */

/** POST /api/items - บันทึกสร้างสิ่งของพบเจอใหม่เข้าสู่ระบบ */
exports.createItem = async (req, res) => {
  try {
    const {
      item_name,
      category_id,
      location_id,
      found_date,
      description,
      status,
      locker_id,
      finder_id,
    } = req.body;

    const statusId = await getStatusId(status || 'FOUND');

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

    let validCreatedBy = req.userId || null;
    if (validCreatedBy) {
      const { data: userExists } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", validCreatedBy)
        .maybeSingle();
      if (!userExists) {
        const { data: firstUser } = await supabase
          .from("users")
          .select("user_id")
          .limit(1)
          .maybeSingle();
        validCreatedBy = firstUser ? firstUser.user_id : null;
      }
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        item_name,
        category_id: category_id ? parseInt(category_id) : null,
        location_id: location_id ? parseInt(location_id) : null,
        found_date: found_date || new Date().toISOString(),
        description,
        status_id: statusId,
        locker_id: locker_id || null,
        image_url: imageUrl,
        finder_id: finder_id ? parseInt(finder_id) : null,
        created_by: validCreatedBy,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    try {
      const matchingService = require('../services/matchingService');
      const aiMatch = await matchingService.checkFoundItemMatch(data);
      return res.status(201).json({ ...formatItem(data), aiMatch });
    } catch (matchErr) {
      console.warn('AI matching error (non-fatal):', matchErr.message);
    }

    res.status(201).json(formatItem(data));
  } catch (error) {
    console.error("❌ Error in createItem:", error);
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/items/:id - แก้ไขอัปเดตรายละเอียดสิ่งของพบเจอ */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_name,
      category_id,
      location_id,
      found_date,
      description,
      status,
      locker_id,
      finder_id,
    } = req.body;

    const updateData = { updated_at: new Date().toISOString() };

    if (item_name    !== undefined) updateData.item_name    = item_name;
    if (description  !== undefined) updateData.description  = description;
    if (found_date   !== undefined) updateData.found_date   = found_date;
    if (locker_id    !== undefined) updateData.locker_id    = locker_id || null;

    if (category_id !== undefined)
      updateData.category_id = category_id ? parseInt(category_id) : null;
    if (location_id !== undefined)
      updateData.location_id = location_id ? parseInt(location_id) : null;
    if (finder_id !== undefined)
      updateData.finder_id = finder_id ? parseInt(finder_id) : null;

    if (status !== undefined) {
      const statusId = await getStatusId(status);
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
      .from('items')
      .update(updateData)
      .eq('item_id', id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ message: 'Item not found' });
      throw error;
    }

    res.status(200).json({ message: 'Item updated successfully', item: formatItem(updatedItem) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/items/:id - ลบสิ่งของออกจากระบบ */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('item_id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================================================
 * 🤝 4. ITEM STATUS ACTIONS & AI MATCHING HANDLERS
 * ========================================================================= */

/** POST /api/items/:id/claim - บันทึกการรับคืนสิ่งของโดยผู้เป็นเจ้าของ */
exports.claimItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { claimer_id, claim_date, remark, status = 'CLAIMED' } = req.body;

    if (!claimer_id) {
      return res.status(400).json({ message: 'claimer_id is required' });
    }

    const { data: existing, error: findError } = await supabase
      .from('items')
      .select('item_id, status_id, found_item_statuses(status_code)')
      .eq('item_id', id)
      .maybeSingle();

    if (findError || !existing) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const currentStatus = existing.found_item_statuses?.status_code;
    if (currentStatus === 'CLAIMED' || currentStatus === 'RETURNED') {
      return res.status(400).json({ message: 'Item is already claimed or returned' });
    }

    const statusId = await getStatusId(status);

    const { data: updatedItem, error } = await supabase
      .from('items')
      .update({
        claimer_id: parseInt(claimer_id),
        claim_date: claim_date || new Date().toISOString(),
        remark: remark || null,
        status_id: statusId,
        updated_at: new Date().toISOString(),
      })
      .eq('item_id', id)
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    res.status(200).json({ message: 'Item claimed successfully', item: formatItem(updatedItem) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/items/analyze-match - วิเคราะห์เปรียบเทียบความคล้ายคลึงระหว่างของหายและของพบ */
exports.analyzeItemsMatch = async (req, res) => {
  try {
    const { lost_item_id, item_id } = req.body;

    if (!lost_item_id || !item_id) {
      return res.status(400).json({ message: 'lost_item_id and item_id are required' });
    }

    const { data: lostItem, error: lostError } = await supabase
      .from('lost_items')
      .select('*, locations(location_name), categories(category_name)')
      .eq('lost_item_id', lost_item_id)
      .single();

    if (lostError || !lostItem) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    const { data: foundItem, error: foundError } = await supabase
      .from('items')
      .select('*, locations(location_name), categories(category_name)')
      .eq('item_id', item_id)
      .single();

    if (foundError || !foundItem) {
      return res.status(404).json({ message: 'Found item not found' });
    }

    const matchingService = require('../services/matchingService');
    const analysis = await matchingService.analyzeMatchBetweenItems(lostItem, foundItem);

    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
