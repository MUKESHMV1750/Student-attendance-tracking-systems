const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true },
  startTime: { type: String },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  method: { type: String, enum: ['QR', 'PIN', 'STAFF'], default: 'QR' },
  latitude: { type: Number },
  longitude: { type: Number },
  markedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
