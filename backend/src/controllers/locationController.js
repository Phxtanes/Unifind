const supabase = require("../config/supabase");

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
