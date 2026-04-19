const mongoose = require('mongoose');

const internshipTemplateSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  minCGPA: { type: Number, default: 0 },
  department: { type: String },
  requiredSkills: [
    {
      skill: { type: String, required: true },
      weight: { type: Number, min: 1, max: 10, default: 5 },
    },
  ],
  sourceInternshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
}, { timestamps: true });

module.exports = mongoose.model('InternshipTemplate', internshipTemplateSchema);
