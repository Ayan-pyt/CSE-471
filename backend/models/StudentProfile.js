const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  cgpa: { type: Number, min: 0, max: 4 },
  department: { type: String },
  graduationYear: { type: Number },
  certifications: [{ type: String }],
  projects: [{ type: String }],
  skills: [{ type: String }],
  cvUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
