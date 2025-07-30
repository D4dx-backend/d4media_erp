// Simple test to check if the server can start without errors
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Try to import routes one by one to identify the problematic one
console.log('Testing route imports...');

try {
  console.log('1. Testing auth routes...');
  const authRoutes = require('./src/routes/authRoutes');
  app.use('/api/v1/auth', authRoutes);
  console.log('✅ Auth routes OK');
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
}

try {
  console.log('2. Testing user routes...');
  const userRoutes = require('./src/routes/userRoutes');
  app.use('/api/v1/users', userRoutes);
  console.log('✅ User routes OK');
} catch (error) {
  console.error('❌ User routes failed:', error.message);
}

try {
  console.log('3. Testing equipment routes...');
  const equipmentRoutes = require('./src/routes/equipmentRoutes');
  app.use('/api/v1/equipment', equipmentRoutes);
  console.log('✅ Equipment routes OK');
} catch (error) {
  console.error('❌ Equipment routes failed:', error.message);
}

try {
  console.log('4. Testing invoice routes...');
  const invoiceRoutes = require('./src/routes/invoiceRoutes');
  app.use('/api/v1/invoices', invoiceRoutes);
  console.log('✅ Invoice routes OK');
} catch (error) {
  console.error('❌ Invoice routes failed:', error.message);
}

try {
  console.log('5. Testing quotation routes...');
  const quotationRoutes = require('./src/routes/quotationRoutes');
  app.use('/api/v1/quotations', quotationRoutes);
  console.log('✅ Quotation routes OK');
} catch (error) {
  console.error('❌ Quotation routes failed:', error.message);
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log('All route imports successful!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down test server...');
  process.exit(0);
});