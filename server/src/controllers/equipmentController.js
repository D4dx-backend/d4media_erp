const Equipment = require('../models/Equipment');
const EquipmentCheckout = require('../models/EquipmentCheckout');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const PDFDocument = require('pdfkit');

/**
 * @desc    Get all equipment
 * @route   GET /api/v1/equipment
 * @access  Private
 */
exports.getAllEquipment = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      status,
      department,
      search
    } = req.query;

    // Build query
    const query = { isActive: true };
    if (category) query.category = category;
    if (status) query.status = status;
    if (department) query.department = department;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [equipment, total] = await Promise.all([
      Equipment.find(query)
        .populate('department', 'name')
        .populate('assignedTo', 'name email')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
      Equipment.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: equipment,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: error.message
    });
  }
};

/**
 * @desc    Get single equipment
 * @route   GET /api/v1/equipment/:id
 * @access  Private
 */
exports.getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('department', 'name')
      .populate('assignedTo', 'name email');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    res.json({
      success: true,
      data: equipment
    });

  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: error.message
    });
  }
};

/**
 * @desc    Create new equipment
 * @route   POST /api/v1/equipment
 * @access  Private (Admin only)
 */
exports.createEquipment = async (req, res) => {
  try {
    // Check admin permissions
    if (!['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin only'
      });
    }

    const equipment = await Equipment.create({
      ...req.body,
      createdBy: req.user._id
    });

    await equipment.populate('department assignedTo');

    res.status(201).json({
      success: true,
      data: equipment,
      message: 'Equipment created successfully'
    });

  } catch (error) {
    console.error('Error creating equipment:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Equipment code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create equipment',
      error: error.message
    });
  }
};

/**
 * @desc    Update equipment
 * @route   PUT /api/v1/equipment/:id
 * @access  Private (Admin only)
 */
exports.updateEquipment = async (req, res) => {
  try {
    // Check admin permissions
    if (!['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin only'
      });
    }

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department assignedTo');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    res.json({
      success: true,
      data: equipment,
      message: 'Equipment updated successfully'
    });

  } catch (error) {
    console.error('Error updating equipment:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Equipment code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update equipment',
      error: error.message
    });
  }
};

/**
 * @desc    Delete equipment
 * @route   DELETE /api/v1/equipment/:id
 * @access  Private (Admin only)
 */
exports.deleteEquipment = async (req, res) => {
  try {
    // Check admin permissions
    if (!['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin only'
      });
    }

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Check if equipment is currently checked out
    if (equipment.status === 'checked_out') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete equipment that is currently checked out'
      });
    }

    // Soft delete by setting isActive to false
    equipment.isActive = false;
    await equipment.save();

    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment',
      error: error.message
    });
  }
};

/**
 * @desc    Request equipment checkout (multiple items)
 * @route   POST /api/v1/equipment/checkout/request
 * @access  Private
 */
exports.requestCheckout = async (req, res) => {
  try {
    const {
      equipmentIds,
      expectedReturnDate,
      purpose,
      location,
      notes
    } = req.body;

    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one equipment must be selected'
      });
    }

    // Validate all equipment exists and is available
    const equipmentRequests = req.body.equipmentRequests || equipmentIds.map(id => ({ equipmentId: id, quantity: 1 }));
    const equipmentIds_extracted = equipmentRequests.map(req => req.equipmentId);
    
    const equipment = await Equipment.find({ _id: { $in: equipmentIds_extracted } });
    
    if (equipment.length !== equipmentIds_extracted.length) {
      return res.status(404).json({
        success: false,
        message: 'Some equipment items not found'
      });
    }

    // Check availability for each equipment with requested quantity
    const unavailableEquipment = [];
    for (const equipmentReq of equipmentRequests) {
      const equipmentItem = equipment.find(e => e._id.toString() === equipmentReq.equipmentId);
      if (!equipmentItem.isAvailableForCheckout() || equipmentItem.availableQuantity < equipmentReq.quantity) {
        unavailableEquipment.push(`${equipmentItem.name} (requested: ${equipmentReq.quantity}, available: ${equipmentItem.availableQuantity})`);
      }
    }
    
    if (unavailableEquipment.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Equipment not available: ${unavailableEquipment.join(', ')}`
      });
    }

    // Create equipment array for checkout
    const equipmentArray = equipmentRequests.map(req => {
      const equipmentItem = equipment.find(e => e._id.toString() === req.equipmentId);
      return {
        equipmentId: req.equipmentId,
        quantity: req.quantity,
        condition: {
          checkoutCondition: 'good'
        },
        notes: {
          checkoutNotes: ''
        }
      };
    });

    // Create checkout request
    const checkout = await EquipmentCheckout.create({
      equipment: equipmentArray,
      user: req.user._id,
      department: req.user.department,
      expectedReturnDate: new Date(expectedReturnDate),
      purpose,
      location,
      notes: { requestNotes: notes },
      status: 'pending_approval'
    });

    await checkout.populate('equipment.equipmentId user department');

    // Send WhatsApp notification to reception/admin
    try {
      const equipmentList = equipment.map(e => `• ${e.name} (Qty: ${equipmentRequests.find(req => req.equipmentId === e._id.toString())?.quantity || 1})`).join('\n');
      const message = `🔧 Equipment Checkout Request\n\n` +
        `Equipment (${equipment.length} items):\n${equipmentList}\n\n` +
        `Requested by: ${req.user.name}\n` +
        `Department: ${req.user.department?.name || 'N/A'}\n` +
        `Purpose: ${purpose}\n` +
        `Expected Return: ${new Date(expectedReturnDate).toLocaleDateString()}\n\n` +
        `Please approve or reject this request.`;

      // Send to reception (you can configure this phone number)
      if (process.env.RECEPTION_WHATSAPP) {
        await sendWhatsAppMessage(process.env.RECEPTION_WHATSAPP, message);
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
    }

    res.status(201).json({
      success: true,
      data: checkout,
      message: 'Checkout request submitted successfully'
    });

  } catch (error) {
    console.error('Error requesting checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit checkout request',
      error: error.message
    });
  }
};

/**
 * @desc    Approve/Reject checkout request
 * @route   PUT /api/v1/equipment/checkout/:id/approve
 * @access  Private (Reception/Admin only)
 */
exports.approveCheckout = async (req, res) => {
  try {
    // Check permissions
    if (!['super_admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Reception/Admin only'
      });
    }

    const { id } = req.params;
    const { approved, notes } = req.body;

    const checkout = await EquipmentCheckout.findById(id)
      .populate('equipment.equipmentId user department');

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Checkout request not found'
      });
    }

    if (checkout.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Checkout request is not pending approval'
      });
    }

    if (approved) {
      // Approve and mark as checked out
      checkout.status = 'checked_out';
      checkout.approvedBy = req.user._id;
      checkout.approvedAt = new Date();
      checkout.checkedOutBy = req.user._id;
      checkout.checkedOutAt = new Date();
      checkout.notes.approvalNotes = notes;

      // Update all equipment status and reduce available quantity
      for (const equipmentItem of checkout.equipment) {
        await Equipment.findByIdAndUpdate(equipmentItem.equipmentId._id, {
          $inc: { availableQuantity: -equipmentItem.quantity },
          checkoutStatus: 'checked_out',
          assignedTo: checkout.user._id
        });
      }

      // Send approval notification
      try {
        const equipmentList = checkout.equipment.map(e => `• ${e.equipmentId.name} (Qty: ${e.quantity})`).join('\n');
        const message = `✅ Equipment Checkout Approved\n\n` +
          `Equipment (${checkout.equipment.length} items):\n${equipmentList}\n\n` +
          `Approved by: ${req.user.name}\n` +
          `Expected Return: ${checkout.expectedReturnDate.toLocaleDateString()}\n\n` +
          `Please collect the equipment from reception.`;

        if (checkout.user.phone) {
          await sendWhatsAppMessage(checkout.user.phone, message);
        }
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError);
      }

    } else {
      // Reject
      checkout.status = 'cancelled';
      checkout.approvedBy = req.user._id;
      checkout.approvedAt = new Date();
      checkout.notes.approvalNotes = notes;

      // Send rejection notification
      try {
        const equipmentList = checkout.equipment.map(e => `• ${e.equipmentId.name} (Qty: ${e.quantity})`).join('\n');
        const message = `❌ Equipment Checkout Rejected\n\n` +
          `Equipment (${checkout.equipment.length} items):\n${equipmentList}\n\n` +
          `Rejected by: ${req.user.name}\n` +
          `Reason: ${notes || 'No reason provided'}\n\n` +
          `Please contact reception for more information.`;

        if (checkout.user.phone) {
          await sendWhatsAppMessage(checkout.user.phone, message);
        }
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError);
      }
    }

    await checkout.save();

    res.json({
      success: true,
      data: checkout,
      message: `Checkout request ${approved ? 'approved' : 'rejected'} successfully`
    });

  } catch (error) {
    console.error('Error approving checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process checkout approval',
      error: error.message
    });
  }
};

/**
 * @desc    Return equipment (multiple items)
 * @route   PUT /api/v1/equipment/checkout/:id/return
 * @access  Private (Reception/Admin only)
 */
exports.returnEquipment = async (req, res) => {
  try {
    // Check permissions
    if (!['super_admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Reception/Admin only'
      });
    }

    const { id } = req.params;
    const { equipmentReturns, notes } = req.body; // equipmentReturns: [{ equipmentId, condition, notes }]

    const checkout = await EquipmentCheckout.findById(id)
      .populate('equipment.equipmentId user department');

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Checkout record not found'
      });
    }

    if (!['checked_out', 'overdue'].includes(checkout.status)) {
      return res.status(400).json({
        success: false,
        message: 'Equipment is not checked out'
      });
    }

    // Update checkout record
    checkout.status = 'returned';
    checkout.actualReturnDate = new Date();
    checkout.returnedBy = req.user._id;
    checkout.returnedAt = new Date();
    checkout.notes.returnNotes = notes;

    // Update individual equipment conditions and notes
    if (equipmentReturns && Array.isArray(equipmentReturns)) {
      checkout.equipment.forEach(equipmentItem => {
        const returnInfo = equipmentReturns.find(r => r.equipmentId === equipmentItem.equipmentId._id.toString());
        if (returnInfo) {
          equipmentItem.condition.returnCondition = returnInfo.condition;
          equipmentItem.notes.returnNotes = returnInfo.notes || '';
        }
      });
    }

    // Update all equipment status and restore available quantity
    const equipmentUpdates = checkout.equipment.map(async (equipmentItem) => {
      const returnInfo = equipmentReturns?.find(r => r.equipmentId === equipmentItem.equipmentId._id.toString());
      const condition = returnInfo?.condition || 'good';
      
      const equipmentUpdate = {
        $inc: { availableQuantity: equipmentItem.quantity },
        checkoutStatus: condition === 'damaged' ? 'damaged' : 'available',
        assignedTo: null
      };

      if (condition === 'damaged') {
        equipmentUpdate.condition = 'damaged';
      }

      return Equipment.findByIdAndUpdate(equipmentItem.equipmentId._id, equipmentUpdate);
    });

    await Promise.all(equipmentUpdates);
    await checkout.save();

    // Send return confirmation
    try {
      const equipmentList = checkout.equipment.map(e => `• ${e.equipmentId.name} (Qty: ${e.quantity})`).join('\n');
      const message = `📦 Equipment Returned\n\n` +
        `Equipment (${checkout.equipment.length} items):\n${equipmentList}\n\n` +
        `Returned by: ${checkout.user.name}\n` +
        `Duration: ${checkout.duration} days\n\n` +
        `Thank you for returning the equipment.`;

      if (checkout.user.phone) {
        await sendWhatsAppMessage(checkout.user.phone, message);
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
    }

    res.json({
      success: true,
      data: checkout,
      message: 'Equipment returned successfully'
    });

  } catch (error) {
    console.error('Error returning equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return equipment',
      error: error.message
    });
  }
};

/**
 * @desc    Get checkout history
 * @route   GET /api/v1/equipment/checkout/history
 * @access  Private
 */
exports.getCheckoutHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      user,
      equipment,
      department,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (user) query.user = user;
    if (equipment) query.equipment = equipment;
    if (department) query.department = department;

    if (startDate || endDate) {
      query.checkoutDate = {};
      if (startDate) query.checkoutDate.$gte = new Date(startDate);
      if (endDate) query.checkoutDate.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [checkouts, total] = await Promise.all([
      EquipmentCheckout.find(query)
        .populate('equipment.equipmentId', 'name code category')
        .populate('user', 'name email')
        .populate('department', 'name')
        .populate('approvedBy', 'name')
        .populate('checkedOutBy', 'name')
        .populate('returnedBy', 'name')
        .sort({ checkoutDate: -1 })
        .skip(skip)
        .limit(limitNum),
      EquipmentCheckout.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: checkouts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching checkout history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch checkout history',
      error: error.message
    });
  }
};

/**
 * @desc    Get pending approvals
 * @route   GET /api/v1/equipment/checkout/pending
 * @access  Private (Reception/Admin only)
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    // Check permissions
    if (!['super_admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Reception/Admin only'
      });
    }

    const pendingCheckouts = await EquipmentCheckout.getPendingApprovals();

    res.json({
      success: true,
      data: pendingCheckouts
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message
    });
  }
};

/**
 * @desc    Generate equipment list PDF
 * @route   GET /api/v1/equipment/report/pdf
 * @access  Private
 */
exports.generateEquipmentListPDF = async (req, res) => {
  try {
    const { status, category, department } = req.query;

    // Build query
    const query = { isActive: true };
    if (status) query.status = status;
    if (category) query.category = category;
    if (department) query.department = department;

    const equipment = await Equipment.find(query)
      .populate('department', 'name')
      .populate('assignedTo', 'name')
      .sort({ category: 1, name: 1 });

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="equipment-list.pdf"');
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20).text('D4 Media - Equipment List', { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Add table headers
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Code', col1, tableTop);
    doc.text('Name', col2, tableTop);
    doc.text('Category', col3, tableTop);
    doc.text('Status', col4, tableTop);
    doc.text('Assigned To', col5, tableTop);

    // Add line under headers
    doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Add equipment data
    let currentY = tableTop + 25;
    doc.font('Helvetica');

    equipment.forEach((item) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc.text(item.code, col1, currentY);
      doc.text(item.name, col2, currentY);
      doc.text(item.category, col3, currentY);
      doc.text(item.status, col4, currentY);
      doc.text(item.assignedTo?.name || '-', col5, currentY);

      currentY += 20;
    });

    // Add footer
    doc.fontSize(8).text(`Total Equipment: ${equipment.length}`, 50, doc.page.height - 50);

    doc.end();

  } catch (error) {
    console.error('Error generating equipment PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate equipment list PDF',
      error: error.message
    });
  }
};

/**
 * @desc    Send equipment list via WhatsApp
 * @route   POST /api/v1/equipment/report/whatsapp
 * @access  Private (Admin only)
 */
exports.sendEquipmentListWhatsApp = async (req, res) => {
  try {
    // Check admin permissions
    if (!['super_admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin only'
      });
    }

    const { phoneNumber, status, category } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Build query
    const query = { isActive: true };
    if (status) query.status = status;
    if (category) query.category = category;

    const equipment = await Equipment.find(query)
      .populate('assignedTo', 'name')
      .sort({ category: 1, name: 1 });

    // Create message
    let message = `📋 D4 Media Equipment List\n`;
    message += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    // Group by category
    const groupedEquipment = equipment.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    Object.keys(groupedEquipment).forEach(category => {
      message += `🔧 ${category.toUpperCase()}\n`;
      groupedEquipment[category].forEach(item => {
        const assignedText = item.assignedTo ? ` (${item.assignedTo.name})` : '';
        message += `• ${item.code} - ${item.name} [${item.status}]${assignedText}\n`;
      });
      message += '\n';
    });

    message += `Total Equipment: ${equipment.length}`;

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(phoneNumber, message);

    res.json({
      success: true,
      data: result,
      message: 'Equipment list sent via WhatsApp successfully'
    });

  } catch (error) {
    console.error('Error sending equipment list via WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send equipment list via WhatsApp',
      error: error.message
    });
  }
};

module.exports = exports;