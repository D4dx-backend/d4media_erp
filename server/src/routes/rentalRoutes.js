const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { protect } = require('../middleware/auth');

// Get all rentals
router.get('/', protect, rentalController.getRentals);

// Get available equipment for rental
router.get('/available-equipment', protect, rentalController.getAvailableEquipment);

// Get single rental
router.get('/:id', protect, rentalController.getRental);

// Create new rental
router.post('/', protect, rentalController.createRental);

// Update rental
router.put('/:id', protect, rentalController.updateRental);

// Return equipment
router.put('/:id/return/:equipmentId', protect, rentalController.returnEquipment);

// Delete rental
router.delete('/:id', protect, rentalController.deleteRental);

module.exports = router;