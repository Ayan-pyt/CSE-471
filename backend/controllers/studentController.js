const StudentProfile = require('../models/StudentProfile');
const path = require('path');

// POST /api/student/profile — create
const createProfile = async (req, res) => {
  const { name, cgpa, department, graduationYear, certifications, projects, skills } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    const existing = await StudentProfile.findOne({ userId: req.user._id });
    if (existing) return res.status(400).json({ message: 'Profile already exists. Use PUT to update.' });

    const profile = await StudentProfile.create({
      userId: req.user._id,
      name,
      cgpa,
      department,
      graduationYear,
      certifications: certifications || [],
      projects: projects || [],
      skills: skills || [],
    });
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/student/profile — update
const updateProfile = async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.verifiedSkills;

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      payload,
      { new: true, upsert: true, runValidators: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/student/profile/:id
const getProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.params.id }).populate('userId', 'name email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/student/profile/me - own profile
const getMyProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createProfile, updateProfile, getProfile, getMyProfile };
