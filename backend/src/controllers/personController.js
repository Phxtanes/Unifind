const supabase = require('../config/supabase');

exports.getPersons = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('persons')
      .select('*');

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findOrCreatePerson = async (req, res) => {
  try {
    const { person_type, full_name, student_id, email, phone, department } = req.body;

    // Try to find existing person by student_id, phone, or full_name
    let query = supabase.from('persons').select('*');
    if (student_id) {
      query = query.eq('student_id', student_id);
    } else if (phone) {
      query = query.eq('phone', phone);
    } else {
      query = query.eq('full_name', full_name);
    }

    const { data: existingPerson } = await query.maybeSingle();

    if (existingPerson) {
      return res.status(200).json(existingPerson);
    }

    // Create new person
    const { data: newPerson, error: insertError } = await supabase
      .from('persons')
      .insert({ person_type, full_name, student_id, email, phone, department })
      .select()
      .single();

    if (insertError) throw insertError;
    res.status(201).json(newPerson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
