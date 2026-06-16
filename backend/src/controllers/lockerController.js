const supabase = require('../config/supabase');

exports.getLockers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Locker')
      .select('*, Location(location_name)')
      .order('locker_code', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createLocker = async (req, res) => {
  try {
    const { locker_code, location_id, description } = req.body;
    const { data, error } = await supabase
      .from('Locker')
      .insert({ locker_code, location_id, description, status: 'AVAILABLE' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
