const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedbackForApplication,
  getMyFeedback,
} = require('../controllers/feedbackController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/', protect, authorizeRoles('student', 'company'), submitFeedback);
router.get('/application/:applicationId', protect, getFeedbackForApplication);
router.get('/my', protect, getMyFeedback);

module.exports = router;
