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
  verifiedSkills: [
    {
      skill: { type: String, required: true },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifierRole: { type: String },
      source: {
        type: String,
        enum: ['certification', 'project_review', 'internship_performance', 'manual'],
        default: 'manual',
      },
      note: { type: String, default: '' },
      verifiedAt: { type: Date, default: Date.now },
    },
  ],
  cvUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
