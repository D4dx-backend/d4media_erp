const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Get unread notifications count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Update notification preferences
router.put('/preferences', notificationController.updateNotificationPreferences);

// Send system notification (admin only)
router.post('/system', authorize('super_admin', 'department_admin'), notificationController.sendSystemNotification);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;