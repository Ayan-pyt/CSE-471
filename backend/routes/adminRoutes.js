const express = require('express');
const router = express.Router();
const {
  getPendingCompanyRegistrations,
  reviewCompanyRegistration,
  flagFraudulentAccount,
  updateAlgorithmWeights,
  getAlgorithmWeights,
  getSystemActivity,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/companies/pending', protect, authorizeRoles('system_admin', 'university_admin'), getPendingCompanyRegistrations);
router.put('/companies/:companyId/review', protect, authorizeRoles('system_admin', 'university_admin'), reviewCompanyRegistration);
router.put('/users/:userId/fraud', protect, authorizeRoles('system_admin', 'university_admin'), flagFraudulentAccount);
router.get('/algorithm-weights', protect, authorizeRoles('system_admin', 'university_admin'), getAlgorithmWeights);
router.put('/algorithm-weights', protect, authorizeRoles('system_admin', 'university_admin'), updateAlgorithmWeights);
router.get('/activity', protect, authorizeRoles('system_admin', 'university_admin'), getSystemActivity);

module.exports = router;
