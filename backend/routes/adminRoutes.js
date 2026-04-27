const express = require('express');
const router = express.Router();
const {
  getPendingCompanyRegistrations,
  reviewCompanyRegistration,
  flagFraudulentAccount,
  getFraudulentAccounts,
  removeFraudulentAccount,
  getStudentsForSkillVerification,
  updateAlgorithmWeights,
  getAlgorithmWeights,
  getSystemActivity,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect, authorizeRoles('university_admin', 'system_admin'));

router.get('/companies/pending', getPendingCompanyRegistrations);
router.put('/companies/:companyId/review', reviewCompanyRegistration);

router.get('/users/fraudulent', getFraudulentAccounts);
router.put('/users/:userId/fraudulent', flagFraudulentAccount);
router.delete('/users/:userId/fraudulent', removeFraudulentAccount);

router.get('/students/verification-candidates', getStudentsForSkillVerification);

router.get('/algorithm-weights', getAlgorithmWeights);
router.put('/algorithm-weights', updateAlgorithmWeights);

router.get('/activity', getSystemActivity);

module.exports = router;
