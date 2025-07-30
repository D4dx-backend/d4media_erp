const express = require('express');
const router = express.Router();
const studioBookingController = require('../controllers/studioBookingController');
const { protect } = require('../middleware/auth');
const { checkStudioPermission } = require('../middleware/studioPermissions');

// Get all bookings with filtering
router.get('/bookings', protect, checkStudioPermission('view'), studioBookingController.getBookings);

// Get a single booking
router.get('/bookings/:id', protect, checkStudioPermission('view'), studioBookingController.getBooking);

// Create a new booking
router.post('/bookings', protect, checkStudioPermission('create'), studioBookingController.createBooking);

// Update a booking
router.put('/bookings/:id', protect, checkStudioPermission('update'), studioBookingController.updateBooking);

// Delete a booking (Super Admin only)
router.delete('/bookings/:id', protect, checkStudioPermission('delete'), studioBookingController.deleteBooking);

// Check studio availability
router.get('/availability', protect, checkStudioPermission('view'), studioBookingController.checkAvailability);

// Get available time slots for a specific date
router.get('/available-slots', protect, checkStudioPermission('view'), studioBookingController.getAvailableTimeSlots);

// Get equipment options for studio bookings
router.get('/equipment-options', protect, checkStudioPermission('view'), studioBookingController.getEquipmentOptions);

// Get bookings for calendar view
router.get('/calendar', protect, checkStudioPermission('view'), studioBookingController.getCalendarBookings);

// Add a note to a booking
router.post('/bookings/:id/notes', protect, checkStudioPermission('update'), studioBookingController.addBookingNote);

// Update booking status
router.put('/bookings/:id/status', protect, checkStudioPermission('update'), studioBookingController.updateBookingStatus);

// Calculate price estimate for a booking
router.post('/calculate-price', protect, checkStudioPermission('view'), studioBookingController.calculatePriceEstimate);

// Generate invoice for a booking
router.post('/bookings/:id/invoice', protect, checkStudioPermission('update'), studioBookingController.generateInvoice);

module.exports = router;