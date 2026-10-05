const Location = require('../models/Location');
const Staff = require('../models/Staff');

const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ status: 'active' });
    res.json({ locations });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createLocation = async (req, res) => {
  try {
    const { locationName, latitude, longitude, radius } = req.body;
    const staff = await Staff.findOne({ userId: req.user._id });
    const location = await Location.create({ locationName, latitude, longitude, radius: radius || 50, createdBy: staff._id });
    res.status(201).json({ message: 'Location created', location });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', location });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteLocation = async (req, res) => {
  try {
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ message: 'Not found' });
    loc.status = 'inactive';
    await loc.save();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getLocations, createLocation, updateLocation, deleteLocation };
