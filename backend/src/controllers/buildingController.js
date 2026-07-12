const supabase = require('../config/supabase');

exports.getBuildings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .order('building_name', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBuilding = async (req, res) => {
  try {
    const { building_name, description } = req.body;
    const { data, error } = await supabase
      .from('buildings')
      .insert({ building_name, description })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { building_name, description } = req.body;
    const { data, error } = await supabase
      .from('buildings')
      .update({ building_name, description })
      .eq('building_id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('building_id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Building deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
