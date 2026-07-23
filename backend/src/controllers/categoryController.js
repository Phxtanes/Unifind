/**
 * =========================================================================
 * 🏷️ CATEGORY CONTROLLER (ตัวจัดการข้อมูลหมวดหมู่สิ่งของ)
 * =========================================================================
 * ทำหน้าที่ประมวลผลคำขอจัดการข้อมูลหมวดหมู่ของหาย (Categories)
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const supabase = require("../config/supabase");

/** GET /api/categories - ดึงรายการหมวดหมู่สิ่งของทั้งหมด */
exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("category_name", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/categories - เพิ่มหมวดหมู่สิ่งของใหม่ */
exports.createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    const { data, error } = await supabase
      .from("categories")
      .insert({ category_name, description })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/categories/:id - แก้ไขอัปเดตข้อมูลหมวดหมู่สิ่งของ */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description, is_active } = req.body;
    const { data, error } = await supabase
      .from("categories")
      .update({ category_name, description, is_active })
      .eq("category_id", id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/categories/:id - ลบหมวดหมู่สิ่งของออกจากระบบ */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("category_id", id);

    if (error) throw error;
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
