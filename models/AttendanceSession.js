const mongoose = require('mongoose');
const crypto = require('crypto');

const attendanceSessionSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  timetableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  expiryTime: { type: String, required: true },
  qrToken: { type: String, unique: true },
  pinCode: { type: String },
  sessionType: { type: String, enum: ['QR', 'PIN', 'BOTH'], default: 'BOTH' },
  status: { type: String, enum: ['active', 'expired', 'closed'], default: 'active' }
}, { timestamps: true });

attendanceSessionSchema.pre('save', function(next) {
  if (!this.qrToken) {
    this.qrToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
