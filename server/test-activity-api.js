const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const API_URL = 'http://localhost:5001/api/v1';

// Test user credentials
const testUser = {
  email: 'admin@d4media.com',
  password: 'admin123'
};

let authToken = '';

const testAPI = async () => {
  try {
    console.log('🧪 Testing Activity API Endpoints...\n');

    // Step 1: Login to get auth token
    console.log('1. Logging in...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, testUser);
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      console.log('Please make sure you have a test user with email:', testUser.email);
      return;
    }

    // Set up axios with auth header
    const api = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test user activities endpoint
    console.log('\n2. Testing user activities endpoint...');
    try {
      const activitiesResponse = await api.get('/activities/user');
      console.log('✅ User activities endpoint working');
      console.log(`   Found ${activitiesResponse.data.data.length} activities`);
      console.log(`   Total: ${activitiesResponse.data.pagination?.total || 0}`);
    } catch (error) {
      console.log('❌ User activities failed:', error.response?.data?.message || error.message);
      console.log('   Status:', error.response?.status);
    }

    // Step 3: Test system activities endpoint (if user is admin)
    console.log('\n3. Testing system activities endpoint...');
    try {
      const systemResponse = await api.get('/activities/system');
      console.log('✅ System activities endpoint working');
      console.log(`   Found ${systemResponse.data.data.length} system activities`);
    } catch (error) {
      console.log('❌ System activities failed:', error.response?.data?.message || error.message);
      console.log('   Status:', error.response?.status);
      if (error.response?.status === 403) {
        console.log('   (This is expected if user is not super admin)');
      }
    }

    // Step 4: Test activity stats endpoint
    console.log('\n4. Testing activity stats endpoint...');
    try {
      const statsResponse = await api.get('/activities/stats');
      console.log('✅ Activity stats endpoint working');
      console.log('   Action stats:', statsResponse.data.data.actionStats?.length || 0);
      console.log('   Resource stats:', statsResponse.data.data.resourceStats?.length || 0);
    } catch (error) {
      console.log('❌ Activity stats failed:', error.response?.data?.message || error.message);
      console.log('   Status:', error.response?.status);
    }

    // Step 5: Test login history endpoint
    console.log('\n5. Testing login history endpoint...');
    try {
      const loginHistoryResponse = await api.get('/activities/login-history');
      console.log('✅ Login history endpoint working');
      console.log(`   Found ${loginHistoryResponse.data.data.length} login records`);
    } catch (error) {
      console.log('❌ Login history failed:', error.response?.data?.message || error.message);
      console.log('   Status:', error.response?.status);
      if (error.response?.status === 403) {
        console.log('   (This is expected if user is not super admin)');
      }
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
  }
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get(`${API_URL.replace('/api/v1', '')}/api/v1/health`);
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Please start the server with: npm run dev');
    return false;
  }
};

const runTests = async () => {
  console.log('🔍 Checking server status...');
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await testAPI();
  }
};

runTests().catch(console.error);