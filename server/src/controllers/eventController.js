const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @desc    Get all events with filtering
 * @route   GET /api/v1/events
 * @access  Private
 */
exports.getEvents = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      client, 
      page = 1, 
      limit = 10,
      type = 'external' // Filter for external events
    } = req.query;
    
    const query = {};
    
    // Apply filters
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
    
    const events = await Event.find(query)
      .populate('client', 'name email company')
      .populate('createdBy', 'name email')
      .populate('confirmedBy', 'name email')
      .populate('invoice')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Event.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events',
      error: error.message
    });
  }
};

/**
 * @desc    Get single event
 * @route   GET /api/v1/events/:id
 * @access  Private
 */
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('client', 'name email company')
      .populate('createdBy', 'name email')
      .populate('confirmedBy', 'name email')
      .populate('invoice');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event',
      error: error.message
    });
  }
};

/**
 * @desc    Create new event
 * @route   POST /api/v1/events
 * @access  Private
 */
exports.createEvent = async (req, res) => {
  try {
    console.log('Creating event with data:', JSON.stringify(req.body, null, 2));
    
    // Check availability
    const { bookingDate, timeSlot } = req.body;
    if (bookingDate && timeSlot) {
      const isAvailable = await Event.checkAvailability(
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
    }
    
    // Handle client creation for new clients
    let clientId = req.body.client;
    if (!clientId && req.body.contactPerson) {
      try {
        // Generate a unique email if none provided
        let email = req.body.contactPerson.email;
        if (!email) {
          const timestamp = Date.now();
          const cleanName = req.body.contactPerson.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `${cleanName}${timestamp}@d4media-client.com`;
        }
        
        // Check if user with this email already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
          clientId = existingUser._id;
          console.log('Using existing client:', existingUser._id);
        } else {
          const newClient = await User.create({
            name: req.body.contactPerson.name,
            email: email,
            phone: req.body.contactPerson.phone,
            role: 'client',
            company: req.body.contactPerson.company || '',
            password: 'TempPassword123!', // Temporary password
            isActive: true
          });
          
          clientId = newClient._id;
          console.log('Created new client for event:', newClient._id);
        }
      } catch (clientError) {
        console.error('Error creating/finding client:', clientError);
        // Continue without client if creation fails
      }
    }
    
    // Calculate equipment cost
    let equipmentCost = 0;
    if (req.body.equipment && req.body.equipment.length > 0) {
      equipmentCost = req.body.equipment.reduce((sum, item) => {
        return sum + (item.rate * item.quantity);
      }, 0);
    }
    
    // Prepare event data
    const eventData = {
      ...req.body,
      client: clientId,
      createdBy: req.user.id,
      pricing: {
        baseRate: 0,
        equipmentCost: equipmentCost,
        totalAmount: equipmentCost
      }
    };
    
    // Create event
    console.log('Final event data before creation:', JSON.stringify(eventData, null, 2));
    const event = await Event.create(eventData);
    console.log('Event created successfully:', event._id);
    
    // Populate the created event
    await event.populate('client', 'name email company');
    await event.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/v1/events/:id
 * @access  Private
 */
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check availability if date/time is being changed
    if (req.body.bookingDate || req.body.timeSlot) {
      const bookingDate = req.body.bookingDate || event.bookingDate;
      const timeSlot = req.body.timeSlot || event.timeSlot;
      
      const isAvailable = await Event.checkAvailability(
        new Date(bookingDate),
        timeSlot.startTime,
        timeSlot.endTime,
        event._id
      );
      
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: 'Time slot is not available'
        });
      }
    }
    
    // Calculate equipment cost if equipment is being updated
    if (req.body.equipment) {
      const equipmentCost = req.body.equipment.reduce((sum, item) => {
        return sum + (item.rate * item.quantity);
      }, 0);
      
      req.body.pricing = {
        ...req.body.pricing,
        equipmentCost: equipmentCost,
        totalAmount: equipmentCost
      };
    }
    
    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('client', 'name email company')
     .populate('createdBy', 'name email')
     .populate('confirmedBy', 'name email')
     .populate('invoice');
    
    // Auto-create invoice when event is confirmed
    if (req.body.status === 'confirmed' && !updatedEvent.invoice) {
      try {
        await createEventInvoiceHelper(updatedEvent, req.user.id);
        // Refresh the event to include the invoice reference
        await updatedEvent.populate('invoice');
      } catch (invoiceError) {
        console.error('Failed to auto-create invoice for event:', invoiceError);
        // Don't fail the event update if invoice creation fails
      }
    }
    
    res.status(200).json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/v1/events/:id
 * @access  Private
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Only allow deletion if event is inquiry or cancelled
    if (!['inquiry', 'cancelled'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event that is confirmed or in progress'
      });
    }
    
    await event.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
};

/**
 * @desc    Get events for calendar view
 * @route   GET /api/v1/events/calendar
 * @access  Private
 */
exports.getCalendarEvents = async (req, res) => {
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
    
    const events = await Event.find(query)
      .populate('client', 'name email company')
      .sort({ bookingDate: 1, 'timeSlot.startTime': 1 });
    
    // Transform data for calendar display
    const calendarEvents = events.map(event => ({
      id: event._id,
      title: `${event.contactPerson.name} - ${event.eventTitle}`,
      start: new Date(`${event.bookingDate.toISOString().split('T')[0]}T${event.timeSlot.startTime}:00`),
      end: new Date(`${event.bookingDate.toISOString().split('T')[0]}T${event.timeSlot.endTime}:00`),
      status: event.status,
      type: 'event'
    }));
    
    res.status(200).json({
      success: true,
      data: calendarEvents
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve calendar events',
      error: error.message
    });
  }
};

/**
 * Helper function to create invoice for event
 */
async function createEventInvoiceHelper(event, userId) {
  const mongoose = require('mongoose');
  const Invoice = require('../models/Invoice');
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create invoice items from event
    const items = [{
      type: 'booking',
      reference: event._id,
      description: `Event Booking: ${event.eventTitle} - ${new Date(event.bookingDate).toLocaleDateString()} (${event.timeSlot.startTime} - ${event.timeSlot.endTime})`,
      quantity: 1,
      rate: event.pricing.totalAmount,
      amount: event.pricing.totalAmount
    }];

    // Add equipment items if any
    if (event.equipment && event.equipment.length > 0) {
      event.equipment.forEach((item, index) => {
        items.push({
          type: 'additional',
          description: `Equipment: ${item.name}`,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.rate * item.quantity
        });
      });
    }

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice
    const invoice = new Invoice({
      client: event.client,
      type: 'studio_booking', // Using studio_booking type for events as well
      items,
      subtotal: event.pricing.totalAmount,
      discount: 0,
      tax: 0,
      total: event.pricing.totalAmount,
      status: 'draft',
      dueDate,
      notes: `Auto-generated invoice for event: ${event.eventTitle}${event.additionalNotes ? `\n\nEvent Notes: ${event.additionalNotes}` : ''}`,
      createdBy: userId
    });

    await invoice.save({ session });

    // Update event with invoice reference
    event.invoice = invoice._id;
    await event.save({ session });

    await session.commitTransaction();
    console.log(`Auto-created invoice ${invoice.invoiceNumber} for event ${event._id}`);
    
    return invoice;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = exports;