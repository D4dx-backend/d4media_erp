const Task = require('../models/Task');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const StudioBooking = require('../models/StudioBooking');
const notificationService = require('../services/notificationService');
const path = require('path');
const fs = require('fs');

// @desc    Get client dashboard data
// @route   GET /api/v1/client/dashboard
// @access  Private (Client only)
const getClientDashboard = async (req, res) => {
  try {
    const clientId = req.user._id;

    // Get active tasks for the client
    const activeTasks = await Task.find({
      client: clientId,
      status: { $nin: ['completed', 'cancelled'] }
    })
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .limit(5);

    // Get recently completed tasks
    const completedTasks = await Task.find({
      client: clientId,
      status: 'completed'
    })
      .populate('department', 'name')
      .sort({ completedDate: -1 })
      .limit(5);

    // Get upcoming studio bookings
    const upcomingBookings = await StudioBooking.find({
      client: clientId,
      bookingDate: { $gte: new Date() },
      status: { $nin: ['cancelled'] }
    })
      .sort({ bookingDate: 1 })
      .limit(3);

    // Get recent invoices
    const recentInvoices = await Invoice.find({
      client: clientId
    })
      .sort({ createdAt: -1 })
      .limit(3);

    // Get task statistics
    const taskStats = {
      total: await Task.countDocuments({ client: clientId }),
      active: await Task.countDocuments({ 
        client: clientId,
        status: { $nin: ['completed', 'cancelled'] }
      }),
      completed: await Task.countDocuments({ 
        client: clientId,
        status: 'completed'
      }),
      overdue: await Task.countDocuments({
        client: clientId,
        dueDate: { $lt: new Date() },
        status: { $nin: ['completed', 'cancelled'] }
      })
    };

    // Get invoice statistics
    const invoiceStats = {
      total: await Invoice.countDocuments({ client: clientId }),
      paid: await Invoice.countDocuments({ 
        client: clientId,
        status: 'paid'
      }),
      pending: await Invoice.countDocuments({ 
        client: clientId,
        status: { $in: ['draft', 'sent', 'overdue'] }
      }),
      totalAmount: await Invoice.aggregate([
        { $match: { client: clientId } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]).then(result => result.length > 0 ? result[0].total : 0)
    };

    res.status(200).json({
      success: true,
      data: {
        activeTasks,
        completedTasks,
        upcomingBookings,
        recentInvoices,
        taskStats,
        invoiceStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching client dashboard data',
      details: error.message
    });
  }
};

// @desc    Get client projects (grouped tasks)
// @route   GET /api/v1/client/projects
// @access  Private (Client only)
const getClientProjects = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { status, department, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;

    // Build query object
    const query = { client: clientId };

    // Apply filters
    if (status) query.status = status;
    if (department) query.department = department;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get all tasks for the client
    const tasks = await Task.find(query)
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort(sort);

    // Group tasks by department (project)
    const projects = {};
    tasks.forEach(task => {
      const departmentId = task.department._id.toString();
      const departmentName = task.department.name;
      
      if (!projects[departmentId]) {
        projects[departmentId] = {
          departmentId,
          departmentName,
          tasks: [],
          progress: 0,
          totalTasks: 0,
          completedTasks: 0
        };
      }
      
      projects[departmentId].tasks.push(task);
      projects[departmentId].totalTasks++;
      
      if (task.status === 'completed') {
        projects[departmentId].completedTasks++;
      }
    });

    // Calculate progress for each project
    Object.values(projects).forEach(project => {
      project.progress = project.totalTasks > 0 
        ? Math.round((project.completedTasks / project.totalTasks) * 100) 
        : 0;
    });

    res.status(200).json({
      success: true,
      data: Object.values(projects)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching client projects',
      details: error.message
    });
  }
};

// @desc    Get client project details (tasks for a specific department)
// @route   GET /api/v1/client/projects/:departmentId
// @access  Private (Client only)
const getClientProjectDetails = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { departmentId } = req.params;

    // Get all tasks for the client in the specified department
    const tasks = await Task.find({
      client: clientId,
      department: departmentId
    })
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('progress.notes.addedBy', 'name')
      .sort({ createdAt: -1 });

    // Calculate project statistics
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      overdueTasks: tasks.filter(task => 
        task.dueDate < new Date() && 
        !['completed', 'cancelled'].includes(task.status)
      ).length,
      progress: tasks.length > 0 
        ? Math.round((tasks.filter(task => task.status === 'completed').length / tasks.length) * 100) 
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        tasks,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching client project details',
      details: error.message
    });
  }
};

// @desc    Get client task details
// @route   GET /api/v1/client/tasks/:taskId
// @access  Private (Client only)
const getClientTaskDetails = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { taskId } = req.params;

    // Get task details
    const task = await Task.findOne({
      _id: taskId,
      client: clientId
    })
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('progress.notes.addedBy', 'name')
      .populate('attachments.uploadedBy', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or you do not have access to this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching client task details',
      details: error.message
    });
  }
};

// @desc    Download task attachment
// @route   GET /api/v1/client/tasks/:taskId/attachments/:attachmentId/download
// @access  Private (Client only)
const downloadTaskAttachment = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { taskId, attachmentId } = req.params;

    // Find the task and verify client access
    const task = await Task.findOne({
      _id: taskId,
      client: clientId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or you do not have access to this task'
      });
    }

    // Find the attachment
    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found'
      });
    }

    // Check if file exists
    const filePath = path.join(__dirname, '../../uploads/tasks', attachment.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }

    // Set content disposition and send file
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimetype);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while downloading attachment',
      details: error.message
    });
  }
};

// @desc    Add client feedback to task
// @route   POST /api/v1/client/tasks/:taskId/feedback
// @access  Private (Client only)
const addClientFeedback = async (req, res) => {
  try {
    const clientId = req.user._id;
    const { taskId } = req.params;
    const { feedback, approved } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback content is required'
      });
    }

    // Find the task and verify client access
    const task = await Task.findOne({
      _id: taskId,
      client: clientId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found or you do not have access to this task'
      });
    }

    // Add feedback as a progress note
    const feedbackPrefix = approved ? '✅ APPROVED: ' : '🔄 FEEDBACK: ';
    task.progress.notes.push({
      note: feedbackPrefix + feedback,
      addedBy: clientId,
      addedAt: new Date()
    });

    // If client is approving the task, update status if it's in review
    if (approved === true && task.status === 'review') {
      task.status = 'completed';
      task.completedDate = new Date();
      task.progress.percentage = 100;
    }

    await task.save();

    // Send notification to task assignee and creator
    const stakeholders = await notificationService.getTaskStakeholders(task);
    for (const user of stakeholders) {
      if (user._id.toString() !== clientId.toString()) {
        // This would be handled by the notification service in a real implementation
        console.log(`Notification would be sent to ${user.name} about client feedback`);
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('progress.notes.addedBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedTask,
      message: 'Feedback added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while adding feedback',
      details: error.message
    });
  }
};

// @desc    Get client communication history
// @route   GET /api/v1/client/communication
// @access  Private (Client only)
const getClientCommunication = async (req, res) => {
  try {
    const clientId = req.user._id;

    // Get all tasks for the client
    const tasks = await Task.find({
      client: clientId
    })
      .populate('department', 'name')
      .populate('progress.notes.addedBy', 'name email role')
      .select('title progress.notes department');

    // Extract all communication (progress notes)
    const communications = [];
    tasks.forEach(task => {
      task.progress.notes.forEach(note => {
        communications.push({
          taskId: task._id,
          taskTitle: task.title,
          department: task.department,
          note: note.note,
          addedBy: note.addedBy,
          addedAt: note.addedAt,
          isClientNote: note.addedBy && note.addedBy.role === 'client'
        });
      });
    });

    // Sort by date (newest first)
    communications.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    res.status(200).json({
      success: true,
      data: communications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching client communication',
      details: error.message
    });
  }
};

module.exports = {
  getClientDashboard,
  getClientProjects,
  getClientProjectDetails,
  getClientTaskDetails,
  downloadTaskAttachment,
  addClientFeedback,
  getClientCommunication
};