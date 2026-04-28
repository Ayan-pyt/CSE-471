const express = require('express');
const router = express.Router();
const { getMatchedInternships, getRankedApplicants } = require('../controllers/matchController');
const { protect, authorizeRoles } = require('../middleware/auth');

// GET /api/match/internships — student gets all internships ranked by personal match score
router.get('/internships', protect, authorizeRoles('student', 'university_admin', 'system_admin'), getMatchedInternships);

// GET /api/match/applicants/:internshipId — company/admin gets ranked candidate list
router.get('/applicants/:internshipId', protect, authorizeRoles('company', 'university_admin', 'system_admin'), getRankedApplicants);

module.exports = router;
