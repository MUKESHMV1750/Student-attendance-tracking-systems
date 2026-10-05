const Subject = require('../models/Subject');
const Staff = require('../models/Staff');

const getSubjects = async (req, res) => {
  try {
    const { department, year, section } = req.query;
    let query = { status: 'active' };
    if (department) query.department = department;
    if (year) query.year = year;
    if (section) query.section = section;
    const subjects = await Subject.find(query).populate('staffId', 'name staffId');
    res.json({ subjects });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('staffId', 'name');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createSubject = async (req, res) => {
  try {
    const { subjectCode, subjectName, department, year, semester, section, staffId } = req.body;
    if (await Subject.findOne({ subjectCode })) return res.status(400).json({ message: 'Subject code already exists' });
    const subject = await Subject.create({ subjectCode, subjectName, department, year, semester, section, staffId });
    res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject updated', subject });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    subject.status = 'inactive';
    await subject.save();
    res.json({ message: 'Subject deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getSubjects, getSubject, createSubject, updateSubject, deleteSubject };
