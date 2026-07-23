/**
 * =========================================================================
 * 📍 LOCATION CONTROLLER (ตัวจัดการข้อมูลสถานที่และชั้นภายในอาคาร)
 * =========================================================================
 * ทำหน้าที่ประมวลผลคำขอจัดการข้อมูลสถานที่ย่อย (Locations)
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const supabase = require("../config/supabase");

/** GET /api/locations - ดึงรายการสถานที่ทั้งหมดพร้อมข้อมูลอาคารเชื่อมโยง */
exports.getLocations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*, buildings(building_name)")
      .order("location_name", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/locations - เพิ่มข้อมูลสถานที่ย่อยใหม่ */
exports.createLocation = async (req, res) => {
  try {
    const { location_name, building_id, floor, description } = req.body;
    const { data, error } = await supabase
      .from("locations")
      .insert({
        location_name,
        building_id: building_id ? parseInt(building_id) : null,
        floor: floor !== undefined ? floor : null,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** PUT /api/locations/:id - แก้ไขอัปเดตข้อมูลสถานที่ย่อย */
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { location_name, building_id, floor, description, is_active } =
      req.body;
    const { data, error } = await supabase
      .from("locations")
      .update({ location_name, building_id, floor, description, is_active })
      .eq("location_id", id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/locations/:id - ลบข้อมูลสถานที่ออกจากระบบ */
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("location_id", id);

    if (error) throw error;
    res.status(200).json({ message: "Location deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
