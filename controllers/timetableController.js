const Timetable = require('../models/Timetable');

const getTimetables = async (req, res) => {
  try {
    const { department, year, section, day } = req.query;
    let query = { status: 'active' };
    if (department) query.department = department;
    if (year) query.year = year;
    if (section) query.section = section;
    if (day) query.day = day;
    const timetables = await Timetable.find(query)
      .populate('subjectId', 'subjectCode subjectName')
      .populate('staffId', 'name staffId')
      .sort({ day: 1, startTime: 1 });
    res.json({ timetables });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createTimetable = async (req, res) => {
  try {
    const { day, startTime, endTime, subjectId, staffId, department, year, section, room } = req.body;
    const existing = await Timetable.findOne({ day, startTime, room, status: 'active' });
    if (existing) return res.status(400).json({ message: 'Room already booked at this time' });
    const timetable = await Timetable.create({ day, startTime, endTime, subjectId, staffId, department, year, section, room });
    res.status(201).json({ message: 'Timetable entry created', timetable });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!timetable) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', timetable });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteTimetable = async (req, res) => {
  try {
    const t = await Timetable.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    t.status = 'inactive';
    await t.save();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getTimetables, createTimetable, updateTimetable, deleteTimetable };
