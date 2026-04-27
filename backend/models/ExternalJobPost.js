const mongoose = require('mongoose');

const externalJobPostSchema = new mongoose.Schema({
  source: {
    type: String,
    default: 'adzuna',
  },
  externalJobId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  url: {
    type: String,
    default: '',
  },
  skills: [{ type: String }],
  salaryText: {
    type: String,
    default: '',
  },
  postedAt: {
    type: Date,
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
  },
  rawData: {
    type: Object,
    default: {},
  },
}, { timestamps: true });

externalJobPostSchema.index({ source: 1, externalJobId: 1 }, { unique: true, sparse: true });
externalJobPostSchema.index({ postedAt: -1 });
externalJobPostSchema.index({ skills: 1 });

module.exports = mongoose.model('ExternalJobPost', externalJobPostSchema);