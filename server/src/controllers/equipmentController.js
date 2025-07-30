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
 * @desc    Record equipment in/out
 * @route   POST /api/v1/equipment/:id/inout
 * @access  Private (Department Head/Reception/Admin)
 */
exports.recordInOut = async (req, res) => {
  try {
    // Check permissions - Department heads, reception, and admins can record in/out
    if (!['super_admin', 'department_admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Department Head, Reception, or Admin only'
      });
    }

    const { id } = req.params;
    const { type, quantity, purpose, location, project, expectedReturnDate, condition, notes } = req.body;

    if (!['in', 'out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "in" or "out"'
      });
    }

    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Validate quantity for 'out' operations
    if (type === 'out' && quantity > equipment.actualAvailableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${equipment.actualAvailableQuantity} units available for checkout`
      });
    }

    const inOutData = {
      type,
      recordedBy: req.user._id,
      quantity: parseInt(quantity),
      purpose,
      location,
      project,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      condition: condition || 'good',
      notes
    };

    await equipment.recordInOut(inOutData);
    await equipment.populate('inOutHistory.recordedBy', 'name email');

    res.json({
      success: true,
      data: equipment,
      message: `Equipment ${type === 'out' ? 'checked out' : 'returned'} successfully`
    });

  } catch (error) {
    console.error('Error recording equipment in/out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record equipment in/out',
      error: error.message
    });
  }
};

/**
 * @desc    Get equipment in/out history
 * @route   GET /api/v1/equipment/:id/inout-history
 * @access  Private
 */
exports.getInOutHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const equipment = await Equipment.findById(id)
      .populate('inOutHistory.recordedBy', 'name email')
      .select('name inOutHistory');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Sort history by date (newest first)
    const sortedHistory = equipment.inOutHistory.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const paginatedHistory = sortedHistory.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: {
        equipment: { name: equipment.name, _id: equipment._id },
        history: paginatedHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: sortedHistory.length,
          totalPages: Math.ceil(sortedHistory.length / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching in/out history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch in/out history',
      error: error.message
    });
  }
};

/**
 * @desc    Add maintenance record
 * @route   POST /api/v1/equipment/:id/maintenance
 * @access  Private (Department Head/Admin only)
 */
exports.addMaintenanceRecord = async (req, res) => {
  try {
    // Check permissions - Department heads and admins can add maintenance records
    if (!['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Department Head or Admin only'
      });
    }

    const { id } = req.params;
    const { type, description, cost, nextMaintenanceDate, status, notes } = req.body;

    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    const maintenanceData = {
      type,
      description,
      performedBy: req.user._id,
      cost: parseFloat(cost) || 0,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      status: status || 'completed',
      notes
    };

    await equipment.addMaintenanceRecord(maintenanceData);
    await equipment.populate('maintenanceHistory.performedBy', 'name email');

    res.json({
      success: true,
      data: equipment,
      message: 'Maintenance record added successfully'
    });

  } catch (error) {
    console.error('Error adding maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add maintenance record',
      error: error.message
    });
  }
};

/**
 * @desc    Get equipment maintenance history
 * @route   GET /api/v1/equipment/:id/maintenance-history
 * @access  Private
 */
exports.getMaintenanceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const equipment = await Equipment.findById(id)
      .populate('maintenanceHistory.performedBy', 'name email')
      .select('name maintenanceHistory lastMaintenanceDate nextMaintenanceDate maintenanceStatus');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Sort history by date (newest first)
    const sortedHistory = equipment.maintenanceHistory.sort((a, b) => new Date(b.performedDate) - new Date(a.performedDate));

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const paginatedHistory = sortedHistory.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: {
        equipment: { 
          name: equipment.name, 
          _id: equipment._id,
          lastMaintenanceDate: equipment.lastMaintenanceDate,
          nextMaintenanceDate: equipment.nextMaintenanceDate,
          maintenanceStatus: equipment.maintenanceStatus
        },
        history: paginatedHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: sortedHistory.length,
          totalPages: Math.ceil(sortedHistory.length / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance history',
      error: error.message
    });
  }
};

/**
 * @desc    Get maintenance report
 * @route   GET /api/v1/equipment/maintenance-report
 * @access  Private
 */
exports.getMaintenanceReport = async (req, res) => {
  try {
    const { startDate, endDate, status, type } = req.query;

    // Build query for equipment needing maintenance
    const equipmentQuery = { isActive: true };
    
    const [
      equipmentNeedingMaintenance,
      recentMaintenance,
      maintenanceStats
    ] = await Promise.all([
      // Equipment needing maintenance
      Equipment.find({
        ...equipmentQuery,
        maintenanceStatus: { $in: ['due_soon', 'overdue'] }
      })
      .populate('department', 'name')
      .sort({ nextMaintenanceDate: 1 }),

      // Recent maintenance activities
      Equipment.aggregate([
        { $match: equipmentQuery },
        { $unwind: '$maintenanceHistory' },
        {
          $match: {
            ...(startDate && { 'maintenanceHistory.performedDate': { $gte: new Date(startDate) } }),
            ...(endDate && { 'maintenanceHistory.performedDate': { $lte: new Date(endDate) } }),
            ...(status && { 'maintenanceHistory.status': status }),
            ...(type && { 'maintenanceHistory.type': type })
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'maintenanceHistory.performedBy',
            foreignField: '_id',
            as: 'performedBy'
          }
        },
        {
          $project: {
            name: 1,
            category: 1,
            maintenance: '$maintenanceHistory',
            performedBy: { $arrayElemAt: ['$performedBy', 0] }
          }
        },
        { $sort: { 'maintenance.performedDate': -1 } },
        { $limit: 100 }
      ]),

      // Maintenance statistics
      Equipment.aggregate([
        { $match: equipmentQuery },
        {
          $group: {
            _id: null,
            totalEquipment: { $sum: 1 },
            upToDate: {
              $sum: { $cond: [{ $eq: ['$maintenanceStatus', 'up_to_date'] }, 1, 0] }
            },
            dueSoon: {
              $sum: { $cond: [{ $eq: ['$maintenanceStatus', 'due_soon'] }, 1, 0] }
            },
            overdue: {
              $sum: { $cond: [{ $eq: ['$maintenanceStatus', 'overdue'] }, 1, 0] }
            },
            inMaintenance: {
              $sum: { $cond: [{ $eq: ['$maintenanceStatus', 'in_maintenance'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        needingMaintenance: equipmentNeedingMaintenance,
        recentMaintenance,
        statistics: maintenanceStats[0] || {
          totalEquipment: 0,
          upToDate: 0,
          dueSoon: 0,
          overdue: 0,
          inMaintenance: 0
        }
      }
    });

  } catch (error) {
    console.error('Error generating maintenance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate maintenance report',
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

/**
 * @desc    Create event-based equipment checkout
 * @route   POST /api/v1/equipment/event-checkout
 * @access  Private (Reception/Admin only)
 */
exports.createEventCheckout = async (req, res) => {
  try {
    // Check permissions
    if (!['super_admin', 'department_admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Reception or Admin only'
      });
    }

    const {
      eventName,
      eventType,
      responsiblePerson,
      contactNumber,
      eventDate,
      eventLocation,
      expectedReturnDate,
      items,
      notes
    } = req.body;

    // Validate required fields
    if (!eventName || !eventType || !responsiblePerson || !eventDate || !expectedReturnDate || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate equipment availability
    for (const item of items) {
      const equipment = await Equipment.findById(item.equipmentId);
      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `Equipment not found: ${item.equipmentId}`
        });
      }

      if (item.quantity > equipment.actualAvailableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity for ${equipment.name}. Available: ${equipment.actualAvailableQuantity}, Requested: ${item.quantity}`
        });
      }
    }

    // Create checkout record
    const checkoutData = {
      eventName,
      eventType,
      responsiblePerson,
      contactNumber,
      eventDate: new Date(eventDate),
      eventLocation,
      expectedReturnDate: new Date(expectedReturnDate),
      items: items.map(item => ({
        equipment: item.equipmentId,
        quantity: parseInt(item.quantity),
        notes: item.notes
      })),
      notes,
      checkedOutBy: req.user._id,
      status: 'checked_out'
    };

    // Create the checkout (assuming we have an EventCheckout model)
    const EventCheckout = require('../models/EventCheckout');
    const checkout = await EventCheckout.create(checkoutData);

    // Update equipment quantities
    for (const item of items) {
      const equipment = await Equipment.findById(item.equipmentId);
      equipment.currentQuantityOut = (equipment.currentQuantityOut || 0) + parseInt(item.quantity);
      equipment.actualAvailableQuantity = equipment.availableQuantity - equipment.currentQuantityOut;
      
      // Update checkout status
      if (equipment.actualAvailableQuantity === 0) {
        equipment.checkoutStatus = 'fully_checked_out';
      } else if (equipment.currentQuantityOut > 0) {
        equipment.checkoutStatus = 'partially_checked_out';
      }
      
      await equipment.save();
    }

    // Populate the checkout with equipment details
    await checkout.populate('items.equipment', 'name code category');
    await checkout.populate('checkedOutBy', 'name email');

    res.status(201).json({
      success: true,
      data: checkout,
      message: 'Event checkout created successfully'
    });

  } catch (error) {
    console.error('Error creating event checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event checkout',
      error: error.message
    });
  }
};

/**
 * @desc    Get all event checkouts
 * @route   GET /api/v1/equipment/event-checkout
 * @access  Private
 */
exports.getEventCheckouts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      eventType,
      search,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;
    
    if (search) {
      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { responsiblePerson: { $regex: search, $options: 'i' } },
        { eventLocation: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.eventDate = {};
      if (startDate) query.eventDate.$gte = new Date(startDate);
      if (endDate) query.eventDate.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const EventCheckout = require('../models/EventCheckout');
    const [checkouts, total] = await Promise.all([
      EventCheckout.find(query)
        .populate('items.equipment', 'name code category')
        .populate('checkedOutBy', 'name email')
        .populate('returnedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      EventCheckout.countDocuments(query)
    ]);

    // Add overdue status
    const checkoutsWithStatus = checkouts.map(checkout => {
      const checkoutObj = checkout.toObject();
      if (checkoutObj.status === 'checked_out' && new Date(checkoutObj.expectedReturnDate) < new Date()) {
        checkoutObj.status = 'overdue';
      }
      return checkoutObj;
    });

    res.json({
      success: true,
      data: checkoutsWithStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching event checkouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event checkouts',
      error: error.message
    });
  }
};

/**
 * @desc    Get single event checkout
 * @route   GET /api/v1/equipment/event-checkout/:id
 * @access  Private
 */
exports.getEventCheckout = async (req, res) => {
  try {
    const { id } = req.params;

    const EventCheckout = require('../models/EventCheckout');
    const checkout = await EventCheckout.findById(id)
      .populate('items.equipment', 'name code category')
      .populate('checkedOutBy', 'name email')
      .populate('returnedBy', 'name email');

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Event checkout not found'
      });
    }

    // Add overdue status
    const checkoutObj = checkout.toObject();
    if (checkoutObj.status === 'checked_out' && new Date(checkoutObj.expectedReturnDate) < new Date()) {
      checkoutObj.status = 'overdue';
    }

    res.json({
      success: true,
      data: checkoutObj
    });

  } catch (error) {
    console.error('Error fetching event checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event checkout',
      error: error.message
    });
  }
};

/**
 * @desc    Return event checkout
 * @route   PUT /api/v1/equipment/event-checkout/:id/return
 * @access  Private (Reception/Admin only)
 */
exports.returnEventCheckout = async (req, res) => {
  try {
    // Check permissions
    if (!['super_admin', 'department_admin', 'reception'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Reception or Admin only'
      });
    }

    const { id } = req.params;
    const { returnDate, condition, notes } = req.body;

    const EventCheckout = require('../models/EventCheckout');
    const checkout = await EventCheckout.findById(id)
      .populate('items.equipment');

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: 'Event checkout not found'
      });
    }

    if (checkout.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Equipment already returned'
      });
    }

    // Update checkout record
    checkout.status = 'returned';
    checkout.returnDate = returnDate ? new Date(returnDate) : new Date();
    checkout.returnCondition = condition || 'good';
    checkout.returnNotes = notes;
    checkout.returnedBy = req.user._id;

    await checkout.save();

    // Update equipment quantities
    for (const item of checkout.items) {
      const equipment = await Equipment.findById(item.equipment._id);
      equipment.currentQuantityOut = Math.max(0, (equipment.currentQuantityOut || 0) - item.quantity);
      equipment.actualAvailableQuantity = equipment.availableQuantity - equipment.currentQuantityOut;
      
      // Update checkout status
      if (equipment.currentQuantityOut === 0) {
        equipment.checkoutStatus = 'available';
      } else if (equipment.currentQuantityOut < equipment.availableQuantity) {
        equipment.checkoutStatus = 'partially_checked_out';
      }
      
      await equipment.save();
    }

    // Populate the updated checkout
    await checkout.populate('items.equipment', 'name code category');
    await checkout.populate('checkedOutBy', 'name email');
    await checkout.populate('returnedBy', 'name email');

    res.json({
      success: true,
      data: checkout,
      message: 'Equipment returned successfully'
    });

  } catch (error) {
    console.error('Error returning event checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return equipment',
      error: error.message
    });
  }
};

module.exports = exports;