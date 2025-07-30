const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Simple User schema for creating test user
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'admin@d4media.com' });
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('Email: admin@d4media.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create test user
    const testUser = new User({
      name: 'Admin User',
      email: 'admin@d4media.com',
      password: 'admin123',
      role: 'super_admin'
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('Email: admin@d4media.com');
    console.log('Password: admin123');
    console.log('Role: super_admin');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createTestUser();