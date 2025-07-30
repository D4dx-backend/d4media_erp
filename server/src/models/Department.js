const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Department code cannot exceed 10 characters']
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    defaultTaskPriority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    autoAssignment: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  // Department-specific configurations
  taskTypes: [{
    name: {
      type: String,
      required: true
    },
    estimatedHours: {
      type: Number,
      default: 1
    },
    billingRate: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for staff count
departmentSchema.virtual('staffCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true
});

// Virtual for active tasks count
departmentSchema.virtual('activeTasksCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'department',
  count: true,
  match: { status: { $in: ['pending', 'in_progress', 'review'] } }
});

// Index for performance
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);