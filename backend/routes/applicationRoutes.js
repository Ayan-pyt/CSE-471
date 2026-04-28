const express = require('express');
const router = express.Router();
const {
  submitApplication, getStudentApplications, getMyApplications,
  getApplicationsByInternship, updateApplicationStatus, autoShortlistCandidates
} = require('../controllers/applicationController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/', protect, authorizeRoles('student'), submitApplication);
router.get('/my', protect, authorizeRoles('student'), getMyApplications);
router.get('/student/:id', protect, getStudentApplications);
router.get('/internship/:id', protect, authorizeRoles('company', 'university_admin', 'system_admin'), getApplicationsByInternship);
router.post('/internship/:id/auto-shortlist', protect, authorizeRoles('company', 'university_admin', 'system_admin'), autoShortlistCandidates);
router.put('/:id/status', protect, authorizeRoles('company', 'university_admin', 'system_admin'), updateApplicationStatus);

module.exports = router;
