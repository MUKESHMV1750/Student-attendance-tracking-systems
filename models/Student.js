const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, trim: true },
  registerNo: { type: String, required: true, unique: true, trim: true },
  department: { type: String, required: true },
  year: { type: String, required: true, enum: ['I', 'II', 'III', 'IV'] },
  section: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

studentSchema.pre('save', function() {
  if (!this.studentId) {
    this.studentId = 'STU' + Date.now().toString().slice(-6);
  }
});

module.exports = mongoose.model('Student', studentSchema);
