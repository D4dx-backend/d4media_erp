const express = require('express');
const router = express.Router();
const {
  getUserActivities,
  getSystemActivities,
  getActivityStats,
  getDocumentAuditTrail,
  getUserAuditActivities,
  getAuditStats,
  getLoginHistory
} = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Activity routes are working',
    user: req.user ? req.user.name : 'No user',
    timestamp: new Date().toISOString()
  });
});

// Activity Log Routes
router.get('/user/:userId?', getUserActivities);
router.get('/system', getSystemActivities);
router.get('/stats', getActivityStats);
router.get('/login-history', getLoginHistory);

// Audit Trail Routes
router.get('/audit/:documentType/:documentId', getDocumentAuditTrail);
router.get('/audit/user/:userId?', getUserAuditActivities);
router.get('/audit/stats', getAuditStats);

module.exports = router;