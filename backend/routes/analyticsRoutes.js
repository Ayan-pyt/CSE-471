const express = require('express');
const router = express.Router();
const {
  getAdminDashboardAnalytics,
  getCompanyApplicantAnalytics,
  getStudentMatchTrends,
  getMarketSkillTrends,
  syncExternalMarketJobs,
  getAdminSystemSnapshot,
} = require('../controllers/analyticsController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/admin/dashboard', protect, authorizeRoles('university_admin', 'system_admin'), getAdminDashboardAnalytics);
router.get('/admin/snapshot', protect, authorizeRoles('university_admin', 'system_admin'), getAdminSystemSnapshot);
router.get('/company/applicants', protect, authorizeRoles('company'), getCompanyApplicantAnalytics);
router.get('/student/match-trends', protect, authorizeRoles('student'), getStudentMatchTrends);
router.get('/market-skill-trends', getMarketSkillTrends);
router.post('/market/sync', protect, authorizeRoles('university_admin', 'system_admin'), syncExternalMarketJobs);

module.exports = router;
