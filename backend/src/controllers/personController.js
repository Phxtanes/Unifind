const supabase = require("../config/supabase");

// ดึงข้อมูลบุคคล (Persons) ทั้งหมดในระบบ
exports.getPersons = async (req, res) => {
  try {
    const { data, error } = await supabase.from("persons").select("*");

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ค้นหาหรือบันทึกบุคคลใหม่ (ป้อนผู้ส่งพบ/ผู้ติดต่อรับคืนของหาย)
exports.findOrCreatePerson = async (req, res) => {
  try {
    const { person_type, full_name, student_id, email, phone, department } =
      req.body;

    // ตรวจสอบความซ้ำซ้อนจาก รหัสนักศึกษา, เบอร์โทรศัพท์ หรือ ชื่อ-สกุล
    let query = supabase.from("persons").select("*");
    if (student_id) {
      query = query.eq("student_id", student_id);
    } else if (phone) {
      query = query.eq("phone", phone);
    } else {
      query = query.eq("full_name", full_name);
    }

    const { data: existingPerson } = await query.maybeSingle();

    if (existingPerson) {
      return res.status(200).json(existingPerson);
    }

    // หากไม่ซ้ำ ให้สร้างเป็นเรคคอร์ดใหม่
    const { data: newPerson, error: insertError } = await supabase
      .from("persons")
      .insert({ person_type, full_name, student_id, email, phone, department })
      .select()
      .single();

    if (insertError) throw insertError;
    res.status(201).json(newPerson);
  } catch (error) {
    console.error("❌ Error in findOrCreatePerson:", error);
    res.status(500).json({ message: error.message });
  }
};
