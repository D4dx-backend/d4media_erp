const StudioBooking = require('../models/StudioBooking');
const Invoice = require('../models/Invoice');
const mongoose = require('mongoose');
const { 
  validateStudioBooking, 
  validateAvailabilityCheck, 
  validateCalendarRange,
  validateBookingNote
} = require('../validators/studioBookingValidators');

/**
 * @desc    Get all studio bookings with filtering
 * @route   GET /api/v1/studio/bookings
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.getBookings = async (req, res) => {
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
    
    // Apply filters if provided
    if (startDate && endDate) {
      query.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.bookingDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.bookingDate = { $lte: new Date(endDate) };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (client) {
      query.client = client;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const bookings = await StudioBooking.find(query)
      .populate('client', 'name email company')
      .populate('createdBy', 'name email')
      .sort({ bookingDate: 1, 'timeSlot.startTime': 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await StudioBooking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
};

/**
 * @desc    Get a single studio booking
 * @route   GET /api/v1/studio/bookings/:id
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.getBooking = async (req, res) => {
  try {
    const booking = await StudioBooking.findById(req.params.id)
      .populate('client', 'name email company')
      .populate('createdBy', 'name email')
      .populate('confirmedBy', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Studio booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking',
      error: error.message
    });
  }
};

/**
 * @desc    Get bookings for calendar view
 * @route   GET /api/v1/studio/calendar
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.getCalendarBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const query = {
      bookingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Get bookings for the date range
    const bookings = await StudioBooking.find(query)
      .populate('client', 'name email company')
      .populate('createdBy', 'name email')
      .sort({ bookingDate: 1, 'timeSlot.startTime': 1 });
    
    // Transform data for calendar display
    const calendarEvents = bookings.map(booking => ({
      id: booking._id,
      title: `${booking.contactPerson.name} - ${booking.purpose}`,
      start: new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.timeSlot.startTime}:00`),
      end: new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.timeSlot.endTime}:00`),
      status: booking.status,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      contactPerson: booking.contactPerson,
      client: booking.client,
      purpose: booking.purpose,
      _id: booking._id
    }));
    
    res.status(200).json({
      success: true,
      data: calendarEvents
    });
  } catch (error) {
    console.error('Error fetching calendar bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve calendar bookings',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new studio booking
 * @route   POST /api/v1/studio/bookings
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.createBooking = async (req, res) => {
  try {
    console.log('Creating booking with data:', JSON.stringify(req.body, null, 2));
    
    // Validate request body
    const { error, value } = validateStudioBooking(req.body);
    if (error) {
      console.error('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    console.log('Validation passed, proceeding with booking creation');
    
    // Check availability
    const { bookingDate, timeSlot } = value;
    const isAvailable = await StudioBooking.checkAvailability(
      new Date(bookingDate),
      timeSlot.startTime,
      timeSlot.endTime
    );
    
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Time slot is not available'
      });
    }
    
    // Calculate equipment cost
    let equipmentCost = 0;
    if (value.equipment && value.equipment.length > 0) {
      equipmentCost = value.equipment.reduce((sum, item) => {
        return sum + (item.rate * item.quantity);
      }, 0);
    }
    
    // Set equipment cost
    value.pricing.equipmentCost = equipmentCost;
    
    // Calculate total amount
    let totalAmount = value.pricing.baseRate * value.duration;
    totalAmount += equipmentCost;
    
    // Add additional charges
    if (value.pricing.additionalCharges && value.pricing.additionalCharges.length > 0) {
      const additionalChargesTotal = value.pricing.additionalCharges.reduce((sum, charge) => {
        return sum + charge.amount;
      }, 0);
      totalAmount += additionalChargesTotal;
    }
    
    // Apply discount if any
    if (value.pricing.discount) {
      totalAmount -= value.pricing.discount;
    }
    
    // Ensure total is not negative
    value.pricing.totalAmount = Math.max(0, totalAmount);
    
    // Handle client creation for new clients (event bookings)
    if (!value.client && value.contactPerson) {
      try {
        // Create a new client user
        const User = require('../models/User');
        
        // Generate a unique email if none provided
        let email = value.contactPerson.email;
        if (!email) {
          const timestamp = Date.now();
          const cleanName = value.contactPerson.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `${cleanName}${timestamp}@d4media-client.com`;
        }
        
        // Check if user with this email already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
          value.client = existingUser._id;
          console.log('Using existing client:', existingUser._id);
        } else {
          const newClient = await User.create({
            name: value.contactPerson.name,
            email: email,
            phone: value.contactPerson.phone,
            role: 'client',
            company: value.contactPerson.company || '',
            password: 'TempPassword123!', // Temporary password - client should reset
            isActive: true
          });
          
          value.client = newClient._id;
          console.log('Created new client for booking:', newClient._id);
        }
      } catch (clientError) {
        console.error('Error creating/finding client:', clientError);
        // Continue without client if creation fails - booking can still be created
        console.log('Proceeding with booking creation without client assignment');
      }
    }
    
    // Set creator
    value.createdBy = req.user.id;
    
    // Create booking
    console.log('Final booking data before creation:', JSON.stringify(value, null, 2));
    const booking = await StudioBooking.create(value);
    console.log('Booking created successfully:', booking._id);
    
    res.status(201).json({
      success: true,
      message: 'Studio booking created successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

/**
 * @desc    Update a studio booking
 * @route   PUT /api/v1/studio/bookings/:id
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.updateBooking = async (req, res) => {
  try {
    // Find booking
    const booking = await StudioBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Studio booking not found'
      });
    }
    
    // Check if booking has an invoice - if so, restrict certain changes
    if (booking.invoice) {
      // If booking has an invoice, only allow status updates
      const allowedUpdates = ['status', 'notes'];
      const requestedUpdates = Object.keys(req.body);
      
      const isValidOperation = requestedUpdates.every(update => allowedUpdates.includes(update));
      
      if (!isValidOperation) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify core booking details after invoice generation. Only status and notes can be updated.'
        });
      }
    }
    
    // Validate request body
    const { error, value } = validateStudioBooking(req.body, true);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    // Check if date/time is being updated
    if (value.bookingDate || (value.timeSlot && (value.timeSlot.startTime || value.timeSlot.endTime))) {
      const bookingDate = value.bookingDate ? new Date(value.bookingDate) : booking.bookingDate;
      const startTime = value.timeSlot?.startTime || booking.timeSlot.startTime;
      const endTime = value.timeSlot?.endTime || booking.timeSlot.endTime;
      
      // Check availability (excluding this booking)
      const isAvailable = await StudioBooking.checkAvailability(
        bookingDate,
        startTime,
        endTime,
        booking._id
      );
      
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: 'Time slot is not available'
        });
      }
    }
    
    // Handle status change to confirmed
    if (value.status === 'confirmed' && booking.status !== 'confirmed') {
      value.confirmedBy = req.user.id;
      value.confirmedAt = new Date();
    }
    
    // Handle status change workflow
    if (value.status && value.status !== booking.status) {
      // Status transition validation
      const validTransitions = {
        'inquiry': ['confirmed', 'cancelled'],
        'confirmed': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
      };
      
      if (!validTransitions[booking.status].includes(value.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from '${booking.status}' to '${value.status}'`
        });
      }
    }
    
    // Calculate pricing if relevant fields are updated
    if (value.equipment || value.pricing || value.duration) {
      // Get current values or updated values
      const duration = value.duration || booking.duration;
      const baseRate = value.pricing?.baseRate || booking.pricing.baseRate;
      const discount = value.pricing?.discount || booking.pricing.discount || 0;
      
      // Calculate equipment cost
      let equipmentCost = 0;
      const equipment = value.equipment || booking.equipment;
      
      if (equipment && equipment.length > 0) {
        equipmentCost = equipment.reduce((sum, item) => {
          return sum + (item.rate * item.quantity);
        }, 0);
      }
      
      // Calculate additional charges
      let additionalChargesTotal = 0;
      const additionalCharges = value.pricing?.additionalCharges || booking.pricing.additionalCharges;
      
      if (additionalCharges && additionalCharges.length > 0) {
        additionalChargesTotal = additionalCharges.reduce((sum, charge) => {
          return sum + charge.amount;
        }, 0);
      }
      
      // Calculate total
      let totalAmount = baseRate * duration;
      totalAmount += equipmentCost;
      totalAmount += additionalChargesTotal;
      totalAmount -= discount;
      
      // Ensure total is not negative
      totalAmount = Math.max(0, totalAmount);
      
      // Set updated pricing values
      if (!value.pricing) value.pricing = {};
      value.pricing.equipmentCost = equipmentCost;
      value.pricing.totalAmount = totalAmount;
    }
    
    // Update booking
    const updatedBooking = await StudioBooking.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('client', 'name email company')
     .populate('createdBy', 'name email')
     .populate('confirmedBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Studio booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a studio booking
 * @route   DELETE /api/v1/studio/bookings/:id
 * @access  Private (Super Admin only)
 */
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await StudioBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Studio booking not found'
      });
    }
    
    // Check if booking has an invoice
    if (booking.invoice) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete booking with an associated invoice'
      });
    }
    
    // Use findByIdAndDelete instead of remove() which is deprecated
    await StudioBooking.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Studio booking deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
};

/**
 * @desc    Check studio availability for a specific time slot
 * @route   GET /api/v1/studio/availability
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time, and end time are required'
      });
    }
    
    // Validate the parameters
    const { error } = validateAvailabilityCheck({ date, startTime, endTime });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const isAvailable = await StudioBooking.checkAvailability(
      new Date(date),
      startTime,
      endTime
    );
    
    res.status(200).json({
      success: true,
      available: isAvailable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
};

/**
 * @desc    Get all available time slots for a specific date
 * @route   GET /api/v1/studio/available-slots
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    // Validate the date format
    if (!Date.parse(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    const availableSlots = await StudioBooking.getAvailableTimeSlots(new Date(date));
    
    res.status(200).json({
      success: true,
      count: availableSlots.length,
      data: availableSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available time slots',
      error: error.message
    });
  }
};

/**
 * @desc    Get bookings for calendar view
 * @route   GET /api/v1/studio/calendar
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.getCalendarBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate the parameters
    const { error } = validateCalendarRange({ startDate, endDate });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const bookings = await StudioBooking.getBookingsInRange(
      new Date(startDate),
      new Date(endDate)
    );
    
    // Format bookings for calendar display
    const calendarEvents = bookings.map(booking => {
      const startDateTime = new Date(booking.bookingDate);
      const [startHours, startMinutes] = booking.timeSlot.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0);
      
      const endDateTime = new Date(booking.bookingDate);
      const [endHours, endMinutes] = booking.timeSlot.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0);
      
      return {
        id: booking._id,
        title: `${booking.contactPerson.name} - ${booking.purpose}`,
        start: startDateTime,
        end: endDateTime,
        status: booking.status,
        client: booking.client ? {
          id: booking.client._id,
          name: booking.client.name,
          company: booking.client.company
        } : null,
        equipment: booking.equipment,
        teamSize: booking.teamSize,
        allDay: false,
        className: `status-${booking.status}`
      };
    });
    
    res.status(200).json({
      success: true,
      count: calendarEvents.length,
      data: calendarEvents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve calendar bookings',
      error: error.message
    });
  }
};

/**
 * @desc    Add a note to a booking
 * @route   POST /api/v1/studio/bookings/:id/notes
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.addBookingNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    // Validate the note
    const { error } = validateBookingNote({ note });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const booking = await StudioBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Studio booking not found'
      });
    }
    
    // Use the model method to add a note
    await booking.addNote(note, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: booking.notes[booking.notes.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
};

/**
 * @desc    Update booking status
 * @route   PUT /api/v1/studio/bookings/:id/status
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Validate status value
    const validStatuses = ['inquiry', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const booking = await StudioBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Studio booking not found'
      });
    }
    
    try {
      // Use the model method to update status with validation
      await booking.updateStatus(status, req.user.id);
      
      // Auto-create invoice for event bookings when confirmed
      if (status === 'confirmed' && booking.type === 'event' && !booking.invoice) {
        try {
          await createEventBookingInvoice(booking, req.user.id);
        } catch (invoiceError) {
          console.error('Failed to auto-create invoice for event booking:', invoiceError);
          // Don't fail the status update if invoice creation fails
        }
      }
      
      // Populate references for response
      await booking.populate('client', 'name email company');
      await booking.populate('createdBy', 'name email');
      if (booking.confirmedBy) {
        await booking.populate('confirmedBy', 'name email');
      }
      
      res.status(200).json({
        success: true,
        message: `Booking status updated to ${status}`,
        data: booking
      });
    } catch (statusError) {
      return res.status(400).json({
        success: false,
        message: statusError.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

/**
 * @desc    Calculate booking price estimate
 * @route   POST /api/v1/studio/calculate-price
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.calculatePriceEstimate = async (req, res) => {
  try {
    const { 
      duration, 
      baseRate, 
      equipment, 
      additionalCharges, 
      discount 
    } = req.body;
    
    if (!duration || !baseRate) {
      return res.status(400).json({
        success: false,
        message: 'Duration and base rate are required'
      });
    }
    
    // Calculate base cost
    let totalAmount = baseRate * duration;
    
    // Calculate equipment cost
    let equipmentCost = 0;
    if (equipment && equipment.length > 0) {
      equipmentCost = equipment.reduce((sum, item) => {
        return sum + (item.rate * item.quantity);
      }, 0);
    }
    totalAmount += equipmentCost;
    
    // Add additional charges
    let additionalChargesTotal = 0;
    if (additionalCharges && additionalCharges.length > 0) {
      additionalChargesTotal = additionalCharges.reduce((sum, charge) => {
        return sum + charge.amount;
      }, 0);
    }
    totalAmount += additionalChargesTotal;
    
    // Apply discount if any
    if (discount) {
      totalAmount -= discount;
    }
    
    // Ensure total is not negative
    totalAmount = Math.max(0, totalAmount);
    
    res.status(200).json({
      success: true,
      data: {
        baseAmount: baseRate * duration,
        equipmentCost,
        additionalChargesTotal,
        discount: discount || 0,
        totalAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price estimate',
      error: error.message
    });
  }
};

/**
 * @desc    Get equipment options for studio bookings
 * @route   GET /api/v1/studio/equipment-options
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.getEquipmentOptions = async (req, res) => {
  try {
    const Equipment = require('../models/Equipment');
    const { usageType = 'studio', tags } = req.query;
    
    // Build query for equipment filtering
    const query = { isActive: true };
    
    // Filter by tags if provided (for tag-based filtering)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    } else if (usageType) {
      // Fallback to usageType if no tags provided
      query.tags = { $in: [usageType] };
    }
    
    // Get equipment based on query
    const equipment = await Equipment.find(query).sort({ category: 1, name: 1 });
    
    // Transform for booking use with appropriate pricing
    const equipmentOptions = equipment.map(item => {
      let pricing = {};
      
      if (usageType === 'studio' && item.pricing.studio) {
        pricing = {
          dailyRate: item.pricing.studio.dailyRate,
          hourlyRate: item.pricing.studio.hourlyRate
        };
      } else if (usageType === 'event' && item.pricing.event) {
        pricing = {
          dailyRate: item.pricing.event.dailyRate,
          hourlyRate: item.pricing.event.hourlyRate
        };
      } else if (usageType === 'rental' && item.pricing.rental) {
        pricing = {
          dailyRate: item.pricing.rental.dailyRate,
          hourlyRate: item.pricing.rental.hourlyRate,
          weeklyRate: item.pricing.rental.weeklyRate,
          monthlyRate: item.pricing.rental.monthlyRate
        };
      }
      
      return {
        id: item._id,
        name: item.name,
        category: item.category,
        ...pricing,
        description: item.description,
        specifications: item.specifications,
        availableQuantity: item.availableQuantity,
        usageType: item.usageType,
        tags: item.tags
      };
    });
    
    res.status(200).json({
      success: true,
      count: equipmentOptions.length,
      data: equipmentOptions
    });
  } catch (error) {
    console.error('Error fetching equipment options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve equipment options',
      error: error.message
    });
  }
};

/**
 * @desc    Generate invoice for a booking
 * @route   POST /api/v1/studio/bookings/:id/invoice
 * @access  Private (Reception, Department Admin, Super Admin)
 */
exports.generateInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const booking = await StudioBooking.findById(req.params.id).session(session);
    
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Studio booking not found'
      });
    }
    
    // Check if booking already has an invoice
    if (booking.invoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Booking already has an invoice'
      });
    }
    
    // Check if booking is confirmed
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Only confirmed or completed bookings can be invoiced'
      });
    }
    
    // Create invoice
    const invoice = new Invoice({
      client: booking.client,
      type: 'studio_booking',
      items: [{
        type: 'booking',
        reference: booking._id,
        description: `Studio Booking on ${new Date(booking.bookingDate).toLocaleDateString()} (${booking.timeSlot.startTime} - ${booking.timeSlot.endTime})`,
        quantity: booking.duration,
        rate: booking.pricing.baseRate,
        amount: booking.pricing.baseRate * booking.duration
      }],
      subtotal: booking.pricing.totalAmount,
      discount: booking.pricing.discount || 0,
      tax: 0, // Tax can be added as needed
      total: booking.pricing.totalAmount,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Due in 15 days
      createdBy: req.user.id
    });
    
    // Add equipment as separate items if any
    if (booking.equipment && booking.equipment.length > 0) {
      booking.equipment.forEach(item => {
        invoice.items.push({
          type: 'additional',
          description: `Equipment: ${item.name} x ${item.quantity}`,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate
        });
      });
    }
    
    // Add additional charges if any
    if (booking.pricing.additionalCharges && booking.pricing.additionalCharges.length > 0) {
      booking.pricing.additionalCharges.forEach(charge => {
        invoice.items.push({
          type: 'additional',
          description: charge.description,
          quantity: 1,
          rate: charge.amount,
          amount: charge.amount
        });
      });
    }
    
    // Save invoice
    await invoice.save({ session });
    
    // Update booking with invoice reference
    booking.invoice = invoice._id;
    await booking.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoice,
        booking
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
};
/**

 * Helper function to create invoice for event booking
 * @param {Object} booking - The booking object
 * @param {String} userId - The user ID creating the invoice
 */
async function createEventBookingInvoice(booking, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create invoice items from booking
    const items = [{
      type: 'booking',
      reference: booking._id,
      description: `Event Booking: ${booking.purpose || booking.eventTitle || 'Event'} - ${new Date(booking.bookingDate).toLocaleDateString()} (${booking.timeSlot.startTime} - ${booking.timeSlot.endTime})`,
      quantity: 1,
      rate: booking.pricing.totalAmount || 0,
      amount: booking.pricing.totalAmount || 0
    }];

    // Add equipment items if any
    if (booking.equipment && booking.equipment.length > 0) {
      booking.equipment.forEach((equipmentId, index) => {
        const equipmentCost = booking.pricing.equipmentCost / booking.equipment.length; // Distribute cost evenly
        items.push({
          type: 'additional',
          description: `Equipment Service ${index + 1}`,
          quantity: 1,
          rate: equipmentCost,
          amount: equipmentCost
        });
      });
    }

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice
    const invoice = new Invoice({
      client: booking.client,
      type: 'studio_booking',
      items,
      subtotal: booking.pricing.totalAmount || 0,
      discount: 0,
      tax: 0,
      total: booking.pricing.totalAmount || 0,
      status: 'draft',
      dueDate,
      notes: `Auto-generated invoice for event booking: ${booking.purpose || booking.eventTitle || 'Event'}`,
      createdBy: userId
    });

    await invoice.save({ session });

    // Update booking with invoice reference
    booking.invoice = invoice._id;
    await booking.save({ session });

    await session.commitTransaction();
    console.log(`Auto-created invoice ${invoice.invoiceNumber} for event booking ${booking._id}`);
    
    return invoice;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}