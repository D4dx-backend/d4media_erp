const Rental = require('../models/Rental');
const Equipment = require('../models/Equipment');
const User = require('../models/User');

/**
 * @desc    Get all rentals with filtering
 * @route   GET /api/v1/rentals
 * @access  Private
 */
exports.getRentals = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      client, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const query = {};
    
    // Apply filters
    if (startDate && endDate) {
      query.rentalDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (client) {
      query.client = client;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const rentals = await Rental.find(query)
      .populate('client', 'name email company')
      .populate('equipment.equipmentId', 'name category')
      .populate('createdBy', 'name email')
      .sort({ rentalDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Rental.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: rentals.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: rentals
    });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rentals',
      error: error.message
    });
  }
};

/**
 * @desc    Get single rental
 * @route   GET /api/v1/rentals/:id
 * @access  Private
 */
exports.getRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('client', 'name email company')
      .populate('equipment.equipmentId', 'name category pricing')
      .populate('createdBy', 'name email')
      .populate('confirmedBy', 'name email');
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rental
    });
  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve rental',
      error: error.message
    });
  }
};

/**
 * @desc    Create new rental
 * @route   POST /api/v1/rentals
 * @access  Private
 */
exports.createRental = async (req, res) => {
  try {
    const rentalData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // Validate equipment availability
    for (const item of rentalData.equipment) {
      const isAvailable = await Rental.checkEquipmentAvailability(
        item.equipmentId,
        rentalData.rentalDate,
        rentalData.returnDate
      );
      
      if (!isAvailable) {
        const equipment = await Equipment.findById(item.equipmentId);
        return res.status(409).json({
          success: false,
          message: `Equipment "${equipment.name}" is not available for the selected dates`
        });
      }
    }
    
    const rental = await Rental.create(rentalData);
    
    // Calculate total
    rental.calculateTotal();
    await rental.save();
    
    // Populate the created rental
    const populatedRental = await Rental.findById(rental._id)
      .populate('client', 'name email company')
      .populate('equipment.equipmentId', 'name category pricing')
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      data: populatedRental
    });
  } catch (error) {
    console.error('Error creating rental:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create rental',
      error: error.message
    });
  }
};

/**
 * @desc    Update rental
 * @route   PUT /api/v1/rentals/:id
 * @access  Private
 */
exports.updateRental = async (req, res) => {
  try {
    const rental = await Rental.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('client', 'name email company')
     .populate('equipment.equipmentId', 'name category pricing');
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Recalculate total if equipment changed
    if (req.body.equipment) {
      rental.calculateTotal();
      await rental.save();
    }
    
    // Auto-create invoice when rental is confirmed
    if (req.body.status === 'confirmed' && !rental.invoice) {
      console.log('Attempting to auto-create invoice for rental:', rental._id);
      console.log('Rental equipment:', rental.equipment);
      console.log('Rental pricing:', rental.pricing);
      
      try {
        // Ensure rental has all necessary data
        if (!rental.equipment || rental.equipment.length === 0) {
          console.error('Cannot create invoice: rental has no equipment');
          throw new Error('Rental has no equipment items');
        }
        
        if (!rental.pricing || !rental.pricing.totalAmount) {
          console.error('Cannot create invoice: rental has no pricing');
          throw new Error('Rental has no pricing information');
        }
        
        const invoice = await createRentalInvoiceHelper(rental, req.user.id);
        console.log('Successfully created invoice:', invoice.invoiceNumber);
        
        // Update the rental object to include the invoice reference
        rental.invoice = invoice._id;
      } catch (invoiceError) {
        console.error('Failed to auto-create invoice for rental:', invoiceError);
        console.error('Invoice error details:', invoiceError.message);
        // Don't fail the rental update if invoice creation fails
      }
    }
    
    res.status(200).json({
      success: true,
      data: rental
    });
  } catch (error) {
    console.error('Error updating rental:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rental',
      error: error.message
    });
  }
};

/**
 * @desc    Return equipment
 * @route   PUT /api/v1/rentals/:id/return/:equipmentId
 * @access  Private
 */
exports.returnEquipment = async (req, res) => {
  try {
    const { id, equipmentId } = req.params;
    const { condition = 'good', notes = '' } = req.body;
    
    const rental = await Rental.findById(id);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    await rental.returnEquipment(equipmentId, condition, notes);
    
    const updatedRental = await Rental.findById(id)
      .populate('client', 'name email company')
      .populate('equipment.equipmentId', 'name category pricing');
    
    res.status(200).json({
      success: true,
      message: 'Equipment returned successfully',
      data: updatedRental
    });
  } catch (error) {
    console.error('Error returning equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return equipment',
      error: error.message
    });
  }
};

/**
 * @desc    Get available equipment for rental
 * @route   GET /api/v1/rentals/available-equipment
 * @access  Private
 */
exports.getAvailableEquipment = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    // Get all equipment that supports rental
    const allEquipment = await Equipment.find({ 
      isActive: true,
      tags: { $in: ['rental'] }
    });
    
    const availableEquipment = [];
    
    for (const equipment of allEquipment) {
      const isAvailable = await Rental.checkEquipmentAvailability(
        equipment._id,
        new Date(startDate),
        new Date(endDate)
      );
      
      if (isAvailable) {
        availableEquipment.push({
          ...equipment.toObject(),
          rentalPricing: equipment.pricing.rental
        });
      }
    }
    
    res.status(200).json({
      success: true,
      count: availableEquipment.length,
      data: availableEquipment
    });
  } catch (error) {
    console.error('Error fetching available equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available equipment',
      error: error.message
    });
  }
};

/**
 * @desc    Delete rental
 * @route   DELETE /api/v1/rentals/:id
 * @access  Private
 */
exports.deleteRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }
    
    // Only allow deletion if rental is pending or cancelled
    if (!['pending', 'cancelled'].includes(rental.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete rental that is in progress or completed'
      });
    }
    
    await rental.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Rental deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rental:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rental',
      error: error.message
    });
  }
};
/**
 * Helper function to create invoice for rental
 * @param {Object} rental - The rental object
 * @param {String} userId - The user ID creating the invoice
 */
async function createRentalInvoiceHelper(rental, userId) {
  const mongoose = require('mongoose');
  const Invoice = require('../models/Invoice');
  const { generateInvoiceNumber } = require('../utils/numberGenerator');
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if invoice already exists for this rental
    const existingInvoice = await Invoice.findOne({ 'items.reference': rental._id });
    if (existingInvoice) {
      console.log(`Invoice already exists for rental ${rental._id}: ${existingInvoice.invoiceNumber}`);
      await session.abortTransaction();
      return existingInvoice;
    }

    // Ensure rental is properly populated
    if (!rental.equipment || rental.equipment.length === 0) {
      throw new Error('Rental has no equipment items');
    }
    
    // Calculate rental duration
    const rentalDate = new Date(rental.rentalDate);
    const returnDate = new Date(rental.returnDate);
    const durationDays = Math.ceil((returnDate - rentalDate) / (1000 * 60 * 60 * 24)) || 1;
    
    // Create invoice items from rental equipment
    const items = rental.equipment.map(item => {
      const equipmentName = item.equipmentId?.name || item.equipmentId || 'Unknown Equipment';
      return {
        type: 'additional',
        description: `Equipment Rental: ${equipmentName} (${durationDays} days)`,
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        amount: item.totalAmount || (item.quantity * item.rate * durationDays)
      };
    });

    // Add main rental item
    items.unshift({
      type: 'booking',
      reference: rental._id,
      description: `Equipment Rental: ${rental.purpose} - ${rentalDate.toLocaleDateString()} to ${returnDate.toLocaleDateString()}`,
      quantity: 1,
      rate: rental.pricing.subtotal || 0,
      amount: rental.pricing.subtotal || 0
    });

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      client: rental.client._id || rental.client,
      clientDetails: {
        name: rental.client?.name || rental.contactPerson?.name,
        email: rental.client?.email || rental.contactPerson?.email,
        phone: rental.contactPerson?.phone,
        company: rental.client?.company
      },
      type: 'equipment_rental',
      items,
      subtotal: rental.pricing.subtotal || 0,
      discount: rental.pricing.discount || 0,
      tax: 0,
      taxAmount: 0,
      total: rental.pricing.totalAmount || 0,
      status: 'draft',
      dueDate,
      notes: `Auto-generated invoice for equipment rental: ${rental.purpose}${rental.notes ? `\n\nRental Notes: ${rental.notes}` : ''}`,
      createdBy: userId
    });

    await invoice.save({ session });

    // Update rental with invoice reference
    rental.invoice = invoice._id;
    await rental.save({ session });

    await session.commitTransaction();
    console.log(`Auto-created invoice ${invoice.invoiceNumber} for rental ${rental._id}`);
    
    return invoice;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}