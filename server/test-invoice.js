// Simple test script to verify invoice creation
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/d4-media', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import the Invoice model
const Invoice = require('./src/models/Invoice');

async function testInvoiceCreation() {
  try {
    console.log('Testing invoice creation...');
    
    const testInvoice = {
      invoiceNumber: 'TEST-2025-000001',
      type: 'manual',
      clientDetails: {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '9876543210'
      },
      items: [{
        itemType: 'manual',
        description: 'Test Service',
        quantity: 1,
        rate: 1000,
        amount: 1000
      }],
      subtotal: 1000,
      tax: 18,
      taxAmount: 180,
      total: 1180,
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: 'Test invoice',
      terms: 'Payment due within 30 days',
      createdBy: new mongoose.Types.ObjectId()
    };

    const invoice = await Invoice.create(testInvoice);
    console.log('✅ Invoice created successfully:', invoice._id);
    console.log('Invoice Number:', invoice.invoiceNumber);
    console.log('Total:', invoice.total);
    
    // Clean up
    await Invoice.deleteOne({ _id: invoice._id });
    console.log('✅ Test invoice cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    process.exit(1);
  }
}

testInvoiceCreation();