const mongoose = require('mongoose');

const studioBookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional to support event bookings with new clients
  },
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    company: {
      type: String,
      trim: true
    }
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  timeSlot: {
    startTime: {
      type: String,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required']
    }
  },
  duration: {
    type: Number, // in hours
    required: [true, 'Duration is required'],
    min: [0.5, 'Minimum booking duration is 0.5 hours']
  },
  purpose: {
    type: String,
    required: [true, 'Booking purpose is required'],
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  teamSize: {
    type: Number,
    required: [true, 'Team size is required'],
    min: [1, 'Team size must be at least 1']
  },
  equipment: [{
    name: String,
    quantity: Number,
    rate: Number
  }],
  status: {
    type: String,
    enum: ['inquiry', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'inquiry'
  },
  pricing: {
    baseRate: {
      type: Number,
      required: [true, 'Base rate is required'],
      min: [0, 'Base rate cannot be negative']
    },
    equipmentCost: {
      type: Number,
      default: 0
    },
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
studioBookingSchema.index({ bookingDate: 1, 'timeSlot.startTime': 1 });
studioBookingSchema.index({ client: 1 });
studioBookingSchema.index({ status: 1 });
studioBookingSchema.index({ createdAt: -1 });

// Virtual for booking duration in readable format
studioBookingSchema.virtual('durationText').get(function() {
  const hours = Math.floor(this.duration);
  const minutes = (this.duration % 1) * 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
});

// Calculate total amount before saving
studioBookingSchema.pre('save', function(next) {
  let total = this.pricing.baseRate * this.duration;
  total += this.pricing.equipmentCost;
  
  // Add additional charges
  if (this.pricing.additionalCharges && this.pricing.additionalCharges.length > 0) {
    total += this.pricing.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  }
  
  // Apply discount
  total -= this.pricing.discount;
  
  this.pricing.totalAmount = Math.max(0, total);
  next();
});

// Update confirmation details when status changes to confirmed
studioBookingSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  next();
});

// Static method to check availability
studioBookingSchema.statics.checkAvailability = async function(date, startTime, endTime, excludeId = null) {
  const query = {
    bookingDate: date,
    status: { $in: ['confirmed', 'in_progress'] },
    $or: [
      {
        'timeSlot.startTime': { $lt: endTime },
        'timeSlot.endTime': { $gt: startTime }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const conflictingBookings = await this.find(query);
  return conflictingBookings.length === 0;
};

// Static method to get available time slots for a specific date
studioBookingSchema.statics.getAvailableTimeSlots = async function(date) {
  // Define studio operating hours (8:00 AM to 8:00 PM)
  const operatingHours = {
    start: '08:00',
    end: '20:00'
  };
  
  // Generate all possible 30-minute time slots
  const allTimeSlots = [];
  let currentTime = operatingHours.start;
  
  while (currentTime < operatingHours.end) {
    const [hours, minutes] = currentTime.split(':').map(Number);
    let nextHours = hours;
    let nextMinutes = minutes + 30;
    
    if (nextMinutes >= 60) {
      nextHours += 1;
      nextMinutes -= 60;
    }
    
    const endTime = `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
    
    allTimeSlots.push({
      startTime: currentTime,
      endTime: endTime
    });
    
    currentTime = endTime;
  }
  
  // Get all bookings for the date
  const bookings = await this.find({
    bookingDate: date,
    status: { $in: ['confirmed', 'in_progress'] }
  }).select('timeSlot');
  
  // Mark time slots as available or not
  const availableTimeSlots = allTimeSlots.map(slot => {
    const isAvailable = !bookings.some(booking => 
      (booking.timeSlot.startTime < slot.endTime && booking.timeSlot.endTime > slot.startTime)
    );
    
    return {
      ...slot,
      isAvailable
    };
  });
  
  return availableTimeSlots;
};

// Static method to get bookings for a date range
studioBookingSchema.statics.getBookingsInRange = function(startDate, endDate) {
  return this.find({
    bookingDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $ne: 'cancelled' }
  })
  .populate('client', 'name email company')
  .populate('createdBy', 'name email')
  .sort({ bookingDate: 1, 'timeSlot.startTime': 1 });
};

// Instance method to add note
studioBookingSchema.methods.addNote = function(note, userId) {
  this.notes.push({
    note,
    addedBy: userId,
    addedAt: new Date()
  });
  return this.save();
};

// Instance method to update status with validation
studioBookingSchema.methods.updateStatus = function(newStatus, userId) {
  // Define valid status transitions
  const validTransitions = {
    'inquiry': ['confirmed', 'cancelled'],
    'confirmed': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };
  
  // Check if transition is valid
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot change status from '${this.status}' to '${newStatus}'`);
  }
  
  // Update status
  this.status = newStatus;
  
  // Handle confirmation
  if (newStatus === 'confirmed' && !this.confirmedAt) {
    this.confirmedBy = userId;
    this.confirmedAt = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('StudioBooking', studioBookingSchema);