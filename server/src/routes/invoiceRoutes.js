const express = require('express');
const router = express.Router();

// Import auth middleware and controller
const { protect, authorize } = require('../middleware/auth');
const { logActivity, logAuditTrail, captureOriginalDocument } = require('../middleware/activityLogger');
const invoiceController = require('../controllers/invoiceController');
const Invoice = require('../models/Invoice');

// Apply authentication middleware to all routes
router.use(protect);

// GET routes
router.get('/', authorize('super_admin', 'department_admin', 'reception'), logActivity('view', 'invoice'), invoiceController.getInvoices);
router.get('/client', authorize('client'), logActivity('view', 'invoice'), invoiceController.getClientInvoices);
router.get('/stats/summary', authorize('super_admin', 'department_admin'), logActivity('view', 'invoice'), invoiceController.getInvoiceStats);
router.get('/:id', authorize('super_admin', 'department_admin', 'reception', 'client'), logActivity('view', 'invoice'), invoiceController.getInvoice);
router.get('/:id/pdf', authorize('super_admin', 'department_admin', 'reception', 'client'), logActivity('invoice_pdf_generate', 'invoice'), logAuditTrail('invoice'), invoiceController.generateInvoicePDF);
router.get('/:id/print', authorize('super_admin', 'department_admin', 'reception', 'client'), logActivity('invoice_print', 'invoice'), logAuditTrail('invoice'), invoiceController.printInvoice);

// POST routes
router.post('/', authorize('super_admin', 'department_admin', 'reception'), logActivity('invoice_create', 'invoice'), logAuditTrail('invoice'), invoiceController.createInvoice);
router.post('/event-booking', authorize('super_admin', 'department_admin', 'reception'), logActivity('invoice_create', 'invoice'), logAuditTrail('invoice'), invoiceController.createEventBookingInvoice);
router.post('/rental', authorize('super_admin', 'department_admin', 'reception'), logActivity('invoice_create', 'invoice'), logAuditTrail('invoice'), invoiceController.createRentalInvoice);
router.post('/:id/send', authorize('super_admin', 'department_admin', 'reception'), logActivity('invoice_send', 'invoice'), logAuditTrail('invoice'), invoiceController.sendInvoiceToCustomer);

// PUT routes
router.put('/:id', authorize('super_admin', 'department_admin', 'reception'), captureOriginalDocument(Invoice), logActivity('invoice_update', 'invoice'), logAuditTrail('invoice'), invoiceController.updateInvoice);
router.put('/:id/status', authorize('super_admin', 'department_admin', 'reception'), captureOriginalDocument(Invoice), logActivity('invoice_status_change', 'invoice'), logAuditTrail('invoice'), invoiceController.updateInvoiceStatus);

// DELETE routes
router.delete('/:id', authorize('super_admin'), logActivity('invoice_delete', 'invoice'), logAuditTrail('invoice'), invoiceController.deleteInvoice);

// Test route
router.get('/test/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Invoice routes are working',
    timestamp: new Date().toISOString(),
    user: req.user ? req.user.email : 'No user'
  });
});

module.exports = router;