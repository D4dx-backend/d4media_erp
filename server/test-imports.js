// Test script to check which functions are undefined
try {
  const {
    getInvoices,
    getInvoice,
    createInvoice,
    createEventBookingInvoice,
    createRentalInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    generateInvoicePDF,
    sendInvoiceToCustomer,
    getClientInvoices,
    getInvoiceStats
  } = require('./src/controllers/invoiceController');

  console.log('Testing function imports...');
  
  const functions = {
    getInvoices,
    getInvoice,
    createInvoice,
    createEventBookingInvoice,
    createRentalInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    generateInvoicePDF,
    sendInvoiceToCustomer,
    getClientInvoices,
    getInvoiceStats
  };

  for (const [name, func] of Object.entries(functions)) {
    if (typeof func === 'undefined') {
      console.error(`❌ ${name} is undefined`);
    } else if (typeof func !== 'function') {
      console.error(`❌ ${name} is not a function, it's a ${typeof func}`);
    } else {
      console.log(`✅ ${name} is properly defined`);
    }
  }

  console.log('Import test completed');
} catch (error) {
  console.error('Error importing functions:', error);
}