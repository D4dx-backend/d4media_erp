const mongoose = require('mongoose');

/**
 * Generate unique invoice number
 * Format: INV-YYYY-NNNNNN
 */
const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  
  try {
    // Use mongoose connection to avoid circular dependency
    const Invoice = mongoose.model('Invoice');
    
    // Find the latest invoice for current year
    const latestInvoice = await Invoice.findOne({
      invoiceNumber: { $regex: `^${prefix}` }
    }).sort({ invoiceNumber: -1 });
    
    let nextNumber = 1;
    if (latestInvoice) {
      const lastNumber = parseInt(latestInvoice.invoiceNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    // Pad with zeros to make it 6 digits
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    // Fallback to timestamp-based number if model not available
    console.warn('Using fallback invoice number generation:', error.message);
    return `INV-${currentYear}-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Generate unique quotation number
 * Format: QUO-YYYY-NNNNNN
 */
const generateQuotationNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `QUO-${currentYear}-`;
  
  try {
    // Use mongoose connection to avoid circular dependency
    const Quotation = mongoose.model('Quotation');
    
    // Find the latest quotation for current year
    const latestQuotation = await Quotation.findOne({
      quotationNumber: { $regex: `^${prefix}` }
    }).sort({ quotationNumber: -1 });
    
    let nextNumber = 1;
    if (latestQuotation) {
      const lastNumber = parseInt(latestQuotation.quotationNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    // Pad with zeros to make it 6 digits
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    // Fallback to timestamp-based number if model not available
    console.warn('Using fallback quotation number generation:', error.message);
    return `QUO-${currentYear}-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Generate unique booking reference
 * Format: BKG-YYYY-NNNNNN
 */
const generateBookingReference = async (modelName = 'StudioBooking') => {
  const currentYear = new Date().getFullYear();
  const prefix = `BKG-${currentYear}-`;
  
  try {
    const BookingModel = mongoose.model(modelName);
    
    // Find the latest booking for current year
    const latestBooking = await BookingModel.findOne({
      bookingReference: { $regex: `^${prefix}` }
    }).sort({ bookingReference: -1 });
    
    let nextNumber = 1;
    if (latestBooking) {
      const lastNumber = parseInt(latestBooking.bookingReference.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    // Pad with zeros to make it 6 digits
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    console.warn('Using fallback booking reference generation:', error.message);
    return `BKG-${currentYear}-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Generate unique task reference
 * Format: TSK-YYYY-NNNNNN
 */
const generateTaskReference = async (modelName = 'Task') => {
  const currentYear = new Date().getFullYear();
  const prefix = `TSK-${currentYear}-`;
  
  try {
    const TaskModel = mongoose.model(modelName);
    
    // Find the latest task for current year
    const latestTask = await TaskModel.findOne({
      taskReference: { $regex: `^${prefix}` }
    }).sort({ taskReference: -1 });
    
    let nextNumber = 1;
    if (latestTask) {
      const lastNumber = parseInt(latestTask.taskReference.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    // Pad with zeros to make it 6 digits
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    console.warn('Using fallback task reference generation:', error.message);
    return `TSK-${currentYear}-${Date.now().toString().slice(-6)}`;
  }
};

module.exports = {
  generateInvoiceNumber,
  generateQuotationNumber,
  generateBookingReference,
  generateTaskReference
};