const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Equipment category is required'],
    enum: ['audio', 'video', 'lighting', 'presentation', 'streaming', 'accessories'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  specifications: {
    type: String,
    trim: true
  },
  pricing: {
    studio: {
      dailyRate: {
        type: Number,
        required: [true, 'Studio daily rate is required'],
        min: [0, 'Daily rate cannot be negative']
      },
      hourlyRate: {
        type: Number,
        min: [0, 'Hourly rate cannot be negative']
      }
    },
    event: {
      dailyRate: {
        type: Number,
        required: [true, 'Event daily rate is required'],
        min: [0, 'Daily rate cannot be negative']
      },
      hourlyRate: {
        type: Number,
        min: [0, 'Hourly rate cannot be negative']
      }
    },
    rental: {
      dailyRate: {
        type: Number,
        required: [true, 'Rental daily rate is required'],
        min: [0, 'Daily rate cannot be negative']
      },
      hourlyRate: {
        type: Number,
        min: [0, 'Hourly rate cannot be negative']
      },
      weeklyRate: {
        type: Number,
        min: [0, 'Weekly rate cannot be negative']
      },
      monthlyRate: {
        type: Number,
        min: [0, 'Monthly rate cannot be negative']
      }
    }
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative'],
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  tags: [String], // General tags
  usageType: {
    type: [String],
    enum: ['studio', 'event', 'rental'],
    default: ['studio', 'event', 'rental']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Checkout tracking fields
  checkoutStatus: {
    type: String,
    enum: ['available', 'checked_out', 'maintenance', 'damaged', 'retired'],
    default: 'available'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  location: {
    type: String,
    default: 'storage'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'good'
  },
  serialNumber: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  equipmentCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
equipmentSchema.index({ category: 1, isActive: 1 });
equipmentSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted prices
equipmentSchema.virtual('formattedStudioDailyRate').get(function() {
  return `₹${this.pricing.studio.dailyRate.toFixed(2)}`;
});

equipmentSchema.virtual('formattedEventDailyRate').get(function() {
  return `₹${this.pricing.event.dailyRate.toFixed(2)}`;
});

equipmentSchema.virtual('formattedRentalDailyRate').get(function() {
  return `₹${this.pricing.rental.dailyRate.toFixed(2)}`;
});

// Static method to get equipment by category
equipmentSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

// Static method to get all active equipment
equipmentSchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ category: 1, name: 1 });
};

// Instance method to check availability
equipmentSchema.methods.checkAvailability = function(date, quantity = 1) {
  // This would check against bookings to see if equipment is available
  // For now, just check if we have enough quantity
  return this.availableQuantity >= quantity;
};

// Method to check if equipment is available for checkout
equipmentSchema.methods.isAvailableForCheckout = function() {
  return this.checkoutStatus === 'available' && this.isActive && this.availableQuantity > 0;
};

module.exports = mongoose.model('Equipment', equipmentSchema);