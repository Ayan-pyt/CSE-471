const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Fetch learning resources from YouTube for a given skill
 * @param {string} skill - The skill to search for
 * @param {number} maxResults - Maximum number of videos to return (default: 5)
 * @returns {Promise<Array>} Array of learning resources
 */
const fetchYouTubeResources = async (skill, maxResults = 5) => {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        q: `${skill} tutorial course learn`,
        type: 'video',
        maxResults: maxResults,
        order: 'relevance',
        key: YOUTUBE_API_KEY,
        videoCaption: 'closedCaption', // Videos with captions
        videoDuration: 'medium', // Medium length (4-20 min)
        region: 'US',
      },
    });

    return response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error('YouTube API error:', error.message);
    return [];
  }
};

/**
 * Generate personalized learning recommendations based on missing skills
 * @param {Array} missingSkills - Array of missing skills with recommendations
 * @returns {Promise<Array>} Personalized learning paths with videos
 */
const generateLearningRecommendations = async (missingSkills) => {
  try {
    const recommendations = [];

    for (const skillItem of missingSkills || []) {
      const skillName = skillItem.skill || skillItem;
      
      // Fetch videos for this skill
      const videos = await fetchYouTubeResources(skillName, 3);

      recommendations.push({
        skill: skillName,
        weight: skillItem.weight || 1,
        priority: calculatePriority(skillItem.weight),
        youtubeResources: videos,
        alternativePaths: [
          {
            type: 'Udemy Course',
            description: `${skillName} - Master Class`,
          },
          {
            type: 'Coursera',
            description: `Professional Certificate in ${skillName}`,
          },
          {
            type: 'Certification',
            description: `Industry-recognized ${skillName} certification`,
          },
        ],
        estimatedLearningTime: estimateTime(skillName),
        difficulty: estimateDifficulty(skillName),
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error.message);
    return [];
  }
};

/**
 * Calculate priority based on weight (higher weight = higher priority)
 */
const calculatePriority = (weight) => {
  if (weight >= 8) return 'critical';
  if (weight >= 5) return 'high';
  if (weight >= 3) return 'medium';
  return 'low';
};

/**
 * Estimate learning time in hours
 */
const estimateTime = (skill) => {
  const skillLevelMap = {
    javascript: 40,
    react: 30,
    nodejs: 25,
    python: 35,
    java: 45,
    sql: 20,
    docker: 15,
    aws: 30,
    html: 15,
    css: 15,
    git: 10,
  };

  const normalized = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const [key, hours] of Object.entries(skillLevelMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hours;
    }
  }

  return 25; // Default estimate
};

/**
 * Estimate difficulty level
 */
const estimateDifficulty = (skill) => {
  const advanced = ['aws', 'kubernetes', 'machine learning', 'ml', 'ai', 'deep learning'];
  const intermediate = ['react', 'nodejs', 'docker', 'sql', 'python', 'java', 'express'];
  const beginner = ['html', 'css', 'git', 'javascript basics', 'communication'];

  const normalized = skill.toLowerCase();

  if (advanced.some((s) => normalized.includes(s))) return 'Advanced';
  if (intermediate.some((s) => normalized.includes(s))) return 'Intermediate';
  if (beginner.some((s) => normalized.includes(s))) return 'Beginner';

  return 'Intermediate';
};

/**
 * Get learning recommendation for a specific skill
 */
const getLearningPath = async (skill) => {
  try {
    const videos = await fetchYouTubeResources(skill, 5);

    return {
      skill,
      youtubeResources: videos,
      estimatedTime: estimateTime(skill),
      difficulty: estimateDifficulty(skill),
      nextSteps: [
        'Watch 2-3 introductory videos to understand fundamentals',
        'Follow along with practical tutorial videos',
        'Build a small project applying the learned concepts',
        'Take a certification course to validate knowledge',
      ],
    };
  } catch (error) {
    console.error('Error getting learning path:', error.message);
    return null;
  }
};

module.exports = {
  fetchYouTubeResources,
  generateLearningRecommendations,
  getLearningPath,
};
