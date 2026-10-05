const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const AttendanceAudit = require('../models/AttendanceAudit');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Location = require('../models/Location');
const { validateLocation } = require('../utils/locationValidator');
const { generateQRCode } = require('../utils/generateQR');
const { generatePIN } = require('../utils/generatePIN');

// ---- Staff: Start Attendance Session ----
const startSession = async (req, res) => {
  try {
    const { subjectId, timetableId, locationId, date, startTime, expiryTime, sessionType } = req.body;
    const staff = await Staff.findOne({ userId: req.user._id });
    if (!staff) return res.status(404).json({ message: 'Staff profile not found' });
    const pinCode = String(generatePIN(4));
    const session = await AttendanceSession.create({
      subjectId, timetableId, staffId: staff._id, locationId, date, startTime, expiryTime, sessionType: sessionType || 'BOTH', pinCode
    });
    const location = await Location.findById(locationId);
    const qrData = { sessionId: session._id, token: session.qrToken, subjectId, date };
    const qrImage = await generateQRCode(qrData);
    res.status(201).json({ message: 'Attendance session started', session, qrImage, location });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Staff: Get Active Session ----
const getActiveSessions = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user._id });
    const sessions = await AttendanceSession.find({ staffId: staff._id, status: 'active' })
      .populate('subjectId', 'subjectCode subjectName')
      .populate('locationId', 'locationName latitude longitude radius')
      .sort({ createdAt: -1 });
    res.json({ sessions });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Staff: Close Session ----
const closeSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    session.status = 'closed';
    await session.save();
    res.json({ message: 'Session closed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Student: Mark Attendance via QR ----
const markAttendanceQR = async (req, res) => {
  try {
    const { qrToken, latitude, longitude } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const session = await AttendanceSession.findOne({ qrToken, status: 'active' }).populate('locationId');
    if (!session) return res.status(400).json({ message: 'Invalid or expired QR code' });

    // Time validation
    const now = new Date();
    const expiry = new Date(`${session.date} ${session.expiryTime}`);
    if (now > expiry) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({ message: 'QR code has expired. Attendance session closed.' });
    }

    // Location validation
    const loc = session.locationId;
    const locResult = validateLocation(latitude, longitude, loc.latitude, loc.longitude, loc.radius);
    if (!locResult.isValid) return res.status(400).json({ message: `You are outside the permitted attendance location. Distance: ${locResult.distance}m, Allowed: ${loc.radius}m` });

    // Duplicate check
    const existing = await Attendance.findOne({ sessionId: session._id, studentId: student._id });
    if (existing) return res.status(400).json({ message: 'Attendance already marked for this session' });

    // Student validation (department/year/section)
    const subject = await (require('../models/Subject')).findById(session.subjectId);
    if (subject && (student.department !== subject.department || student.year !== subject.year || student.section !== subject.section)) {
      return res.status(400).json({ message: 'You are not enrolled in this subject' });
    }

    const attendance = await Attendance.create({
      sessionId: session._id, studentId: student._id, subjectId: session.subjectId,
      date: session.date, startTime: session.startTime, status: 'present', method: 'QR',
      latitude, longitude
    });
    res.status(201).json({ message: 'Attendance marked successfully! You are PRESENT.', attendance });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Student: Mark Attendance via PIN ----
const markAttendancePIN = async (req, res) => {
  try {
    const { pinCode, latitude, longitude } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const session = await AttendanceSession.findOne({ pinCode, status: 'active' }).populate('locationId');
    if (!session) return res.status(400).json({ message: 'Invalid or expired PIN' });

    const now = new Date();
    const expiry = new Date(`${session.date} ${session.expiryTime}`);
    if (now > expiry) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({ message: 'PIN has expired. Attendance session closed.' });
    }

    const loc = session.locationId;
    const locResult = validateLocation(latitude, longitude, loc.latitude, loc.longitude, loc.radius);
    if (!locResult.isValid) return res.status(400).json({ message: `You are outside the permitted attendance location. Distance: ${locResult.distance}m` });

    const existing = await Attendance.findOne({ sessionId: session._id, studentId: student._id });
    if (existing) return res.status(400).json({ message: 'Attendance already marked for this session' });

    const attendance = await Attendance.create({
      sessionId: session._id, studentId: student._id, subjectId: session.subjectId,
      date: session.date, startTime: session.startTime, status: 'present', method: 'PIN',
      latitude, longitude
    });
    res.status(201).json({ message: 'Attendance marked successfully! You are PRESENT.', attendance });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Staff: Get Attendance for a Session ----
const getSessionAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ sessionId: req.params.sessionId })
      .populate('studentId', 'name rollNo registerNo')
      .populate('subjectId', 'subjectCode subjectName');
    res.json({ attendance });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Staff: Edit Attendance ----
const editAttendance = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const staff = await Staff.findOne({ userId: req.user._id });
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });
    const oldStatus = record.status;
    await AttendanceAudit.create({
      attendanceId: record._id, studentId: record.studentId, subjectId: record.subjectId,
      date: record.date, oldStatus, newStatus: status, editedBy: staff._id, reason
    });
    record.status = status;
    record.method = 'STAFF';
    await record.save();
    res.json({ message: 'Attendance updated successfully', record });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Student: View Own Attendance ----
const getMyAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const { subjectId, fromDate, toDate } = req.query;
    let query = { studentId: student._id };
    if (subjectId) query.subjectId = subjectId;
    if (fromDate && toDate) query.date = { $gte: fromDate, $lte: toDate };
    const attendance = await Attendance.find(query)
      .populate('subjectId', 'subjectCode subjectName')
      .sort({ date: -1 });
    res.json({ attendance, student });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Student/Staff: Subject-wise percentage ----
const getSubjectWiseAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    let sId = studentId;
    if (!sId) {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) return res.status(404).json({ message: 'Student not found' });
      sId = student._id;
    }
    const Subject = require('../models/Subject');
    const subjects = await Subject.find({ status: 'active' });
    const result = [];
    for (const sub of subjects) {
      const total = await Attendance.countDocuments({ studentId: sId, subjectId: sub._id });
      const present = await Attendance.countDocuments({ studentId: sId, subjectId: sub._id, status: 'present' });
      if (total > 0) {
        const percentage = parseFloat(((present / total) * 100).toFixed(2));
        result.push({
          subject: sub, total, present, absent: total - present, percentage,
          status: percentage >= 75 ? 'safe' : percentage >= 60 ? 'warning' : 'danger'
        });
      }
    }
    res.json({ attendance: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Staff: Get QR for existing session ----
const getSessionQR = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id).populate('locationId').populate('subjectId', 'subjectCode subjectName');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const qrData = { sessionId: session._id, token: session.qrToken, subjectId: session.subjectId, date: session.date };
    const qrImage = await generateQRCode(qrData);
    res.json({ session, qrImage });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Staff: Get Full Class Roster with Attendance Status ----
const getManualClassRoster = async (req, res) => {
  try {
    const { subjectId, date, department, year, section } = req.query;
    if (!subjectId || !date) {
      return res.status(400).json({ message: 'Subject ID and Date are required' });
    }

    const Subject = require('../models/Subject');
    const targetSubject = await Subject.findById(subjectId);
    if (!targetSubject) return res.status(404).json({ message: 'Subject not found' });

    let studentQuery = { status: 'active' };
    studentQuery.department = department || targetSubject.department;
    studentQuery.year = year || targetSubject.year;
    studentQuery.section = section || targetSubject.section;

    const students = await Student.find(studentQuery).sort({ rollNo: 1 });

    const attendanceRecords = await Attendance.find({ subjectId, date })
      .populate('studentId', 'name rollNo registerNo')
      .populate('subjectId', 'subjectCode subjectName');

    const attendanceMap = {};
    attendanceRecords.forEach(rec => {
      if (rec.studentId) {
        attendanceMap[rec.studentId._id.toString()] = rec;
      }
    });

    const roster = students.map(student => {
      const rec = attendanceMap[student._id.toString()];
      return {
        student,
        attendanceId: rec ? rec._id : null,
        status: rec ? rec.status : 'absent',
        isMarked: !!rec,
        method: rec ? rec.method : '-',
        reason: rec ? rec.reason : '',
        markedAt: rec ? rec.markedAt : null
      };
    });

    res.json({ roster, totalStudents: students.length, subject: targetSubject });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Staff: Manual Mark/Toggle Individual Student Attendance ----
const manualMarkAttendance = async (req, res) => {
  try {
    const { studentId, subjectId, date, status, reason, sessionId } = req.body;
    if (!studentId || !subjectId || !date || !status) {
      return res.status(400).json({ message: 'studentId, subjectId, date, and status are required' });
    }

    const staff = await Staff.findOne({ userId: req.user._id });
    let record = await Attendance.findOne({ studentId, subjectId, date });

    if (record) {
      const oldStatus = record.status;
      if (oldStatus !== status) {
        await AttendanceAudit.create({
          attendanceId: record._id,
          studentId: record.studentId,
          subjectId: record.subjectId,
          date: record.date,
          oldStatus,
          newStatus: status,
          editedBy: staff ? staff._id : null,
          reason: reason || 'Manual toggle by staff'
        });
      }
      record.status = status;
      record.method = 'STAFF';
      await record.save();
      return res.json({ message: `Attendance updated to ${status.toUpperCase()}`, record });
    } else {
      record = await Attendance.create({
        studentId,
        subjectId,
        date,
        sessionId: sessionId || null,
        status,
        method: 'STAFF'
      });
      if (staff) {
        await AttendanceAudit.create({
          attendanceId: record._id,
          studentId,
          subjectId,
          date,
          oldStatus: 'unmarked',
          newStatus: status,
          editedBy: staff._id,
          reason: reason || 'Manual mark by staff'
        });
      }
      return res.status(201).json({ message: `Attendance marked as ${status.toUpperCase()}`, record });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ---- Staff: Bulk Manual Mark Attendance ----
const bulkManualMarkAttendance = async (req, res) => {
  try {
    const { subjectId, date, status, studentIds, reason } = req.body;
    if (!subjectId || !date || !status || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'subjectId, date, status, and studentIds array are required' });
    }

    const staff = await Staff.findOne({ userId: req.user._id });

    for (const studentId of studentIds) {
      let record = await Attendance.findOne({ studentId, subjectId, date });
      if (record) {
        if (record.status !== status) {
          await AttendanceAudit.create({
            attendanceId: record._id,
            studentId,
            subjectId,
            date,
            oldStatus: record.status,
            newStatus: status,
            editedBy: staff ? staff._id : null,
            reason: reason || `Bulk marked ${status} by staff`
          });
          record.status = status;
          record.method = 'STAFF';
          await record.save();
        }
      } else {
        record = await Attendance.create({
          studentId,
          subjectId,
          date,
          status,
          method: 'STAFF'
        });
        if (staff) {
          await AttendanceAudit.create({
            attendanceId: record._id,
            studentId,
            subjectId,
            date,
            oldStatus: 'unmarked',
            newStatus: status,
            editedBy: staff._id,
            reason: reason || `Bulk marked ${status} by staff`
          });
        }
      }
    }

    res.json({ message: `Bulk marked ${studentIds.length} students as ${status.toUpperCase()}` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  startSession,
  getActiveSessions,
  closeSession,
  markAttendanceQR,
  markAttendancePIN,
  getSessionAttendance,
  editAttendance,
  getMyAttendance,
  getSubjectWiseAttendance,
  getSessionQR,
  getManualClassRoster,
  manualMarkAttendance,
  bulkManualMarkAttendance
};
