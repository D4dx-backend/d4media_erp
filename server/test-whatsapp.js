const { sendWhatsAppMessage, validatePhoneNumber } = require('./src/services/whatsappService');
require('dotenv').config({ path: './.env' });

async function testWhatsApp() {
  try {
    console.log('Testing WhatsApp service...');
    
    // Test phone number validation
    console.log('\n1. Testing phone number validation:');
    const testNumbers = ['9876543210', '919876543210', '+919876543210', '09876543210'];
    
    for (const number of testNumbers) {
      try {
        const formatted = validatePhoneNumber(number);
        console.log(`${number} -> ${formatted} ✓`);
      } catch (error) {
        console.log(`${number} -> Error: ${error.message} ✗`);
      }
    }
    
    // Test message sending (with a test number - replace with actual)
    console.log('\n2. Testing message sending:');
    const testPhone = '9876543210'; // Replace with actual test number
    const testMessage = 'Hello! This is a test message from D4 Media invoice system. Testing DXing API integration.';
    
    console.log(`Sending test message to ${testPhone}...`);
    const result = await sendWhatsAppMessage(testPhone, testMessage);
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testWhatsApp();
}

module.exports = { testWhatsApp };