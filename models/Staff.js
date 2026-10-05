const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  staffId: { type: String, unique: true },
  department: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

staffSchema.pre('save', function() {
  if (!this.staffId) {
    this.staffId = 'STAFF' + Date.now().toString().slice(-5);
  }
});

module.exports = mongoose.model('Staff', staffSchema);
