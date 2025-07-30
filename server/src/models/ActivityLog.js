const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'login', 'logout', 'register', 'password_change',
      
      // Invoice actions
      'invoice_create', 'invoice_update', 'invoice_delete', 'invoice_status_change',
      'invoice_pdf_generate', 'invoice_send', 'invoice_print',
      
      // Quotation actions
      'quotation_create', 'quotation_update', 'quotation_delete', 'quotation_status_change',
      'quotation_pdf_generate', 'quotation_send', 'quotation_print', 'quotation_convert_to_invoice',
      
      // Task actions
      'task_create', 'task_update', 'task_delete', 'task_assign', 'task_status_change',
      
      // User management
      'user_create', 'user_update', 'user_delete', 'user_activate', 'user_deactivate',
      
      // Department actions
      'department_create', 'department_update', 'department_delete',
      
      // Equipment actions
      'equipment_create', 'equipment_update', 'equipment_delete',
      'equipment_checkout_request', 'equipment_checkout_approve', 'equipment_return',
      'equipment_send_whatsapp',
      
      // Rental actions
      'rental_create', 'rental_update', 'rental_delete', 'rental_status_change',
      
      // Studio booking actions
      'studio_booking_create', 'studio_booking_update', 'studio_booking_delete', 'studio_booking_status_change',
      
      // General actions
      'view', 'export', 'import', 'backup', 'restore'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'user', 'invoice', 'quotation', 'task', 'department', 
      'equipment', 'rental', 'studio_booking', 'notification', 
      'report', 'system'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.resource !== 'system';
    }
  },
  details: {
    description: String,
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  sessionId: String,
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  duration: Number, // in milliseconds
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We're using custom timestamp field
});

// Indexes for performance
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete old logs after 1 year
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual for formatted timestamp
activityLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Method to get activity summary
activityLogSchema.statics.getActivitySummary = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to get recent activities
activityLogSchema.statics.getRecentActivities = async function(userId, limit = 50) {
  return await this.find({ user: userId })
    .populate('user', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);