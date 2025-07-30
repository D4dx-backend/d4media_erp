const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/d4-media', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Simple auth middleware (no external dependencies)
const simpleAuth = (req, res, next) => {
  // For now, just add a mock user
  req.user = {
    _id: 'mock-user-id',
    email: 'admin@d4media.com',
    role: 'super_admin',
    name: 'Admin User'
  };
  next();
};

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Simple Invoice Schema (inline to avoid import issues)
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  type: { type: String, default: 'manual' },
  clientDetails: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, default: 'draft' },
  dueDate: { type: Date, required: true },
  notes: String,
  terms: { type: String, default: 'Payment due within 30 days' },
  createdBy: String
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

// Simple Quotation Schema (inline to avoid import issues)
const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true },
  clientDetails: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, default: 'draft' },
  validUntil: { type: Date, required: true },
  notes: String,
  terms: { type: String, default: 'This quotation is valid for 30 days' },
  createdBy: String
}, { timestamps: true });

const Quotation = mongoose.model('Quotation', quotationSchema);

// Simple number generator
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${year}-${timestamp}`;
};

const generateQuotationNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `QUO-${year}-${timestamp}`;
};

// INVOICE ROUTES
app.get('/api/v1/invoices', simpleAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};
    
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Invoice.countDocuments(query);
    
    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message
    });
  }
});

app.post('/api/v1/invoices', simpleAuth, async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      invoiceNumber: generateInvoiceNumber(),
      createdBy: req.user._id
    };
    
    const invoice = await Invoice.create(invoiceData);
    
    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
});

app.get('/api/v1/invoices/:id', simpleAuth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
});

// QUOTATION ROUTES
app.get('/api/v1/quotations', simpleAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};
    
    const quotations = await Quotation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Quotation.countDocuments(query);
    
    res.json({
      success: true,
      data: quotations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations',
      error: error.message
    });
  }
});

app.post('/api/v1/quotations', simpleAuth, async (req, res) => {
  try {
    const quotationData = {
      ...req.body,
      quotationNumber: generateQuotationNumber(),
      createdBy: req.user._id
    };
    
    const quotation = await Quotation.create(quotationData);
    
    res.status(201).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quotation',
      error: error.message
    });
  }
});

app.get('/api/v1/quotations/:id', simpleAuth, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }
    
    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation',
      error: error.message
    });
  }
});

// EQUIPMENT ROUTES (simple)
app.get('/api/v1/equipment', simpleAuth, (req, res) => {
  // Mock equipment data for now
  const mockEquipment = [
    {
      _id: '1',
      name: 'Professional Microphone',
      category: 'audio',
      pricing: { rental: { dailyRate: 500 }, studio: { dailyRate: 300 } },
      isActive: true
    },
    {
      _id: '2',
      name: 'HD Camera',
      category: 'video',
      pricing: { rental: { dailyRate: 2000 }, studio: { dailyRate: 1500 } },
      isActive: true
    }
  ];
  
  res.json({
    success: true,
    data: mockEquipment
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📄 Invoices: http://localhost:${PORT}/api/v1/invoices`);
  console.log(`📋 Quotations: http://localhost:${PORT}/api/v1/quotations`);
  console.log(`🔧 Equipment: http://localhost:${PORT}/api/v1/equipment`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});