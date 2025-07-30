const Invoice = require('../models/Invoice');
const { validationResult } = require('express-validator');
const { generateInvoiceNumber } = require('../utils/numberGenerator');

// @desc    Get all invoices
// @route   GET /api/v1/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      client,
      type,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query
    let query = {};

    // Role-based filtering
    if (req.user.role === 'client') {
      query.client = req.user._id;
    }

    // Apply filters
    if (status) query.status = status;
    if (client && req.user.role !== 'client') query.client = client;
    if (type) query.type = type;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'clientDetails.name': { $regex: search, $options: 'i' } },
        { 'clientDetails.email': { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('client', 'name email')
      .populate('createdBy', 'name email')
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
};

// @desc    Get single invoice
// @route   GET /api/v1/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone company')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'client' && invoice.client?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
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
};

// @desc    Create new invoice
// @route   POST /api/v1/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const invoiceData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = await generateInvoiceNumber();
    }

    // Calculate totals if not provided
    if (invoiceData.items && invoiceData.items.length > 0) {
      let subtotal = 0;
      
      // Calculate item amounts and subtotal
      invoiceData.items = invoiceData.items.map(item => {
        const amount = (item.quantity || 1) * (item.rate || 0);
        subtotal += amount;
        return { ...item, amount };
      });

      invoiceData.subtotal = subtotal;
      
      // Calculate tax amount
      const taxRate = invoiceData.tax || 0;
      invoiceData.taxAmount = (subtotal * taxRate) / 100;
      
      // Calculate total
      const discount = invoiceData.discount || 0;
      invoiceData.total = subtotal + invoiceData.taxAmount - discount;
    }

    const invoice = await Invoice.create(invoiceData);

    // Populate the created invoice
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permissions
    if (req.user.role === 'client') {
      return res.status(403).json({
        success: false,
        message: 'Clients cannot update invoices'
      });
    }

    // Prevent updating paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid invoices'
      });
    }

    const updateData = { ...req.body };

    // Recalculate totals if items are updated
    if (updateData.items && updateData.items.length > 0) {
      let subtotal = 0;
      
      updateData.items = updateData.items.map(item => {
        const amount = (item.quantity || 1) * (item.rate || 0);
        subtotal += amount;
        return { ...item, amount };
      });

      updateData.subtotal = subtotal;
      
      const taxRate = updateData.tax !== undefined ? updateData.tax : invoice.tax;
      updateData.taxAmount = (subtotal * taxRate) / 100;
      
      const discount = updateData.discount !== undefined ? updateData.discount : invoice.discount;
      updateData.total = subtotal + updateData.taxAmount - discount;
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('client', 'name email')
     .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message
    });
  }
};

// @desc    Update invoice status
// @route   PUT /api/v1/invoices/:id/status
// @access  Private
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paidDate, paymentInfo } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const updateData = { status };

    // Handle payment status
    if (status === 'paid') {
      updateData.paidDate = paidDate || new Date();
      if (paymentInfo) {
        updateData.paymentInfo = paymentInfo;
      }
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('client', 'name email')
     .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status',
      error: error.message
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/v1/invoices/:id
// @access  Private (Admin only)
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Prevent deleting paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid invoices'
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message
    });
  }
};

// @desc    Get invoice statistics
// @route   GET /api/v1/invoices/stats/summary
// @access  Private
exports.getInvoiceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    
    // Role-based filtering
    if (req.user.role === 'client') {
      matchQuery.client = req.user._id;
    }
    
    // Date range filter
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $ne: ['$status', 'paid'] }, '$total', 0]
            }
          },
          overdueAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'paid'] },
                    { $ne: ['$status', 'cancelled'] }
                  ]
                },
                '$total',
                0
              ]
            }
          }
        }
      }
    ]);

    const statusBreakdown = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$total' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0
        },
        statusBreakdown
      }
    });

  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice statistics',
      error: error.message
    });
  }
};

// @desc    Get client invoices
// @route   GET /api/v1/invoices/client
// @access  Private (Client only)
exports.getClientInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { client: req.user._id };
    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .populate('createdBy', 'name email')
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
    console.error('Error fetching client invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client invoices',
      error: error.message
    });
  }
};
// @desc    Generate invoice PDF
// @route   GET /api/v1/invoices/:id/pdf
// @access  Private
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { generateInvoicePDF } = require('../services/pdfService');
    
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone company')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'client' && invoice.client?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice PDF',
      error: error.message
    });
  }
};



// @desc    Create event booking invoice
// @route   POST /api/v1/invoices/event-booking
// @access  Private
exports.createEventBookingInvoice = async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      type: 'studio_booking',
      createdBy: req.user._id
    };

    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = await generateInvoiceNumber();
    }

    const invoice = await Invoice.create(invoiceData);

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Event booking invoice created successfully',
      data: populatedInvoice
    });

  } catch (error) {
    console.error('Error creating event booking invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event booking invoice',
      error: error.message
    });
  }
};

// @desc    Create rental invoice
// @route   POST /api/v1/invoices/rental
// @access  Private
exports.createRentalInvoice = async (req, res) => {
  try {
    const { rentalId } = req.body;

    if (!rentalId) {
      return res.status(400).json({
        success: false,
        message: 'Rental ID is required'
      });
    }

    // Get the rental with populated data
    const Rental = require('../models/Rental');
    const rental = await Rental.findById(rentalId)
      .populate('client', 'name email phone company')
      .populate('equipment.equipmentId', 'name category pricing')
      .populate('createdBy', 'name email');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental not found'
      });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ 'items.reference': rentalId });
    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        message: 'Invoice already exists for this rental',
        data: existingInvoice
      });
    }

    // Calculate rental duration
    const rentalDate = new Date(rental.rentalDate);
    const returnDate = new Date(rental.returnDate);
    const durationDays = Math.ceil((returnDate - rentalDate) / (1000 * 60 * 60 * 24)) || 1;

    // Create invoice items from rental equipment
    const items = rental.equipment.map(item => {
      const equipmentName = item.equipmentId?.name || 'Unknown Equipment';
      return {
        type: 'additional',
        description: `Equipment Rental: ${equipmentName} (${durationDays} days)`,
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        amount: item.totalAmount || (item.quantity * item.rate * durationDays)
      };
    });

    // Add main rental item
    items.unshift({
      type: 'booking',
      reference: rentalId,
      description: `Equipment Rental: ${rental.purpose} - ${rentalDate.toLocaleDateString()} to ${returnDate.toLocaleDateString()}`,
      quantity: 1,
      rate: rental.pricing?.subtotal || 0,
      amount: rental.pricing?.subtotal || 0
    });

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create invoice data
    const invoiceData = {
      invoiceNumber,
      client: rental.client._id,
      clientDetails: {
        name: rental.client?.name || rental.contactPerson?.name,
        email: rental.client?.email || rental.contactPerson?.email,
        phone: rental.contactPerson?.phone,
        company: rental.client?.company
      },
      type: 'equipment_rental',
      items,
      subtotal: rental.pricing?.subtotal || 0,
      discount: rental.pricing?.discount || 0,
      tax: 0,
      taxAmount: 0,
      total: rental.pricing?.totalAmount || 0,
      status: 'draft',
      dueDate,
      notes: `Invoice for equipment rental: ${rental.purpose}${rental.notes ? `\n\nRental Notes: ${rental.notes}` : ''}`,
      createdBy: req.user._id
    };

    const invoice = await Invoice.create(invoiceData);

    // Update rental with invoice reference
    rental.invoice = invoice._id;
    await rental.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('client', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Rental invoice created successfully',
      data: populatedInvoice
    });

  } catch (error) {
    console.error('Error creating rental invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rental invoice',
      error: error.message
    });
  }
};
// @desc    Print invoice (view PDF in browser)
// @route   GET /api/v1/invoices/:id/print
// @access  Private
exports.printInvoice = async (req, res) => {
  try {
    const { generateInvoicePDF } = require('../services/pdfService');
    
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone company')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'client' && invoice.client?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Set response headers for PDF viewing (not download)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error printing invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to print invoice',
      error: error.message
    });
  }
};

// @desc    Send invoice to customer via WhatsApp
// @route   POST /api/v1/invoices/:id/send
// @access  Private
exports.sendInvoiceToCustomer = async (req, res) => {
  try {
    const { sendInvoiceDocument } = require('../services/whatsappService');
    const { generateInvoicePDF } = require('../services/pdfService');
    
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone company')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get phone number from client or clientDetails
    const phoneNumber = invoice.client?.phone || invoice.clientDetails?.phone;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number available for customer'
      });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Create WhatsApp message
    const customerName = invoice.client?.name || invoice.clientDetails?.name || 'Valued Customer';
    const message = `💰 *D4 Media - Invoice ${invoice.invoiceNumber}*

Hello ${customerName},

Your invoice has been generated and is ready for payment.

*Invoice Details:*
• Invoice #: ${invoice.invoiceNumber}
• Amount: ₹${invoice.total.toLocaleString()}
• Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}
• Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}

*Payment Methods:*
💳 Bank Transfer
📱 UPI Payment
💵 Cash Payment

Please find the invoice PDF attached.

For payment assistance or queries, contact us immediately.

*D4 Media Team*
📞 +91-XXXXXXXXXX`;

    // Send via WhatsApp using DXing API with attachment
    const result = await sendInvoiceDocument(phoneNumber, invoice.invoiceNumber, pdfBuffer);

    // Update invoice status to sent if it was draft
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      await invoice.save();
    }

    res.json({
      success: true,
      message: 'Invoice sent to customer successfully via WhatsApp',
      data: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        recipientPhone: phoneNumber,
        messageId: result.messageId || result.data?.message_id,
        status: invoice.status
      }
    });

  } catch (error) {
    console.error('Error sending invoice via WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice to customer',
      error: error.message
    });
  }
};