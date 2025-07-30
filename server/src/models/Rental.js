const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client is required']
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
    }
  },
  rentalDate: {
    type: Date,
    required: [true, 'Rental date is required']
  },
  returnDate: {
    type: Date,
    required: [true, 'Return date is required']
  },
  equipment: [{
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    rate: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['rented', 'returned', 'damaged', 'lost'],
      default: 'rented'
    },
    returnedDate: Date,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'damaged'],
      default: 'excellent'
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rented', 'partially_returned', 'completed', 'cancelled'],
    default: 'pending'
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    securityDeposit: {
      type: Number,
      default: 0
    },
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
  securityDepositStatus: {
    type: String,
    enum: ['pending', 'collected', 'refunded', 'forfeited'],
    default: 'pending'
  },
  purpose: {
    type: String,
    required: [true, 'Rental purpose is required'],
    trim: true
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  deliveryRequired: {
    type: Boolean,
    default: false
  },
  pickupRequired: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
rentalSchema.index({ client: 1, status: 1 });
rentalSchema.index({ rentalDate: 1, returnDate: 1 });
rentalSchema.index({ 'equipment.equipmentId': 1 });

// Virtual for rental duration in days
rentalSchema.virtual('durationDays').get(function() {
  const diffTime = this.returnDate - this.rentalDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
rentalSchema.virtual('isOverdue').get(function() {
  return this.returnDate < new Date() && this.status !== 'completed' && this.status !== 'cancelled';
});

// Static method to check equipment availability
rentalSchema.statics.checkEquipmentAvailability = async function(equipmentId, startDate, endDate, excludeRentalId = null) {
  const query = {
    'equipment.equipmentId': equipmentId,
    status: { $in: ['confirmed', 'rented', 'partially_returned'] },
    $or: [
      {
        rentalDate: { $lte: endDate },
        returnDate: { $gte: startDate }
      }
    ]
  };
  
  if (excludeRentalId) {
    query._id = { $ne: excludeRentalId };
  }
  
  const conflictingRentals = await this.find(query);
  return conflictingRentals.length === 0;
};

// Instance method to calculate total amount
rentalSchema.methods.calculateTotal = function() {
  const subtotal = this.equipment.reduce((sum, item) => sum + item.totalAmount, 0);
  const total = subtotal - this.pricing.discount + this.pricing.securityDeposit;
  
  this.pricing.subtotal = subtotal;
  this.pricing.totalAmount = total;
  
  return total;
};

// Instance method to mark equipment as returned
rentalSchema.methods.returnEquipment = function(equipmentId, condition = 'good', notes = '') {
  const equipmentItem = this.equipment.find(item => 
    item.equipmentId.toString() === equipmentId.toString()
  );
  
  if (equipmentItem) {
    equipmentItem.status = 'returned';
    equipmentItem.returnedDate = new Date();
    equipmentItem.condition = condition;
    equipmentItem.notes = notes;
    
    // Check if all equipment is returned
    const allReturned = this.equipment.every(item => item.status === 'returned');
    if (allReturned) {
      this.status = 'completed';
    } else {
      this.status = 'partially_returned';
    }
  }
  
  return this.save();
};

module.exports = mongoose.model('Rental', rentalSchema);