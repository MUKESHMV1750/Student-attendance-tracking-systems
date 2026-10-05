const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AttendanceAudit = require('../models/AttendanceAudit');
const XLSX = require('xlsx');
const { calculatePercentage, getAttendanceStatus } = require('../utils/percentageCalculator');

// ---- Overall Attendance Report ----
const getOverallReport = async (req, res) => {
  try {
    const { department, year, section, subjectId, date } = req.query;
    let studentQuery = { status: 'active' };
    if (department) studentQuery.department = department;
    if (year) studentQuery.year = year;
    if (section) studentQuery.section = section;
    const students = await Student.find(studentQuery).sort({ rollNo: 1 });

    let attendanceQuery = {};
    if (subjectId) attendanceQuery.subjectId = subjectId;
    if (date) attendanceQuery.date = date;

    const report = [];
    for (const student of students) {
      const allQuery = { studentId: student._id, ...attendanceQuery };
      const total = await Attendance.countDocuments(allQuery);
      const present = await Attendance.countDocuments({ ...allQuery, status: 'present' });
      const pct = calculatePercentage(present, total);
      const statusInfo = getAttendanceStatus(pct);
      report.push({ student, total, present, absent: total - present, percentage: pct, ...statusInfo });
    }
    res.json({ report, total: report.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Date-wise Report ----
const getDatewiseReport = async (req, res) => {
  try {
    const { subjectId, date } = req.query;
    let query = {};
    if (subjectId) query.subjectId = subjectId;
    if (date) query.date = date;
    const attendance = await Attendance.find(query)
      .populate('studentId', 'name rollNo registerNo department year section')
      .populate('subjectId', 'subjectCode subjectName')
      .sort({ date: -1, 'studentId.rollNo': 1 });
    res.json({ attendance });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Export Report ----
const exportReport = async (req, res) => {
  try {
    const { type, department, year, section, subjectId } = req.query;
    let studentQuery = { status: 'active' };
    if (department) studentQuery.department = department;
    if (year) studentQuery.year = year;
    if (section) studentQuery.section = section;
    const students = await Student.find(studentQuery).sort({ rollNo: 1 });

    const subjects = subjectId ? await Subject.find({ _id: subjectId }) : await Subject.find({ status: 'active', ...(department && { department }), ...(year && { year }), ...(section && { section }) });

    const data = [];
    for (const student of students) {
      const row = { 'Name': student.name, 'Roll No': student.rollNo, 'Register No': student.registerNo };
      let totalPresent = 0, totalClasses = 0;
      for (const sub of subjects) {
        const total = await Attendance.countDocuments({ studentId: student._id, subjectId: sub._id });
        const present = await Attendance.countDocuments({ studentId: student._id, subjectId: sub._id, status: 'present' });
        const pct = calculatePercentage(present, total);
        row[sub.subjectCode] = `${present}/${total} (${pct}%)`;
        totalPresent += present;
        totalClasses += total;
      }
      row['Overall'] = `${calculatePercentage(totalPresent, totalClasses)}%`;
      data.push(row);
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Audit Log ----
const getAuditLog = async (req, res) => {
  try {
    const audits = await AttendanceAudit.find()
      .populate('studentId', 'name rollNo')
      .populate('subjectId', 'subjectCode subjectName')
      .populate('editedBy', 'name staffId')
      .sort({ editedAt: -1 })
      .limit(100);
    res.json({ audits });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getOverallReport, getDatewiseReport, exportReport, getAuditLog };
