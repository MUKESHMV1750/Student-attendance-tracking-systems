const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true, unique: true, uppercase: true },
  subjectName: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  year: { type: String, required: true, enum: ['I', 'II', 'III', 'IV'] },
  semester: { type: String, required: true },
  section: { type: String, required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
