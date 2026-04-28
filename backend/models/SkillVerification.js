const mongoose = require('mongoose');

const skillVerificationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: String, required: true },
  source: {
    type: String,
    enum: ['certification', 'project_review', 'internship_performance', 'manual'],
    default: 'manual',
  },
  note: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifierRole: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SkillVerification', skillVerificationSchema);
