const Notification = require('../models/Notification');
const Application = require('../models/Application');

const getMyNotifications = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));

  try {
    const [items, total] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount: await Notification.countDocuments({ userId: req.user._id, isRead: false }),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load notifications', error: err.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark read', error: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'Notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all read', error: err.message });
  }
};

const generateDeadlineReminders = async (req, res) => {
  try {
    const soon = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const apps = await Application.find({
      studentId: req.user._id,
      status: { $nin: ['Rejected', 'Selected'] },
    }).populate('internshipId', 'title deadline');

    let created = 0;
    for (const app of apps) {
      const deadline = app.internshipId?.deadline;
      if (!deadline || deadline > soon || deadline < new Date()) continue;

      const reminderKey = `${app._id}_${new Date(deadline).toISOString().slice(0, 10)}`;
      const exists = await Notification.findOne({
        userId: req.user._id,
        type: 'DEADLINE_REMINDER',
        'metadata.reminderKey': reminderKey,
      }).lean();

      if (exists) continue;

      await Notification.create({
        userId: req.user._id,
        type: 'DEADLINE_REMINDER',
        title: 'Upcoming Internship Deadline',
        message: `${app.internshipId?.title || 'An internship'} has an upcoming deadline on ${new Date(deadline).toLocaleDateString()}.`,
        metadata: {
          internshipId: app.internshipId?._id,
          applicationId: app._id,
          reminderKey,
        },
      });

      created += 1;
    }

    res.json({ message: 'Deadline reminders processed', created });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate reminders', error: err.message });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
  generateDeadlineReminders,
};
