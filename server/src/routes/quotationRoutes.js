const express = require('express');
const router = express.Router();

// Import auth middleware and controller
const { protect, authorize } = require('../middleware/auth');
const { logActivity, logAuditTrail, captureOriginalDocument } = require('../middleware/activityLogger');
const quotationController = require('../controllers/quotationController');
const Quotation = require('../models/Quotation');

// Apply authentication middleware to all routes
router.use(protect);

// GET routes
router.get('/', logActivity('view', 'quotation'), quotationController.getQuotations);
router.get('/client/my-quotations', authorize('client'), logActivity('view', 'quotation'), quotationController.getClientQuotations);
router.get('/stats/summary', authorize('super_admin', 'department_admin'), logActivity('view', 'quotation'), quotationController.getQuotationStats);
router.get('/:id', logActivity('view', 'quotation'), quotationController.getQuotation);
router.get('/:id/pdf', logActivity('quotation_pdf_generate', 'quotation'), logAuditTrail('quotation'), quotationController.generateQuotationPDF);
router.get('/:id/print', logActivity('quotation_print', 'quotation'), logAuditTrail('quotation'), quotationController.printQuotation);

// POST routes
router.post('/', authorize('super_admin', 'department_admin', 'reception'), logActivity('quotation_create', 'quotation'), logAuditTrail('quotation'), quotationController.createQuotation);
router.post('/:id/convert-to-invoice', authorize('super_admin', 'department_admin', 'reception'), logActivity('quotation_convert_to_invoice', 'quotation'), logAuditTrail('quotation'), quotationController.convertToInvoice);
router.post('/:id/send', authorize('super_admin', 'department_admin', 'reception'), logActivity('quotation_send', 'quotation'), logAuditTrail('quotation'), quotationController.sendQuotationToCustomer);

// PUT routes
router.put('/:id', authorize('super_admin', 'department_admin', 'reception'), captureOriginalDocument(Quotation), logActivity('quotation_update', 'quotation'), logAuditTrail('quotation'), quotationController.updateQuotation);
router.put('/:id/status', authorize('super_admin', 'department_admin', 'reception'), captureOriginalDocument(Quotation), logActivity('quotation_status_change', 'quotation'), logAuditTrail('quotation'), quotationController.updateQuotationStatus);

// DELETE routes
router.delete('/:id', authorize('super_admin', 'department_admin'), logActivity('quotation_delete', 'quotation'), logAuditTrail('quotation'), quotationController.deleteQuotation);

// Test route
router.get('/test/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Quotation routes are working',
    timestamp: new Date().toISOString(),
    user: req.user ? req.user.email : 'No user'
  });
});

module.exports = router;