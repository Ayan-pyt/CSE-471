const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  getMyInterviews,
  confirmInterviewAvailability,
  updateInterviewStatus,
} = require('../controllers/interviewController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/', protect, authorizeRoles('company', 'system_admin', 'university_admin'), scheduleInterview);
router.get('/my', protect, getMyInterviews);
router.put('/:id/confirm', protect, authorizeRoles('student'), confirmInterviewAvailability);
router.put('/:id/status', protect, authorizeRoles('company', 'system_admin', 'university_admin'), updateInterviewStatus);

module.exports = router;
