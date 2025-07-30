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
  },
  // Maintenance tracking
  maintenanceHistory: [{
    type: {
      type: String,
      enum: ['routine', 'repair', 'inspection', 'calibration', 'cleaning'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    nextMaintenanceDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'in_progress'],
      default: 'completed'
    },
    notes: {
      type: String,
      trim: true
    },
    attachments: [{
      filename: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  // In/Out tracking
  inOutHistory: [{
    type: {
      type: String,
      enum: ['in', 'out'],
      required: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    purpose: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    project: {
      type: String,
      trim: true
    },
    expectedReturnDate: {
      type: Date
    },
    actualReturnDate: {
      type: Date
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
      default: 'good'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  // Current status tracking
  currentQuantityOut: {
    type: Number,
    default: 0,
    min: 0
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  maintenanceStatus: {
    type: String,
    enum: ['up_to_date', 'due_soon', 'overdue', 'in_maintenance'],
    default: 'up_to_date'
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
  return this.checkoutStatus === 'available' && this.isActive && (this.availableQuantity - this.currentQuantityOut) > 0;
};

// Method to record equipment in/out
equipmentSchema.methods.recordInOut = function(inOutData) {
  this.inOutHistory.push(inOutData);
  
  if (inOutData.type === 'out') {
    this.currentQuantityOut += inOutData.quantity;
  } else if (inOutData.type === 'in') {
    this.currentQuantityOut = Math.max(0, this.currentQuantityOut - inOutData.quantity);
  }
  
  return this.save();
};

// Method to add maintenance record
equipmentSchema.methods.addMaintenanceRecord = function(maintenanceData) {
  this.maintenanceHistory.push(maintenanceData);
  this.lastMaintenanceDate = maintenanceData.performedDate;
  
  if (maintenanceData.nextMaintenanceDate) {
    this.nextMaintenanceDate = maintenanceData.nextMaintenanceDate;
  }
  
  // Update maintenance status
  this.updateMaintenanceStatus();
  
  return this.save();
};

// Method to update maintenance status
equipmentSchema.methods.updateMaintenanceStatus = function() {
  if (!this.nextMaintenanceDate) {
    this.maintenanceStatus = 'up_to_date';
    return;
  }
  
  const today = new Date();
  const nextMaintenance = new Date(this.nextMaintenanceDate);
  const daysDiff = Math.ceil((nextMaintenance - today) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    this.maintenanceStatus = 'overdue';
  } else if (daysDiff <= 7) {
    this.maintenanceStatus = 'due_soon';
  } else {
    this.maintenanceStatus = 'up_to_date';
  }
};

// Static method to get equipment needing maintenance
equipmentSchema.statics.getNeedingMaintenance = function() {
  return this.find({
    isActive: true,
    maintenanceStatus: { $in: ['due_soon', 'overdue'] }
  }).sort({ nextMaintenanceDate: 1 });
};

// Virtual for available quantity (considering current out quantity)
equipmentSchema.virtual('actualAvailableQuantity').get(function() {
  return Math.max(0, this.availableQuantity - this.currentQuantityOut);
});

module.exports = mongoose.model('Equipment', equipmentSchema);