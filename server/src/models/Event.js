const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional to support new clients
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
  eventType: {
    type: String,
    trim: true
  },
  eventTitle: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  eventDescription: {
    type: String,
    trim: true
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
  purpose: {
    type: String,
    required: [true, 'Event purpose is required'],
    trim: true
  },
  equipment: [{
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment'
    },
    name: String,
    quantity: {
      type: Number,
      default: 1
    },
    rate: {
      type: Number,
      default: 0
    }
  }],
  specialRequirements: {
    type: String,
    trim: true
  },
  cateringNeeded: {
    type: Boolean,
    default: false
  },
  cateringDetails: {
    type: String,
    trim: true
  },
  photographyNeeded: {
    type: Boolean,
    default: false
  },
  videographyNeeded: {
    type: Boolean,
    default: false
  },
  liveStreamingNeeded: {
    type: Boolean,
    default: false
  },
  estimatedBudget: {
    type: String,
    trim: true
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['inquiry', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'inquiry'
  },
  pricing: {
    baseRate: {
      type: Number,
      default: 0
    },
    equipmentCost: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      default: 0
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
    note: {
      type: String,
      required: true,
      trim: true
    },
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
    required: true
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
eventSchema.index({ bookingDate: 1, 'timeSlot.startTime': 1 });
eventSchema.index({ client: 1, status: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdAt: -1 });

// Virtual for duration calculation
eventSchema.virtual('duration').get(function() {
  if (!this.timeSlot.startTime || !this.timeSlot.endTime) return 0;
  
  const start = new Date(`2000-01-01T${this.timeSlot.startTime}:00`);
  const end = new Date(`2000-01-01T${this.timeSlot.endTime}:00`);
  
  return (end - start) / (1000 * 60 * 60); // Duration in hours
});

// Static method to check availability
eventSchema.statics.checkAvailability = async function(date, startTime, endTime, excludeEventId = null) {
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
  
  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }
  
  const conflictingEvents = await this.find(query);
  return conflictingEvents.length === 0;
};

// Instance method to update status with validation
eventSchema.methods.updateStatus = function(newStatus, userId) {
  const validTransitions = {
    'inquiry': ['confirmed', 'cancelled'],
    'confirmed': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot change status from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'confirmed') {
    this.confirmedBy = userId;
    this.confirmedAt = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Event', eventSchema);