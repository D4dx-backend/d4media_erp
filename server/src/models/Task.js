const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'pending'
  },
  taskType: {
    type: String,
    required: [true, 'Task type is required']
  },
  estimatedHours: {
    type: Number,
    min: [0.1, 'Estimated hours must be at least 0.1'],
    default: 1
  },
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative'],
    default: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  startDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  // File attachments
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Progress tracking
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    notes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Time tracking
  timeEntries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // in minutes
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Status change history
  statusHistory: [{
    previousStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled']
    },
    newStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  // Billing information
  billing: {
    rate: {
      type: Number,
      default: 0
    },
    billable: {
      type: Boolean,
      default: true
    },
    invoiced: {
      type: Boolean,
      default: false
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    }
  },
  // Department-specific fields
  departmentSpecific: {
    type: mongoose.Schema.Types.Mixed
  },
  tags: [String],
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
taskSchema.index({ department: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ client: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function () {
  return this.dueDate < new Date() && !['completed', 'cancelled'].includes(this.status);
});

// Virtual for days remaining
taskSchema.virtual('daysRemaining').get(function () {
  if (['completed', 'cancelled'].includes(this.status)) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Update progress percentage when status changes and track status history
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    // Track status change history
    if (this.isNew === false) { // Only for existing documents
      this.statusHistory.push({
        previousStatus: this._original?.status,
        newStatus: this.status,
        changedBy: this._statusChangedBy || this.assignedTo || this.createdBy,
        changedAt: new Date(),
        reason: this._statusChangeReason
      });
    }

    switch (this.status) {
      case 'pending':
        this.progress.percentage = 0;
        break;
      case 'in_progress':
        if (this.progress.percentage === 0) this.progress.percentage = 25;
        this.startDate = this.startDate || new Date();
        break;
      case 'review':
        if (this.progress.percentage < 75) this.progress.percentage = 75;
        break;
      case 'completed':
        this.progress.percentage = 100;
        this.completedDate = new Date();
        // Stop any active time entries
        this.timeEntries.forEach(entry => {
          if (entry.isActive) {
            entry.isActive = false;
            entry.endTime = new Date();
            if (!entry.duration) {
              entry.duration = Math.round((entry.endTime - entry.startTime) / (1000 * 60));
            }
          }
        });
        break;
    }
  }

  // Calculate actual hours from time entries
  if (this.isModified('timeEntries')) {
    this.actualHours = this.timeEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + (entry.duration / 60); // Convert minutes to hours
      }
      return total;
    }, 0);
  }

  next();
});

// Store original values for comparison
taskSchema.pre('save', function (next) {
  if (!this.isNew) {
    this._original = this.toObject();
  }
  next();
});

// Static method to get tasks by department
taskSchema.statics.getByDepartment = function (departmentId, options = {}) {
  const query = { department: departmentId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.assignedTo) {
    query.assignedTo = options.assignedTo;
  }

  return this.find(query)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('client', 'name email company')
    .sort({ createdAt: -1 });
};

// Instance method to add progress note
taskSchema.methods.addProgressNote = function (note, userId) {
  this.progress.notes.push({
    note,
    addedBy: userId,
    addedAt: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('Task', taskSchema);