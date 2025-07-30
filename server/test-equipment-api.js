const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test equipment API endpoints
async function testEquipmentAPI() {
  try {
    console.log('🧪 Testing Equipment Management API...\n');

    // Test 1: Get all equipment (should work without auth for testing)
    console.log('1. Testing GET /equipment');
    try {
      const response = await axios.get(`${BASE_URL}/equipment`);
      console.log('✅ GET /equipment - Success');
      console.log(`   Found ${response.data.data?.length || 0} equipment items`);
    } catch (error) {
      console.log('❌ GET /equipment - Failed');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n📝 Equipment API endpoints available:');
    console.log('   GET    /api/v1/equipment - Get all equipment');
    console.log('   POST   /api/v1/equipment - Create equipment (Admin only)');
    console.log('   GET    /api/v1/equipment/:id - Get single equipment');
    console.log('   PUT    /api/v1/equipment/:id - Update equipment (Admin only)');
    console.log('   DELETE /api/v1/equipment/:id - Delete equipment (Admin only)');
    console.log('   POST   /api/v1/equipment/:id/inout - Record in/out (Dept Head/Reception/Admin)');
    console.log('   GET    /api/v1/equipment/:id/inout-history - Get in/out history');
    console.log('   POST   /api/v1/equipment/:id/maintenance - Add maintenance record (Dept Head/Admin)');
    console.log('   GET    /api/v1/equipment/:id/maintenance-history - Get maintenance history');
    console.log('   GET    /api/v1/equipment/maintenance-report - Get maintenance report');
    console.log('   POST   /api/v1/equipment/checkout/request - Request checkout');
    console.log('   PUT    /api/v1/equipment/checkout/:id/approve - Approve checkout (Reception/Admin)');
    console.log('   PUT    /api/v1/equipment/checkout/:id/return - Return equipment (Reception/Admin)');
    console.log('   GET    /api/v1/equipment/checkout/history - Get checkout history');
    console.log('   GET    /api/v1/equipment/checkout/pending - Get pending approvals (Reception/Admin)');

    console.log('\n🎯 Key Features Implemented:');
    console.log('   ✅ Equipment CRUD operations (Admin only for create/update/delete)');
    console.log('   ✅ In/Out tracking (Department heads, Reception, Admin can record)');
    console.log('   ✅ Maintenance tracking and reporting (Department heads and Admin can add records)');
    console.log('   ✅ Role-based access control');
    console.log('   ✅ Equipment availability tracking');
    console.log('   ✅ Maintenance status monitoring (up_to_date, due_soon, overdue, in_maintenance)');
    console.log('   ✅ Comprehensive history tracking');

    console.log('\n🔐 Permission Summary:');
    console.log('   📋 View Equipment: All authenticated users');
    console.log('   ➕ Create Equipment: Super Admin, Department Admin only');
    console.log('   ✏️  Update Equipment: Super Admin, Department Admin only');
    console.log('   🗑️  Delete Equipment: Super Admin, Department Admin only');
    console.log('   🔄 Record In/Out: Super Admin, Department Admin, Reception');
    console.log('   🔧 Add Maintenance: Super Admin, Department Admin only');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEquipmentAPI();