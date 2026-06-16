const supabase = require('../config/supabase');

exports.getLocations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Location')
      .select('*')
      .order('location_name', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { location_name, description } = req.body;
    const { data, error } = await supabase
      .from('Location')
      .insert({ location_name, description })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.messageข้อมูลผู้พบส่ง });
  }
};
