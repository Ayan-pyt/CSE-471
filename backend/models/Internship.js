const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  minCGPA: { type: Number, default: 0 },
  department: { type: String },
  requiredSkills: [
    {
      skill: { type: String, required: true },
      weight: { type: Number, min: 1, max: 10, default: 5 },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Internship', internshipSchema);
