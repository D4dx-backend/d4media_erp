const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/encryption');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['super_admin', 'department_admin', 'department_staff', 'reception', 'client'],
    required: [true, 'Role is required']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return ['department_admin', 'department_staff'].includes(this.role);
    }
  },
  phone: {
    type: String,
    trim: true,
    set: function(phone) {
      return phone ? encrypt(phone) : null;
    },
    get: function(phone) {
      return phone ? decrypt(phone) : null;
    }
  },
  avatar: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String,
    select: false
  },
  // Client-specific fields
  company: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    },
    city: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    },
    state: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    },
    zipCode: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    },
    country: {
      type: String,
      set: function(val) { return val ? encrypt(val) : null; },
      get: function(val) { return val ? decrypt(val) : null; }
    }
  },
  // Notification preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    taskUpdates: {
      type: Boolean,
      default: true
    },
    deadlineReminders: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1, department: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  // Use getters to ensure encrypted fields are decrypted
  const userObject = this.toObject({ getters: true });
  delete userObject.password;
  delete userObject.refreshToken;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);