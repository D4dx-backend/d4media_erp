const mongoose = require('mongoose');

const auditTrailSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true,
    enum: ['invoice', 'quotation']
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'documentType'
  },
  documentNumber: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created', 'updated', 'deleted', 'status_changed', 
      'sent', 'printed', 'pdf_generated', 'converted',
      'payment_received', 'cancelled', 'approved', 'rejected'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: [{
    field: {
      type: String,
      required: true
    },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changeType: {
      type: String,
      enum: ['added', 'modified', 'removed'],
      default: 'modified'
    }
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    clientInfo: {
      name: String,
      email: String,
      phone: String
    },
    totalAmount: Number,
    status: String,
    reason: String, // For status changes, deletions, etc.
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Indexes for performance
auditTrailSchema.index({ documentType: 1, documentId: 1, timestamp: -1 });
auditTrailSchema.index({ performedBy: 1, timestamp: -1 });
auditTrailSchema.index({ action: 1, timestamp: -1 });
auditTrailSchema.index({ documentNumber: 1 });
auditTrailSchema.index({ timestamp: -1 });

// TTL index to automatically delete old audit logs after 7 years (legal requirement)
auditTrailSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 365 * 24 * 60 * 60 });

// Virtual for formatted timestamp
auditTrailSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Method to get audit trail for a specific document
auditTrailSchema.statics.getDocumentAuditTrail = async function(documentType, documentId) {
  return await this.find({ 
    documentType, 
    documentId 
  })
  .populate('performedBy', 'name email role')
  .sort({ timestamp: -1 });
};

// Method to get user's audit activities
auditTrailSchema.statics.getUserAuditActivities = async function(userId, limit = 100) {
  return await this.find({ performedBy: userId })
    .populate('performedBy', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Method to get audit statistics
auditTrailSchema.statics.getAuditStats = async function(startDate, endDate) {
  const matchQuery = {};
  if (startDate || endDate) {
    matchQuery.timestamp = {};
    if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
    if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          documentType: '$documentType',
          action: '$action'
        },
        count: { $sum: 1 },
        users: { $addToSet: '$performedBy' }
      }
    },
    {
      $group: {
        _id: '$_id.documentType',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            uniqueUsers: { $size: '$users' }
          }
        },
        totalActions: { $sum: '$count' }
      }
    }
  ]);
};

// Pre-save middleware to ensure required fields
auditTrailSchema.pre('save', function(next) {
  // Set document reference path
  if (this.documentType === 'invoice') {
    this.constructor.schema.path('documentId').options.ref = 'Invoice';
  } else if (this.documentType === 'quotation') {
    this.constructor.schema.path('documentId').options.ref = 'Quotation';
  }
  next();
});

module.exports = mongoose.model('AuditTrail', auditTrailSchema);