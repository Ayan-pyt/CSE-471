const express = require('express');
const router = express.Router();
const { uploadCV, confirmSkills } = require('../controllers/cvController');
const { protect, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

router.post('/upload-cv', protect, authorizeRoles('student'), upload.single('cv'), uploadCV);
router.post('/confirm-skills', protect, authorizeRoles('student'), confirmSkills);

module.exports = router;
