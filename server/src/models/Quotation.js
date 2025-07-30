const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: true,
    unique: true
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
  items: [{
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'],
    default: 'draft'
  },
  validUntil: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  },
  terms: {
    type: String,
    default: 'This quotation is valid for 30 days from the date of issue.'
  },
  convertedToInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ client: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ createdAt: -1 });
quotationSchema.index({ validUntil: 1 });

// Virtual for checking if quotation is expired
quotationSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil && this.status !== 'accepted' && this.status !== 'converted';
});

// Pre-save middleware to update expired quotations
quotationSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'sent') {
    this.status = 'expired';
  }
  next();
});

// Static method to find expired quotations
quotationSchema.statics.findExpired = function() {
  return this.find({
    validUntil: { $lt: new Date() },
    status: { $in: ['draft', 'sent'] }
  });
};

// Static method to update expired quotations
quotationSchema.statics.updateExpired = async function() {
  const result = await this.updateMany(
    {
      validUntil: { $lt: new Date() },
      status: { $in: ['draft', 'sent'] }
    },
    { status: 'expired' }
  );
  return result;
};

module.exports = mongoose.model('Quotation', quotationSchema);