const {
  generateLearningRecommendations,
  getLearningPath,
  fetchYouTubeResources,
} = require('../utils/learningRecommendationService');
const { calculateMatchInsights } = require('../utils/matchingEngine');
const StudentProfile = require('../models/StudentProfile');
const Internship = require('../models/Internship');
const LearningRecommendation = require('../models/LearningRecommendation');

/**
 * GET /api/learning/recommendations/:internshipId
 * Get personalized learning recommendations for a student for a specific internship
 */
exports.getRecommendationsForInternship = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const userId = req.user.id; // From auth middleware

    // Get student profile
    const studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get internship
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    // Calculate match insights to identify missing skills
    const matchInsights = calculateMatchInsights({
      requiredSkills: internship.requiredSkills,
      studentSkills: studentProfile.skills,
      verifiedSkills: studentProfile.verifiedSkills,
      cgpa: studentProfile.cgpa,
      minCGPA: internship.minCGPA,
    });

    // Generate learning recommendations with YouTube videos
    const recommendations = await generateLearningRecommendations(
      matchInsights.skillGapReport.missingSkills
    );

    // Save recommendation record
    const learningRecord = new LearningRecommendation({
      studentId: userId,
      internshipId,
      internshipTitle: internship.title,
      companyName: internship.companyName,
      matchScore: matchInsights.recommendationScore,
      missingSkills: matchInsights.skillGapReport.missingSkills,
      recommendations,
      savedAt: new Date(),
    });

    await learningRecord.save();

    res.json({
      success: true,
      internship: {
        id: internship._id,
        title: internship.title,
        company: internship.companyName,
      },
      studentMatch: {
        matchScore: matchInsights.recommendationScore,
        skillMatch: matchInsights.matchScore,
        completionRatio: matchInsights.skillGapReport.completionRatio,
      },
      missingSkills: matchInsights.skillGapReport.missingSkills.length,
      recommendations: recommendations.map((rec) => ({
        skill: rec.skill,
        priority: rec.priority,
        weight: rec.weight,
        difficulty: rec.difficulty,
        estimatedLearningTime: rec.estimatedLearningTime,
        youtubeVideos: rec.youtubeResources,
        alternativeResourceTypes: rec.alternativePaths,
        nextSteps: [
          `Start with YouTube tutorials (${rec.estimatedLearningTime}h total)`,
          'Practice with hands-on projects',
          'Get certified to verify your skills',
        ],
      })),
      savedProgress: studentProfile.learningProgress || [],
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
};

/**
 * GET /api/learning/skill/:skill
 * Get learning resources for a specific skill
 */
exports.getLearningResourcesForSkill = async (req, res) => {
  try {
    const { skill } = req.params;

    const learningPath = await getLearningPath(skill);

    if (!learningPath) {
      return res.status(404).json({ message: 'No learning resources found' });
    }

    res.json({
      success: true,
      skill,
      ...learningPath,
    });
  } catch (error) {
    console.error('Error fetching learning resources:', error);
    res.status(500).json({ message: 'Failed to fetch learning resources' });
  }
};

/**
 * GET /api/learning/youtube-search
 * Direct YouTube search endpoint
 */
exports.searchYoutube = async (req, res) => {
  try {
    const { query, maxResults = 5 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const results = await fetchYouTubeResources(query, parseInt(maxResults));

    res.json({
      success: true,
      query,
      resultsCount: results.length,
      videos: results,
    });
  } catch (error) {
    console.error('Error searching YouTube:', error);
    res.status(500).json({ message: 'Failed to search YouTube' });
  }
};

/**
 * GET /api/learning/my-recommendations
 * Get all saved learning recommendations for a student
 */
exports.getMyRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const recommendations = await LearningRecommendation.find({
      studentId: userId,
    })
      .sort({ savedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
};

/**
 * POST /api/learning/save-progress
 * Save learning progress for a skill
 */
exports.saveLearningProgress = async (req, res) => {
  try {
    const { skill, videoId, videoTitle, minutesWatched, completed } = req.body;
    const userId = req.user.id;

    const student = await StudentProfile.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // This can be extended to track video watching history
    const existingIndex = student.learningProgress?.findIndex(p => p.videoId === videoId);
    let added = false;
    if (existingIndex === -1 || existingIndex === undefined || student.learningProgress.length === 0 || !student.learningProgress.find(p => p.videoId === videoId)) {
      if (!student.learningProgress) student.learningProgress = [];
      student.learningProgress.push({
        videoId,
        skill,
        videoTitle,
        completedAt: new Date()
      });
      await student.save();
      added = true;
    }

    res.json({
      success: true,
      message: 'Learning progress saved',
      data: {
        skill,
        videoTitle,
        minutesWatched,
        completed,
        savedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ message: 'Failed to save learning progress' });
  }
};

/**
 * GET /api/learning/progress-summary
 * Get learning progress summary for a student
 */
exports.getProgressSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const recommendations = await LearningRecommendation.find({
      studentId: userId,
    });

    const totalRecommendations = recommendations.length;
    const avgMatchScore = 
      recommendations.length > 0
        ? (recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length).toFixed(2)
        : 0;

    const skillsNeeded = new Set();
    recommendations.forEach((rec) => {
      rec.missingSkills.forEach((skill) => {
        skillsNeeded.add(skill.skill);
      });
    });

    res.json({
      success: true,
      summary: {
        totalOpportunitiesViewed: totalRecommendations,
        averageMatchScore: avgMatchScore,
        uniqueSkillsToLearn: Array.from(skillsNeeded),
        skillsCount: skillsNeeded.size,
      },
    });
  } catch (error) {
    console.error('Error getting progress summary:', error);
    res.status(500).json({ message: 'Failed to get progress summary' });
  }
};
