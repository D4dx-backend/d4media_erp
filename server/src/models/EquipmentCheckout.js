const mongoose = require('mongoose');

const equipmentCheckoutSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'Equipment is required']
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User who checked out equipment is required']
  },
  checkedOutTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User equipment is checked out to is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  checkoutDate: {
    type: Date,
    required: [true, 'Checkout date is required'],
    default: Date.now
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'Expected return date is required']
  },
  actualReturnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['checked_out', 'returned', 'overdue', 'lost', 'damaged'],
    default: 'checked_out'
  },
  purpose: {
    type: String,
    required: [true, 'Purpose of checkout is required'],
    trim: true
  },
  project: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  location: {
    type: String,
    trim: true,
    default: 'In use'
  },
  checkoutNotes: {
    type: String,
    trim: true
  },
  returnNotes: {
    type: String,
    trim: true
  },
  conditionAtCheckout: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  conditionAtReturn: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Notification tracking
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderDate: {
    type: Date
  },
  // Damage/Loss tracking
  damageReport: {
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'major', 'total_loss']
    },
    repairCost: Number,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportDate: {
      type: Date,
      default: Date.now
    }
  },
  // Extension tracking
  extensions: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    newReturnDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
equipmentCheckoutSchema.index({ equipment: 1, status: 1 });
equipmentCheckoutSchema.index({ checkedOutTo: 1, status: 1 });
equipmentCheckoutSchema.index({ checkoutDate: 1 });
equipmentCheckoutSchema.index({ expectedReturnDate: 1, status: 1 });
equipmentCheckoutSchema.index({ status: 1, expectedReturnDate: 1 });

// Virtual for days overdue
equipmentCheckoutSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'checked_out' || !this.expectedReturnDate) return 0;
  
  const today = new Date();
  const expectedReturn = new Date(this.expectedReturnDate);
  
  if (today > expectedReturn) {
    return Math.ceil((today - expectedReturn) / (1000 * 60 * 60 * 24));
  }
  
  return 0;
});

// Virtual for checkout duration
equipmentCheckoutSchema.virtual('checkoutDuration').get(function() {
  const endDate = this.actualReturnDate || new Date();
  const startDate = new Date(this.checkoutDate);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
equipmentCheckoutSchema.virtual('isOverdue').get(function() {
  return this.daysOverdue > 0;
});

// Static method to get overdue checkouts
equipmentCheckoutSchema.statics.getOverdue = function() {
  return this.find({
    status: 'checked_out',
    expectedReturnDate: { $lt: new Date() }
  })
  .populate('equipment', 'name category')
  .populate('checkedOutTo', 'name email')
  .sort({ expectedReturnDate: 1 });
};

// Static method to get checkouts due soon (within next 3 days)
equipmentCheckoutSchema.statics.getDueSoon = function(days = 3) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'checked_out',
    expectedReturnDate: { 
      $gte: new Date(),
      $lte: futureDate 
    }
  })
  .populate('equipment', 'name category')
  .populate('checkedOutTo', 'name email')
  .sort({ expectedReturnDate: 1 });
};

// Static method to get user's active checkouts
equipmentCheckoutSchema.statics.getUserActiveCheckouts = function(userId) {
  return this.find({
    checkedOutTo: userId,
    status: 'checked_out'
  })
  .populate('equipment', 'name category imageUrl')
  .sort({ checkoutDate: -1 });
};

// Static method to get equipment checkout history
equipmentCheckoutSchema.statics.getEquipmentHistory = function(equipmentId) {
  return this.find({ equipment: equipmentId })
    .populate('checkedOutBy', 'name')
    .populate('checkedOutTo', 'name')
    .sort({ checkoutDate: -1 });
};

// Instance method to mark as returned
equipmentCheckoutSchema.methods.markAsReturned = function(returnData = {}) {
  this.status = 'returned';
  this.actualReturnDate = returnData.returnDate || new Date();
  this.conditionAtReturn = returnData.condition || 'good';
  this.returnNotes = returnData.notes || '';
  
  if (returnData.condition === 'damaged' && returnData.damageReport) {
    this.damageReport = returnData.damageReport;
  }
  
  return this.save();
};

// Instance method to extend checkout
equipmentCheckoutSchema.methods.requestExtension = function(extensionData) {
  this.extensions.push({
    requestedBy: extensionData.requestedBy,
    newReturnDate: extensionData.newReturnDate,
    reason: extensionData.reason
  });
  
  return this.save();
};

// Instance method to approve extension
equipmentCheckoutSchema.methods.approveExtension = function(extensionId, approvedBy) {
  const extension = this.extensions.id(extensionId);
  if (extension) {
    extension.status = 'approved';
    extension.approvedBy = approvedBy;
    extension.approvalDate = new Date();
    
    // Update the expected return date
    this.expectedReturnDate = extension.newReturnDate;
  }
  
  return this.save();
};

// Pre-save middleware to update status based on dates
equipmentCheckoutSchema.pre('save', function(next) {
  // Auto-update status to overdue if past expected return date
  if (this.status === 'checked_out' && this.expectedReturnDate < new Date()) {
    this.status = 'overdue';
  }
  
  next();
});

// Post-save middleware to update equipment availability
equipmentCheckoutSchema.post('save', async function(doc) {
  try {
    const Equipment = require('./Equipment');
    const equipment = await Equipment.findById(doc.equipment);
    
    if (equipment) {
      // Count active checkouts for this equipment
      const activeCheckouts = await this.constructor.countDocuments({
        equipment: doc.equipment,
        status: { $in: ['checked_out', 'overdue'] }
      });
      
      // Update equipment checkout status
      if (activeCheckouts > 0) {
        equipment.checkoutStatus = 'checked_out';
      } else {
        equipment.checkoutStatus = 'available';
      }
      
      await equipment.save();
    }
  } catch (error) {
    console.error('Error updating equipment status:', error);
  }
});

module.exports = mongoose.model('EquipmentCheckout', equipmentCheckoutSchema);