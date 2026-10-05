const Student = require('../models/Student');
const User = require('../models/User');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

const getStudents = async (req, res) => {
  try {
    const { department, year, section, search } = req.query;
    let query = { status: 'active' };
    if (department) query.department = department;
    if (year) query.year = year;
    if (section) query.section = section;
    if (search) {
      const re = new RegExp(search, 'i');
      query = { ...query, $or: [{ name: re }, { rollNo: re }, { registerNo: re }, { email: re }] };
    }
    const students = await Student.find(query).sort({ name: 1 });
    res.json({ students, total: students.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createStudent = async (req, res) => {
  try {
    const { name, rollNo, registerNo, department, year, section, email, phone, username, password } = req.body;
    if (await Student.findOne({ registerNo })) return res.status(400).json({ message: 'Register number already exists' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create({ username: username || registerNo, email, password: password || registerNo, role: 'student' });
    const student = await Student.create({ name, rollNo, registerNo, department, year, section, email, phone, userId: user._id });
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated successfully', student });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.status = 'inactive';
    await student.save();
    res.json({ message: 'Student deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const importStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    let created = 0, skipped = 0;
    for (const row of rows) {
      const registerNo = String(row['Register No'] || row['registerNo'] || '').trim();
      const email = String(row['Email'] || row['email'] || '').trim().toLowerCase();
      const name = String(row['Name'] || row['name'] || '').trim();
      if (!registerNo || !name || !email) { skipped++; continue; }
      if (await Student.findOne({ registerNo })) { skipped++; continue; }
      const user = await User.create({ username: registerNo, email, password: registerNo, role: 'student' });
      await Student.create({
        name, rollNo: String(row['Roll No'] || row['rollNo'] || '').trim(),
        registerNo, department: String(row['Department'] || row['department'] || '').trim(),
        year: String(row['Year'] || row['year'] || 'I').trim(),
        section: String(row['Section'] || row['section'] || '').trim(),
        email, phone: String(row['Phone'] || row['phone'] || '').trim(), userId: user._id
      });
      created++;
    }
    res.json({ message: `Import complete. Created: ${created}, Skipped: ${skipped}`, created, skipped });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const exportStudents = async (req, res) => {
  try {
    const students = await Student.find({ status: 'active' }).sort({ name: 1 });
    const data = students.map((s, i) => ({
      'S.No': i + 1, 'Name': s.name, 'Roll No': s.rollNo, 'Register No': s.registerNo,
      'Department': s.department, 'Year': s.year, 'Section': s.section, 'Email': s.email, 'Phone': s.phone || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, importStudents, exportStudents };
