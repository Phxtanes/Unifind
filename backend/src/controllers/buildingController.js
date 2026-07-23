/**
 * =========================================================================
 * 🏢 BUILDING CONTROLLER (ตัวจัดการข้อมูลอาคาร/ตึกเรียน)
 * =========================================================================
 * ทำหน้าที่ประมวลผลคำขอจัดการข้อมูลมาสเตอร์ตารางอาคาร (Buildings)
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const supabase = require("../config/supabase");

/** GET /api/buildings - ดึงรายการอาคารเรียนทั้งหมด */
exports.getBuildings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("buildings")
      .select("*")
      .order("building_name", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/buildings - เพิ่มอาคารใหม่เข้าสู่ระบบ */
exports.createBuilding = async (req, res) => {
  try {
    const { building_name, description } = req.body;
    const { data, error } = await supabase
      .from("buildings")
      .insert({ building_name, description })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/buildings/:id - แก้ไขอัปเดตข้อมูลอาคาร */
exports.updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { building_name, description } = req.body;
    const { data, error } = await supabase
      .from("buildings")
      .update({ building_name, description })
      .eq("building_id", id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/buildings/:id - ลบข้อมูลอาคารออกจากระบบ */
exports.deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("buildings")
      .delete()
      .eq("building_id", id);

    if (error) throw error;
    res.status(200).json({ message: "Building deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
