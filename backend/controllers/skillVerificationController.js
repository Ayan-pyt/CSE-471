const SkillVerification = require('../models/SkillVerification');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { notify } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogger');

const verifyStudentSkill = async (req, res) => {
  const { studentId, skill, source, note } = req.body;
  if (!studentId || !skill) return res.status(400).json({ message: 'studentId and skill are required' });

  try {
    const student = await User.findById(studentId).lean();
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    const verification = await SkillVerification.create({
      studentId,
      skill: skill.trim(),
      source: source || 'manual',
      note: note || '',
      verifiedBy: req.user._id,
      verifierRole: req.user.role,
    });

    const profile = await StudentProfile.findOne({ userId: studentId });
    if (profile) {
      const exists = (profile.verifiedSkills || []).find(
        (entry) => entry.skill.toLowerCase() === skill.trim().toLowerCase()
      );

      if (!exists) {
        profile.verifiedSkills.push({
          skill: skill.trim(),
          verifiedBy: req.user._id,
          verifierRole: req.user.role,
          source: source || 'manual',
          note: note || '',
          verifiedAt: new Date(),
        });
      }

      if (!(profile.skills || []).some((s) => s.toLowerCase() === skill.trim().toLowerCase())) {
        profile.skills.push(skill.trim());
      }

      await profile.save();
    }

    await notify({
      userId: studentId,
      type: 'SYSTEM',
      title: 'Skill Verified',
      message: `${skill.trim()} has been verified on your profile.`,
      metadata: { verificationId: verification._id },
    });

    await logActivity({
      actor: req.user,
      action: 'SKILL_VERIFIED',
      entityType: 'SkillVerification',
      entityId: verification._id,
      details: { studentId, skill: skill.trim() },
    });

    res.status(201).json(verification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify skill', error: err.message });
  }
};

const getMyVerifiedSkills = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id }).populate('verifiedSkills.verifiedBy', 'name role');
    if (!profile) return res.json([]);
    res.json(profile.verifiedSkills || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch verified skills', error: err.message });
  }
};

const getStudentVerifications = async (req, res) => {
  try {
    const data = await SkillVerification.find({ studentId: req.params.studentId })
      .populate('verifiedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch verifications', error: err.message });
  }
};

module.exports = {
  verifyStudentSkill,
  getMyVerifiedSkills,
  getStudentVerifications,
};
