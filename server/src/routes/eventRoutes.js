const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getCalendarEvents
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all events with filtering
router.get('/', authorize('super_admin', 'department_admin', 'reception'), getEvents);

// Get events for calendar view
router.get('/calendar', authorize('super_admin', 'department_admin', 'reception'), getCalendarEvents);

// Get a single event
router.get('/:id', authorize('super_admin', 'department_admin', 'reception'), getEvent);

// Create a new event
router.post('/', authorize('super_admin', 'department_admin', 'reception'), createEvent);

// Update an event
router.put('/:id', authorize('super_admin', 'department_admin', 'reception'), updateEvent);

// Delete an event (Super Admin only)
router.delete('/:id', authorize('super_admin'), deleteEvent);

module.exports = router;