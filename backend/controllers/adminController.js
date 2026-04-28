const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const ActivityLog = require('../models/ActivityLog');
const { normalizeWeights } = require('../utils/settingsService');
const { notify } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogger');

const getPendingCompanyRegistrations = async (req, res) => {
  try {
    const companies = await User.find({ role: 'company', approvalStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending companies', error: err.message });
  }
};

const reviewCompanyRegistration = async (req, res) => {
  const { decision, moderationNote } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be approved or rejected' });
  }

  try {
    const user = await User.findById(req.params.companyId);
    if (!user || user.role !== 'company') return res.status(404).json({ message: 'Company not found' });

    user.approvalStatus = decision;
    user.moderationNote = moderationNote || '';
    user.isActive = decision === 'approved';
    await user.save();

    await notify({
      userId: user._id,
      type: 'SYSTEM',
      title: 'Company Registration Reviewed',
      message: decision === 'approved'
        ? 'Your company account has been approved.'
        : 'Your company account has been rejected by the admin team.',
      metadata: { moderationNote: moderationNote || '' },
    });

    await logActivity({
      actor: req.user,
      action: 'COMPANY_REGISTRATION_REVIEWED',
      entityType: 'User',
      entityId: user._id,
      details: { decision, moderationNote: moderationNote || '' },
    });

    res.json({
      message: `Company ${decision}`,
      company: { _id: user._id, name: user.name, email: user.email, approvalStatus: user.approvalStatus },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to review company', error: err.message });
  }
};

const flagFraudulentAccount = async (req, res) => {
  const { isFraudulent, reason } = req.body;
  if (typeof isFraudulent !== 'boolean') {
    return res.status(400).json({ message: 'isFraudulent must be boolean' });
  }

  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isFraudulent = isFraudulent;
    user.isActive = !isFraudulent;
    if (isFraudulent && user.role === 'company') {
      user.approvalStatus = 'rejected';
    }
    user.moderationNote = reason || '';
    await user.save();

    await notify({
      userId: user._id,
      type: 'SYSTEM',
      title: 'Account Moderation Update',
      message: isFraudulent
        ? 'Your account has been restricted due to policy violation.'
        : 'Your account restriction has been removed.',
      metadata: { reason: reason || '' },
    });

    await logActivity({
      actor: req.user,
      action: 'ACCOUNT_MODERATED',
      entityType: 'User',
      entityId: user._id,
      details: { isFraudulent, reason: reason || '' },
    });

    res.json({ message: 'Account moderation updated', user: { _id: user._id, isFraudulent: user.isFraudulent, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to moderate account', error: err.message });
  }
};

const updateAlgorithmWeights = async (req, res) => {
  const { skillWeight, cgpaWeight } = req.body;

  try {
    const normalized = normalizeWeights({ skillWeight, cgpaWeight });
    let setting = await SystemSetting.findOne();

    if (!setting) {
      setting = await SystemSetting.create({ recommendationWeights: normalized, updatedBy: req.user._id });
    } else {
      setting.recommendationWeights = normalized;
      setting.updatedBy = req.user._id;
      await setting.save();
    }

    await logActivity({
      actor: req.user,
      action: 'ALGORITHM_WEIGHTS_UPDATED',
      entityType: 'SystemSetting',
      entityId: setting._id,
      details: normalized,
    });

    res.json({ message: 'Algorithm weights updated', recommendationWeights: setting.recommendationWeights });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update algorithm weights', error: err.message });
  }
};

const getAlgorithmWeights = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne().lean();
    if (!setting) {
      return res.json({ recommendationWeights: { skillWeight: 0.75, cgpaWeight: 0.25 } });
    }

    res.json({ recommendationWeights: setting.recommendationWeights || { skillWeight: 0.75, cgpaWeight: 0.25 } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch algorithm weights', error: err.message });
  }
};

const getSystemActivity = async (req, res) => {
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
  try {
    const logs = await ActivityLog.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: err.message });
  }
};

module.exports = {
  getPendingCompanyRegistrations,
  reviewCompanyRegistration,
  flagFraudulentAccount,
  updateAlgorithmWeights,
  getAlgorithmWeights,
  getSystemActivity,
};
