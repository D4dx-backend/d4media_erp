/**
 * Database indexes for performance optimization
 * This file creates indexes for frequently queried fields to improve performance
 */

const mongoose = require('mongoose');
const { appLogger } = require('./logger');

// Models
const User = require('../models/User');
const Task = require('../models/Task');
const Department = require('../models/Department');
const StudioBooking = require('../models/StudioBooking');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

/**
 * Create indexes for all collections
 */
const createIndexes = async () => {
  try {
    appLogger.info('Creating database indexes for performance optimization...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ department: 1 });
    await User.collection.createIndex({ isActive: 1 });
    appLogger.info('User indexes created');
    
    // Task indexes
    await Task.collection.createIndex({ department: 1, status: 1 });
    await Task.collection.createIndex({ assignedTo: 1, dueDate: 1 });
    await Task.collection.createIndex({ client: 1, createdAt: -1 });
    await Task.collection.createIndex({ status: 1, priority: 1 });
    await Task.collection.createIndex({ dueDate: 1 }, { 
      expireAfterSeconds: 60 * 60 * 24 * 30 * 6 // 6 months TTL for completed tasks
    });
    await Task.collection.createIndex({ 'billing.invoiced': 1 });
    await Task.collection.createIndex({ createdAt: -1 });
    appLogger.info('Task indexes created');
    
    // Department indexes
    await Department.collection.createIndex({ name: 1 }, { unique: true });
    await Department.collection.createIndex({ code: 1 }, { unique: true });
    await Department.collection.createIndex({ isActive: 1 });
    appLogger.info('Department indexes created');
    
    // StudioBooking indexes
    await StudioBooking.collection.createIndex({ bookingDate: 1, 'timeSlot.startTime': 1 });
    await StudioBooking.collection.createIndex({ client: 1 });
    await StudioBooking.collection.createIndex({ status: 1 });
    await StudioBooking.collection.createIndex({ 'paymentStatus': 1 });
    appLogger.info('StudioBooking indexes created');
    
    // Invoice indexes
    await Invoice.collection.createIndex({ invoiceNumber: 1 }, { unique: true });
    await Invoice.collection.createIndex({ client: 1 });
    await Invoice.collection.createIndex({ status: 1 });
    await Invoice.collection.createIndex({ dueDate: 1 });
    await Invoice.collection.createIndex({ createdAt: -1 });
    appLogger.info('Invoice indexes created');
    
    // Notification indexes
    await Notification.collection.createIndex({ recipient: 1 });
    await Notification.collection.createIndex({ read: 1 });
    await Notification.collection.createIndex({ createdAt: 1 }, { 
      expireAfterSeconds: 60 * 60 * 24 * 30 // 30 days TTL for notifications
    });
    appLogger.info('Notification indexes created');
    
    appLogger.info('All database indexes created successfully');
    return true;
  } catch (error) {
    appLogger.error('Error creating database indexes:', error);
    return false;
  }
};

/**
 * Verify indexes for all collections
 */
const verifyIndexes = async () => {
  try {
    appLogger.info('Verifying database indexes...');
    
    const collections = [
      { name: 'users', model: User },
      { name: 'tasks', model: Task },
      { name: 'departments', model: Department },
      { name: 'studiobookings', model: StudioBooking },
      { name: 'invoices', model: Invoice },
      { name: 'notifications', model: Notification }
    ];
    
    for (const collection of collections) {
      const indexes = await collection.model.collection.indexes();
      appLogger.info(`${collection.name} indexes:`, indexes.length);
    }
    
    appLogger.info('Database indexes verified');
    return true;
  } catch (error) {
    appLogger.error('Error verifying database indexes:', error);
    return false;
  }
};

module.exports = {
  createIndexes,
  verifyIndexes
};