const mongoose = require('mongoose');

const eventCheckoutSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['event', 'client_project', 'temporary', 'maintenance'],
    default: 'event'
  },
  responsiblePerson: {
    type: String,
    required: [true, 'Responsible person is required'],
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required']
  },
  eventLocation: {
    type: String,
    trim: true
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'Expected return date is required']
  },
  items: [{
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['checked_out', 'returned', 'overdue'],
    default: 'checked_out'
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkoutDate: {
    type: Date,
    default: Date.now
  },
  returnDate: {
    type: Date
  },
  returnCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
  },
  returnNotes: {
    type: String,
    trim: true
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventCheckoutSchema.index({ eventDate: 1 });
eventCheckoutSchema.index({ expectedReturnDate: 1 });
eventCheckoutSchema.index({ status: 1 });
eventCheckoutSchema.index({ eventType: 1 });
eventCheckoutSchema.index({ responsiblePerson: 1 });

// Virtual for checking if checkout is overdue
eventCheckoutSchema.virtual('isOverdue').get(function() {
  return this.status === 'checked_out' && new Date(this.expectedReturnDate) < new Date();
});

// Virtual for days overdue
eventCheckoutSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'checked_out') return 0;
  const today = new Date();
  const expectedReturn = new Date(this.expectedReturnDate);
  if (today <= expectedReturn) return 0;
  return Math.ceil((today - expectedReturn) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status based on dates
eventCheckoutSchema.pre('save', function(next) {
  if (this.status === 'checked_out' && new Date(this.expectedReturnDate) < new Date()) {
    this.status = 'overdue';
  }
  next();
});

// Static method to find overdue checkouts
eventCheckoutSchema.statics.findOverdue = function() {
  return this.find({
    status: 'checked_out',
    expectedReturnDate: { $lt: new Date() }
  });
};

// Static method to get checkout statistics
eventCheckoutSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    checked_out: 0,
    returned: 0,
    overdue: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// Instance method to calculate total equipment items
eventCheckoutSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

// Instance method to get equipment summary
eventCheckoutSchema.methods.getEquipmentSummary = function() {
  return this.items.map(item => ({
    name: item.equipment.name,
    code: item.equipment.code,
    quantity: item.quantity,
    notes: item.notes
  }));
};

module.exports = mongoose.model('EventCheckout', eventCheckoutSchema);