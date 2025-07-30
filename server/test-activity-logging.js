const mongoose = require('mongoose');
const ActivityLog = require('./src/models/ActivityLog');
const AuditTrail = require('./src/models/AuditTrail');
require('dotenv').config({ path: '../.env' });

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test activity logging
const testActivityLogging = async () => {
  try {
    console.log('\n🧪 Testing Activity Logging...\n');

    // Create a test activity log
    const testActivity = await ActivityLog.create({
      user: new mongoose.Types.ObjectId(),
      action: 'login',
      resource: 'user',
      resourceId: new mongoose.Types.ObjectId(),
      details: {
        description: 'Test user logged in successfully',
        metadata: {
          userRole: 'super_admin',
          testMode: true
        }
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      sessionId: 'test-session-123',
      success: true,
      duration: 150,
      timestamp: new Date()
    });

    console.log('✅ Activity log created:', {
      id: testActivity._id,
      action: testActivity.action,
      resource: testActivity.resource,
      success: testActivity.success
    });

    // Create a test audit trail
    const testAudit = await AuditTrail.create({
      documentType: 'invoice',
      documentId: new mongoose.Types.ObjectId(),
      documentNumber: 'INV-TEST-001',
      action: 'created',
      performedBy: new mongoose.Types.ObjectId(),
      changes: [
        {
          field: 'status',
          oldValue: null,
          newValue: 'draft',
          changeType: 'added'
        }
      ],
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        totalAmount: 1000,
        status: 'draft'
      },
      timestamp: new Date()
    });

    console.log('✅ Audit trail created:', {
      id: testAudit._id,
      documentType: testAudit.documentType,
      documentNumber: testAudit.documentNumber,
      action: testAudit.action
    });

    // Test queries
    console.log('\n📊 Testing Queries...\n');

    // Get recent activities
    const recentActivities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(5);
    console.log(`✅ Found ${recentActivities.length} recent activities`);

    // Get audit trail for document
    const auditTrail = await AuditTrail.find({ documentType: 'invoice' })
      .sort({ timestamp: -1 })
      .limit(5);
    console.log(`✅ Found ${auditTrail.length} audit trail entries`);

    // Test activity summary
    const activitySummary = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    console.log('✅ Activity summary:', activitySummary);

    console.log('\n🎉 All tests passed! Activity logging is working correctly.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run tests
const runTests = async () => {
  await connectDB();
  await testActivityLogging();
  
  console.log('🧹 Cleaning up test data...');
  
  // Clean up test data
  await ActivityLog.deleteMany({ 'details.metadata.testMode': true });
  await AuditTrail.deleteMany({ documentNumber: 'INV-TEST-001' });
  
  console.log('✅ Test data cleaned up');
  
  mongoose.connection.close();
  console.log('👋 Database connection closed');
};

runTests().catch(console.error);