const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
const { protect } = require('../middleware/auth');

/**
 * All routes require authentication
 */

/**
 * GET /api/learning/recommendations/:internshipId
 * Get personalized learning recommendations for a student for a specific internship
 * Identifies missing skills and provides YouTube videos + alternative learning paths
 */
router.get('/recommendations/:internshipId', protect, learningController.getRecommendationsForInternship);

/**
 * GET /api/learning/skill/:skill
 * Get learning resources (YouTube videos) for a specific skill
 * Example: /api/learning/skill/React
 */
router.get('/skill/:skill', protect, learningController.getLearningResourcesForSkill);

/**
 * GET /api/learning/youtube-search
 * Direct YouTube search endpoint
 * Query params: query (required), maxResults (optional, default 5)
 * Example: /api/learning/youtube-search?query=Python%20basics&maxResults=10
 */
router.get('/youtube-search', protect, learningController.searchYoutube);

/**
 * GET /api/learning/my-recommendations
 * Get all saved learning recommendations for the logged-in student
 * Returns up to 10 most recent recommendations
 */
router.get('/my-recommendations', protect, learningController.getMyRecommendations);

/**
 * GET /api/learning/progress-summary
 * Get learning progress summary for the student
 * Shows: total opportunities viewed, average match score, unique skills to learn
 */
router.get('/progress-summary', protect, learningController.getProgressSummary);

/**
 * POST /api/learning/save-progress
 * Save learning progress for a video watched
 * Body: { skill, videoId, videoTitle, minutesWatched, completed }
 */
router.post('/save-progress', protect, learningController.saveLearningProgress);

module.exports = router;
