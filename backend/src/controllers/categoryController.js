const supabase = require('../config/supabase');

exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .order('category_name', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    const { data, error } = await supabase
      .from('Category')
      .insert({ category_name, description })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
