const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/d4-media', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Test routes
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working'
  });
});

// Basic invoice routes (without authentication for testing)
app.get('/api/v1/invoices', (req, res) => {
  res.json({
    success: true,
    message: 'Get invoices endpoint',
    data: []
  });
});

app.post('/api/v1/invoices', (req, res) => {
  res.json({
    success: true,
    message: 'Create invoice endpoint',
    data: req.body
  });
});

// Basic quotation routes (without authentication for testing)
app.get('/api/v1/quotations', (req, res) => {
  res.json({
    success: true,
    message: 'Get quotations endpoint',
    data: []
  });
});

app.post('/api/v1/quotations', (req, res) => {
  res.json({
    success: true,
    message: 'Create quotation endpoint',
    data: req.body
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/v1/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});