// AsyncHandler wrapper to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getUserNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, skip = 0, unreadOnly = false } = req.query;
  
  const result = await notificationService.getUserNotifications(
    req.user.id, 
    {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true',
      sort: { createdAt: -1 }
    }
  );
  
  res.status(200).json({
    success: true,
    data: result.notifications,
    pagination: result.pagination
  });
});

/**
 * @desc    Get unread notifications count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadNotificationsCount(req.user.id);
  
  res.status(200).json({
    success: true,
    count
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(req.params.id, req.user.id);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found or you do not have permission to update it'
    });
  }
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsAsRead(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const success = await notificationService.deleteNotification(req.params.id, req.user.id);
  
  if (!success) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found or you do not have permission to delete it'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

/**
 * @desc    Update notification preferences
 * @route   PUT /api/v1/notifications/preferences
 * @access  Private
 */
exports.updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { email, taskUpdates, deadlineReminders } = req.body;
  
  // Update user notification preferences
  const user = await req.user.model('User').findByIdAndUpdate(
    req.user.id,
    {
      'notifications.email': email !== undefined ? email : req.user.notifications?.email,
      'notifications.taskUpdates': taskUpdates !== undefined ? taskUpdates : req.user.notifications?.taskUpdates,
      'notifications.deadlineReminders': deadlineReminders !== undefined ? deadlineReminders : req.user.notifications?.deadlineReminders
    },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: user.notifications
  });
});

/**
 * @desc    Send system notification (admin only)
 * @route   POST /api/v1/notifications/system
 * @access  Private/Admin
 */
exports.sendSystemNotification = asyncHandler(async (req, res) => {
  const { title, message, recipients, roles, priority, sendEmail } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({
      success: false,
      error: 'Title and message are required'
    });
  }
  
  const count = await notificationService.sendSystemNotification(title, message, {
    recipients,
    roles,
    priority,
    sendEmail,
    metadata: {
      sentBy: req.user.id,
      sentByName: req.user.name
    }
  });
  
  res.status(200).json({
    success: true,
    message: `System notification sent to ${count} users`,
    count
  });
});