const express = require('express');
const router = express.Router();

// Import controller functions
const {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getDashboardData,
  getUserReport,
  getClientReport,
  exportReportPDF,
  exportReportCSV
} = require('../controllers/reportController');

// Import middleware
const { protect } = require('../middleware/auth');

// Report routes
router.get('/daily', protect, getDailyReport);
router.get('/weekly', protect, getWeeklyReport);
router.get('/monthly', protect, getMonthlyReport);
router.get('/dashboard', protect, getDashboardData);
router.get('/user', protect, getUserReport);
router.get('/client', protect, getClientReport);

// Export routes
router.get('/:type/export/pdf', protect, exportReportPDF);
router.get('/:type/export/csv', protect, exportReportCSV);

module.exports = router;