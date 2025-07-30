const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const API_URL = 'http://localhost:5001/api/v1';

const testUser = {
  email: 'admin@d4media.com',
  password: 'admin123'
};

const generateTestActivities = async () => {
  try {
    console.log('🎯 Generating test activities...\n');

    // Login to get auth token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, testUser);
    const authToken = loginResponse.data.token;
    console.log('✅ Logged in successfully');

    const api = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Generate various activities
    const activities = [
      // View activities
      { method: 'get', url: '/invoices', description: 'View invoices' },
      { method: 'get', url: '/quotations', description: 'View quotations' },
      { method: 'get', url: '/tasks', description: 'View tasks' },
      
      // Stats activities
      { method: 'get', url: '/invoices/stats/summary', description: 'View invoice stats' },
      { method: 'get', url: '/quotations/stats/summary', description: 'View quotation stats' },
      
      // Activity views
      { method: 'get', url: '/activities/user', description: 'View user activities' },
      { method: 'get', url: '/activities/system', description: 'View system activities' },
      { method: 'get', url: '/activities/stats', description: 'View activity stats' },
    ];

    console.log('Generating activities...');
    for (const activity of activities) {
      try {
        await api[activity.method](activity.url);
        console.log(`✅ ${activity.description}`);
        // Small delay to spread out the activities
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`⚠️  ${activity.description} - ${error.response?.status || 'Error'}`);
      }
    }

    // Logout to generate logout activity
    await api.post('/auth/logout');
    console.log('✅ Logged out');

    console.log('\n🎉 Test activities generated successfully!');
    console.log('You can now check the Activity History page to see the logged activities.');

  } catch (error) {
    console.error('❌ Error generating test activities:', error.message);
  }
};

generateTestActivities();