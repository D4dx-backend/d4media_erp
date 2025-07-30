const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clientDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    phone: {
      type: String
    },
    address: {
      type: String
    }
  },
  type: {
    type: String,
    enum: ['task_based', 'studio_booking', 'periodic', 'manual', 'quotation_conversion'],
    required: [true, 'Invoice type is required']
  },
  items: [{
    itemType: {
      type: String,
      enum: ['task', 'booking', 'equipment', 'manual'],
      default: 'manual'
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: function() {
        return this.itemType === 'task' ? 'Task' : 
               this.itemType === 'booking' ? 'StudioBooking' : 
               this.itemType === 'equipment' ? 'Equipment' : null;
      }
    },
    description: {
      type: String,
      required: [true, 'Item description is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    }
  }],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  tax: {
    type: Number,
    default: 18,
    min: [0, 'Tax cannot be negative'],
    max: [100, 'Tax cannot exceed 100%']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  paidDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  terms: {
    type: String,
    default: 'Payment due within 30 days of invoice date.'
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'cash', 'check', 'other'],
    },
    transactionId: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    },
    cardLastFour: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    },
    bankAccount: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    },
    checkNumber: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    },
    notes: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ client: 1, status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ createdAt: -1 });

// Virtual for overdue status
invoiceSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'paid' && this.status !== 'cancelled';
});

// Auto-generate invoice number if not provided
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      // Simple fallback number generation
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      this.invoiceNumber = `INV-${year}-${timestamp.toString().slice(-6)}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      this.invoiceNumber = `INV-${Date.now()}`;
    }
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);