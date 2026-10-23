const Notification = require('../models/Notification');

// GET /api/notifications - User gets all their own notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user._id },
        { userId: req.user._id }
      ]
    })
      .sort('-createdAt')
      .populate('notice', 'title category priority deadline originalFileUrl')
      .populate('noticeId', 'title category priority deadline originalFileUrl');

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/notifications/unread-count - Fast count of unread notifications for current user
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        { recipient: req.user._id },
        { userId: req.user._id }
      ],
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/:id/read - Mark single notification as read (Strictly scoped to owner)
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { recipient: req.user._id },
        { userId: req.user._id }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or access denied' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/read-all - Mark all unread notifications of user as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        $or: [
          { recipient: req.user._id },
          { userId: req.user._id }
        ],
        isRead: false
      },
      { $set: { isRead: true } }
    );

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications/:id - Delete a notification (Strictly scoped to owner)
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { recipient: req.user._id },
        { userId: req.user._id }
      ]
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or access denied' });
    }

    res.json({ message: 'Notification removed successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
