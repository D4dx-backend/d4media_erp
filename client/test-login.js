// Simple test script to verify login functionality
import axios from 'axios';

const API_URL = 'https://d4media-erp-hxqid.ondigitalocean.app/api/v1';

async function testLogin() {
  try {
    console.log('Testing login with API URL:', API_URL);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@d4media.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
    // Test getting user profile
    const profileResponse = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${response.data.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Profile fetch successful!');
    console.log('User:', profileResponse.data.user);
    
  } catch (error) {
    console.error('❌ Login test failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin();