const mongoose = require('mongoose');

const learningRecommendationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
  internshipTitle: { type: String },
  companyName: { type: String },
  matchScore: { type: Number },
  missingSkills: [{
    skill: { type: String },
    weight: { type: Number },
    recommendedLearningPaths: [{ type: String }],
  }],
  recommendations: [{
    skill: { type: String },
    priority: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
    weight: { type: Number },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    estimatedLearningTime: { type: Number }, // in hours
    youtubeResources: [{
      id: { type: String },
      title: { type: String },
      description: { type: String },
      thumbnail: { type: String },
      channel: { type: String },
      url: { type: String },
      publishedAt: { type: Date },
    }],
    alternativePaths: [{
      type: { type: String },
      description: { type: String },
    }],
  }],
  viewedVideos: [{
    videoId: { type: String },
    skill: { type: String },
    videoTitle: { type: String },
    minutesWatched: { type: Number },
    completed: { type: Boolean, default: false },
    watchedAt: { type: Date, default: Date.now },
  }],
  savedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LearningRecommendation', learningRecommendationSchema);
