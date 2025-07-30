const express = require('express');
const router = express.Router();
const {
  getAllEquipment,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  requestCheckout,
  approveCheckout,
  returnEquipment,
  getCheckoutHistory,
  getPendingApprovals,
  generateEquipmentListPDF,
  sendEquipmentListWhatsApp,
  recordInOut,
  getInOutHistory,
  addMaintenanceRecord,
  getMaintenanceHistory,
  getMaintenanceReport,
  createEventCheckout,
  getEventCheckouts,
  getEventCheckout,
  returnEventCheckout
} = require('../controllers/equipmentController');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Apply authentication to all routes
router.use(protect);

// Equipment management routes
router.route('/')
  .get(logActivity('view', 'equipment'), getAllEquipment)
  .post(logActivity('equipment_create', 'equipment'), createEquipment);

router.route('/:id')
  .get(logActivity('view', 'equipment'), getEquipment)
  .put(logActivity('equipment_update', 'equipment'), updateEquipment)
  .delete(logActivity('equipment_delete', 'equipment'), deleteEquipment);

// Checkout management routes
router.post('/checkout/request', logActivity('equipment_checkout_request', 'equipment'), requestCheckout);
router.put('/checkout/:id/approve', logActivity('equipment_checkout_approve', 'equipment'), approveCheckout);
router.put('/checkout/:id/return', logActivity('equipment_return', 'equipment'), returnEquipment);

// History and reporting routes
router.get('/checkout/history', logActivity('view', 'equipment'), getCheckoutHistory);
router.get('/checkout/pending', logActivity('view', 'equipment'), getPendingApprovals);

// In/Out tracking routes
router.post('/:id/inout', logActivity('equipment_inout', 'equipment'), recordInOut);
router.get('/:id/inout-history', logActivity('view', 'equipment'), getInOutHistory);

// Maintenance routes
router.post('/:id/maintenance', logActivity('equipment_maintenance', 'equipment'), addMaintenanceRecord);
router.get('/:id/maintenance-history', logActivity('view', 'equipment'), getMaintenanceHistory);
router.get('/maintenance-report', logActivity('view', 'equipment'), getMaintenanceReport);

// Event-based checkout routes
router.route('/event-checkout')
  .post(logActivity('equipment_event_checkout', 'equipment'), createEventCheckout)
  .get(logActivity('view', 'equipment'), getEventCheckouts);

router.route('/event-checkout/:id')
  .get(logActivity('view', 'equipment'), getEventCheckout)
  .put(logActivity('equipment_event_return', 'equipment'), returnEventCheckout);

router.put('/event-checkout/:id/return', logActivity('equipment_event_return', 'equipment'), returnEventCheckout);

// Report generation routes
router.get('/report/pdf', logActivity('export', 'equipment'), generateEquipmentListPDF);
router.post('/report/whatsapp', logActivity('equipment_send_whatsapp', 'equipment'), sendEquipmentListWhatsApp);

module.exports = router;