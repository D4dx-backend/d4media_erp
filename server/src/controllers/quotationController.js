const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const { generateQuotationNumber } = require('../utils/numberGenerator');
const { generateQuotationPDF: generatePDF } = require('../services/pdfService');
const { sendQuotationDocument } = require('../services/whatsappService');

/**
 * @desc    Get all quotations with filtering and pagination
 * @route   GET /api/v1/quotations
 * @access  Private
 */
exports.getQuotations = async (req, res) => {
  try {
    const {
      status,
      client,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by client
    if (client) {
      query.$or = [
        { client: client },
        { 'clientDetails.name': { $regex: client, $options: 'i' } },
        { 'clientDetails.email': { $regex: client, $options: 'i' } }
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .populate('client', 'name email phone')
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Quotation.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      count: quotations.length,
      total,
      data: quotations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quotations',
      error: error.message
    });
  }
};

/**
 * @desc    Get single quotation by ID
 * @route   GET /api/v1/quotations/:id
 * @access  Private
 */
exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('client', 'name email phone address')
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quotation',
      error: error.message
    });
  }
};

/**
 * @desc    Create new quotation
 * @route   POST /api/v1/quotations
 * @access  Private (Admin/Reception)
 */
exports.createQuotation = async (req, res) => {
  try {
    const quotationData = {
      ...req.body,
      quotationNumber: await generateQuotationNumber(),
      createdBy: req.user._id
    };

    const quotation = await Quotation.create(quotationData);

    res.status(201).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create quotation',
      error: error.message
    });
  }
};

/**
 * @desc    Update quotation
 * @route   PUT /api/v1/quotations/:id
 * @access  Private (Admin/Reception)
 */
exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error updating quotation:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update quotation',
      error: error.message
    });
  }
};

/**
 * @desc    Update quotation status
 * @route   PUT /api/v1/quotations/:id/status
 * @access  Private (Admin/Reception)
 */
exports.updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error updating quotation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quotation status',
      error: error.message
    });
  }
};

/**
 * @desc    Convert quotation to invoice
 * @route   POST /api/v1/quotations/:id/convert-to-invoice
 * @access  Private (Admin/Reception)
 */
exports.convertToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only accepted quotations can be converted to invoices'
      });
    }

    // Create invoice from quotation
    const invoiceData = {
      type: 'quotation_conversion',
      client: quotation.client,
      clientDetails: quotation.clientDetails,
      items: quotation.items,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      taxAmount: quotation.taxAmount,
      total: quotation.total,
      notes: quotation.notes,
      terms: quotation.terms,
      quotationId: quotation._id,
      createdBy: req.user._id
    };

    const invoice = await Invoice.create(invoiceData);

    // Update quotation status to converted
    quotation.status = 'converted';
    quotation.convertedToInvoice = invoice._id;
    await quotation.save();

    res.status(201).json({
      success: true,
      message: 'Quotation converted to invoice successfully',
      data: {
        invoice,
        quotation,
        invoiceId: invoice._id
      }
    });
  } catch (error) {
    console.error('Error converting quotation to invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert quotation to invoice',
      error: error.message
    });
  }
};

/**
 * @desc    Generate PDF quotation
 * @route   GET /api/v1/quotations/:id/pdf
 * @access  Private
 */
exports.generateQuotationPDF = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('client', 'name email phone address')
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const pdfBuffer = await generatePDF(quotation);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

/**
 * @desc    Send quotation to customer via WhatsApp
 * @route   POST /api/v1/quotations/:id/send
 * @access  Private (Admin/Reception)
 */
exports.sendQuotationToCustomer = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('client', 'name email phone');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const phoneNumber = quotation.client?.phone || quotation.clientDetails?.phone;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number available for customer'
      });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(quotation);

    // Send via WhatsApp
    const message = `Hello ${quotation.clientDetails?.name || quotation.client?.name},\n\nPlease find your quotation ${quotation.quotationNumber} attached.\n\nTotal Amount: ₹${quotation.total.toLocaleString()}\nValid Until: ${new Date(quotation.validUntil).toLocaleDateString()}\n\nThank you for choosing D4 Media!`;

    await sendQuotationDocument(phoneNumber, quotation.quotationNumber, pdfBuffer);

    // Update quotation status to sent if it was draft
    if (quotation.status === 'draft') {
      quotation.status = 'sent';
      await quotation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Quotation sent to customer successfully'
    });
  } catch (error) {
    console.error('Error sending quotation to customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send quotation to customer',
      error: error.message
    });
  }
};

/**
 * @desc    Delete quotation
 * @route   DELETE /api/v1/quotations/:id
 * @access  Private (Admin only)
 */
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check if quotation has been converted to invoice
    if (quotation.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete quotation that has been converted to invoice'
      });
    }

    await quotation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quotation',
      error: error.message
    });
  }
};

/**
 * @desc    Get client quotations (for client portal)
 * @route   GET /api/v1/quotations/client/my-quotations
 * @access  Private (Client only)
 */
exports.getClientQuotations = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const query = { client: req.user._id };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Quotation.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: quotations.length,
      total,
      data: quotations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching client quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quotations',
      error: error.message
    });
  }
};

/**
 * @desc    Get quotation statistics
 * @route   GET /api/v1/quotations/stats/summary
 * @access  Private (Admin only)
 */
exports.getQuotationStats = async (req, res) => {
  try {
    const stats = await Quotation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    const totalQuotations = await Quotation.countDocuments();
    const totalValue = await Quotation.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalQuotations,
        totalValue: totalValue[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Error fetching quotation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quotation statistics',
      error: error.message
    });
  }
};
/**
 * 
@desc    Print quotation (view PDF in browser)
 * @route   GET /api/v1/quotations/:id/print
 * @access  Private
 */
exports.printQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('client', 'name email phone address')
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const pdfBuffer = await generatePDF(quotation);

    // Set response headers for PDF viewing (not download)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quotation-${quotation.quotationNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error printing quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to print quotation',
      error: error.message
    });
  }
};