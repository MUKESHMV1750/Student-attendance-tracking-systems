const mongoose = require('mongoose');

const attendanceAuditSchema = new mongoose.Schema({
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true },
  oldStatus: { type: String, enum: ['present', 'absent'], required: true },
  newStatus: { type: String, enum: ['present', 'absent'], required: true },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  reason: { type: String, required: true },
  editedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceAudit', attendanceAuditSchema);
