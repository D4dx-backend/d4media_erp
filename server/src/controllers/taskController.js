const Task = require('../models/Task');
const User = require('../models/User');
const Department = require('../models/Department');
const notificationService = require('../services/notificationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/tasks');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // For text files, check both extension and mimetype
  if (path.extname(file.originalname).toLowerCase() === '.txt') {
    return cb(null, true);
  }
  
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// @desc    Get all tasks with filtering and pagination
// @route   GET /api/v1/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      department,
      assignedTo,
      client,
      taskType,
      overdue,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = {};

    // Department access control
    if (req.user.role === 'department_admin' || req.user.role === 'department_staff') {
      query.department = req.user.department._id;
    } else if (req.user.role === 'client') {
      query.client = req.user._id;
    } else if (department) {
      query.department = department;
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (client) query.client = client;
    if (taskType) query.taskType = taskType;

    // Handle overdue filter
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['completed', 'cancelled'] };
    }

    // Handle search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const tasks = await Task.find(query)
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('client', 'name email company')
      .populate('progress.notes.addedBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching tasks',
      details: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('department', 'name')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('client', 'name email company')
      .populate('progress.notes.addedBy', 'name')
      .populate('attachments.uploadedBy', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching task',
      details: error.message
    });
  }
};

// @desc    Create new task
// @route   POST /api/v1/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      assignedTo,
      client,
      priority,
      taskType,
      estimatedHours,
      dueDate,
      departmentSpecific,
      tags,
      billing
    } = req.body;

    // Validate required fields
    if (!title || !description || !department || !taskType || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, department, taskType, dueDate'
      });
    }

    // Verify department exists
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Verify assigned user exists and belongs to department (if provided)
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          error: 'Assigned user not found'
        });
      }
      
      // Check if user belongs to the department (unless super admin)
      if (req.user.role !== 'super_admin' && 
          assignedUser.department && 
          assignedUser.department.toString() !== department) {
        return res.status(400).json({
          success: false,
          error: 'Assigned user does not belong to the specified department'
        });
      }
    }

    // Verify client exists (if provided)
    if (client) {
      const clientUser = await User.findById(client);
      if (!clientUser || clientUser.role !== 'client') {
        return res.status(404).json({
          success: false,
          error: 'Client not found or invalid client user'
        });
      }
    }

    // Create task
    const task = new Task({
      title,
      description,
      department,
      assignedTo,
      createdBy: req.user._id,
      client,
      priority: priority || 'medium',
      taskType,
      estimatedHours: estimatedHours || 1,
      dueDate: new Date(dueDate),
      departmentSpecific: departmentSpecific || {},
      tags: tags || [],
      billing: {
        rate: billing?.rate || 0,
        billable: billing?.billable !== undefined ? billing.billable : true,
        invoiced: false
      }
    });

    await task.save();

    // Populate the created task
    const populatedTask = await Task.findById(task._id)
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('client', 'name email company');

    // Send assignment notification if task is assigned
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (assignedUser) {
        await notificationService.sendTaskAssignmentNotification(populatedTask, assignedUser);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while creating task',
      details: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const {
      title,
      description,
      assignedTo,
      client,
      priority,
      status,
      estimatedHours,
      actualHours,
      dueDate,
      departmentSpecific,
      tags,
      billing,
      isUrgent
    } = req.body;

    // Verify assigned user exists and belongs to department (if provided)
    if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          error: 'Assigned user not found'
        });
      }
      
      // Check if user belongs to the department (unless super admin)
      if (req.user.role !== 'super_admin' && 
          assignedUser.department && 
          assignedUser.department.toString() !== task.department.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Assigned user does not belong to the task department'
        });
      }
    }

    // Verify client exists (if provided)
    if (client && client !== task.client?.toString()) {
      const clientUser = await User.findById(client);
      if (!clientUser || clientUser.role !== 'client') {
        return res.status(404).json({
          success: false,
          error: 'Client not found or invalid client user'
        });
      }
    }

    // Store original status for notification
    const originalStatus = task.status;
    
    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (client !== undefined) task.client = client;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) {
      task._statusChangedBy = req.user._id;
      task.status = status;
    }
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);
    if (departmentSpecific !== undefined) task.departmentSpecific = departmentSpecific;
    if (tags !== undefined) task.tags = tags;
    if (isUrgent !== undefined) task.isUrgent = isUrgent;

    // Update billing information
    if (billing) {
      if (billing.rate !== undefined) task.billing.rate = billing.rate;
      if (billing.billable !== undefined) task.billing.billable = billing.billable;
      if (billing.invoiced !== undefined) task.billing.invoiced = billing.invoiced;
      if (billing.invoiceId !== undefined) task.billing.invoiceId = billing.invoiceId;
    }

    await task.save();

    // Send status change notification if status was updated
    if (status !== undefined && originalStatus !== status) {
      await notificationService.sendTaskStatusChangeNotification(task, originalStatus, req.user);
    }

    // Populate the updated task
    const populatedTask = await Task.findById(task._id)
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('client', 'name email company')
      .populate('progress.notes.addedBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while updating task',
      details: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Delete associated files
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '../../uploads/tasks', attachment.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting task',
      details: error.message
    });
  }
};

// @desc    Assign task to user
// @route   PUT /api/v1/tasks/:id/assign
// @access  Private
const assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: 'assignedTo field is required'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Verify assigned user exists and belongs to department
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        error: 'Assigned user not found'
      });
    }

    // Check if user belongs to the department (unless super admin)
    if (req.user.role !== 'super_admin' && 
        assignedUser.department && 
        assignedUser.department.toString() !== task.department.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Assigned user does not belong to the task department'
      });
    }

    task.assignedTo = assignedTo;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('client', 'name email company');

    res.status(200).json({
      success: true,
      data: populatedTask,
      message: 'Task assigned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while assigning task',
      details: error.message
    });
  }
};

// @desc    Update task progress
// @route   PUT /api/v1/tasks/:id/progress
// @access  Private
const updateProgress = async (req, res) => {
  try {
    const { percentage, note } = req.body;
    
    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress percentage must be between 0 and 100'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Update progress percentage
    task.progress.percentage = percentage;

    // Add progress note if provided
    if (note) {
      task.progress.notes.push({
        note,
        addedBy: req.user._id,
        addedAt: new Date()
      });
    }

    // Auto-update status based on progress
    if (percentage === 0 && task.status === 'pending') {
      // Keep as pending
    } else if (percentage > 0 && percentage < 75 && task.status === 'pending') {
      task.status = 'in_progress';
      task.startDate = task.startDate || new Date();
    } else if (percentage >= 75 && percentage < 100 && task.status !== 'completed') {
      task.status = 'review';
    } else if (percentage === 100) {
      task.status = 'completed';
      task.completedDate = new Date();
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('client', 'name email company')
      .populate('progress.notes.addedBy', 'name');

    // Send progress update notification
    await notificationService.sendProgressUpdateNotification(populatedTask, note, req.user);

    res.status(200).json({
      success: true,
      data: populatedTask,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating progress',
      details: error.message
    });
  }
};

// @desc    Add progress note
// @route   POST /api/v1/tasks/:id/notes
// @access  Private
const addProgressNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    if (!note || note.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    task.progress.notes.push({
      note: note.trim(),
      addedBy: req.user._id,
      addedAt: new Date()
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('progress.notes.addedBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedTask.progress.notes,
      message: 'Note added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while adding note',
      details: error.message
    });
  }
};

// @desc    Upload file attachment
// @route   POST /api/v1/tasks/:id/attachments
// @access  Private
const uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.attachments.push(attachment);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('attachments.uploadedBy', 'name');

    res.status(200).json({
      success: true,
      data: populatedTask.attachments,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Server error while uploading file',
      details: error.message
    });
  }
};

// @desc    Delete file attachment
// @route   DELETE /api/v1/tasks/:id/attachments/:attachmentId
// @access  Private
const deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads/tasks', attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove attachment from task
    task.attachments.pull(req.params.attachmentId);
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting attachment',
      details: error.message
    });
  }
};

// @desc    Get tasks by department
// @route   GET /api/v1/tasks/department/:departmentId
// @access  Private
const getTasksByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { status, assignedTo } = req.query;

    const options = {};
    if (status) options.status = status;
    if (assignedTo) options.assignedTo = assignedTo;

    const tasks = await Task.getByDepartment(departmentId, options);

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching department tasks',
      details: error.message
    });
  }
};

// @desc    Get overdue tasks
// @route   GET /api/v1/tasks/overdue
// @access  Private
const getOverdueTasks = async (req, res) => {
  try {
    const query = {
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    };

    // Department access control
    if (req.user.role === 'department_admin' || req.user.role === 'department_staff') {
      query.department = req.user.department._id;
    } else if (req.user.role === 'client') {
      query.client = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('client', 'name email company')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching overdue tasks',
      details: error.message
    });
  }
};

// @desc    Start time tracking for a task
// @route   POST /api/v1/tasks/:id/time/start
// @access  Private
const startTimeTracking = async (req, res) => {
  try {
    const { description } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user already has an active time entry for this task
    const activeEntry = task.timeEntries && task.timeEntries.find(
      entry => entry.user.toString() === req.user._id.toString() && entry.isActive
    );

    if (activeEntry) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active time entry for this task'
      });
    }

    // Create new time entry
    const timeEntry = {
      user: req.user._id,
      startTime: new Date(),
      description: description || '',
      isActive: true
    };

    // Initialize timeEntries array if it doesn't exist
    if (!task.timeEntries) {
      task.timeEntries = [];
    }

    task.timeEntries.push(timeEntry);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('timeEntries.user', 'name email');

    res.status(200).json({
      success: true,
      data: populatedTask.timeEntries[populatedTask.timeEntries.length - 1],
      message: 'Time tracking started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while starting time tracking',
      details: error.message
    });
  }
};

// @desc    Stop time tracking for a task
// @route   PUT /api/v1/tasks/:id/time/stop
// @access  Private
const stopTimeTracking = async (req, res) => {
  try {
    const { description } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Find active time entry for this user
    const activeEntry = task.timeEntries && task.timeEntries.find(
      entry => entry.user.toString() === req.user._id.toString() && entry.isActive
    );

    if (!activeEntry) {
      return res.status(400).json({
        success: false,
        error: 'No active time entry found for this task'
      });
    }

    // Stop the time entry
    activeEntry.isActive = false;
    activeEntry.endTime = new Date();
    activeEntry.duration = Math.round((activeEntry.endTime - activeEntry.startTime) / (1000 * 60));
    
    if (description) {
      activeEntry.description = description;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('timeEntries.user', 'name email');

    res.status(200).json({
      success: true,
      data: activeEntry,
      message: 'Time tracking stopped successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while stopping time tracking',
      details: error.message
    });
  }
};

// @desc    Add manual time entry
// @route   POST /api/v1/tasks/:id/time/manual
// @access  Private
const addManualTimeEntry = async (req, res) => {
  try {
    const { startTime, endTime, duration, description } = req.body;
    
    if (!startTime || (!endTime && !duration)) {
      return res.status(400).json({
        success: false,
        error: 'Start time and either end time or duration are required'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const start = new Date(startTime);
    let end, calculatedDuration;

    if (endTime) {
      end = new Date(endTime);
      calculatedDuration = Math.round((end - start) / (1000 * 60));
    } else {
      calculatedDuration = duration;
      end = new Date(start.getTime() + (duration * 60 * 1000));
    }

    if (calculatedDuration <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be greater than 0'
      });
    }

    const timeEntry = {
      user: req.user._id,
      startTime: start,
      endTime: end,
      duration: calculatedDuration,
      description: description || '',
      isActive: false
    };

    // Initialize timeEntries array if it doesn't exist
    if (!task.timeEntries) {
      task.timeEntries = [];
    }

    task.timeEntries.push(timeEntry);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('timeEntries.user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedTask.timeEntries[populatedTask.timeEntries.length - 1],
      message: 'Time entry added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while adding time entry',
      details: error.message
    });
  }
};

// @desc    Get time entries for a task
// @route   GET /api/v1/tasks/:id/time
// @access  Private
const getTimeEntries = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('timeEntries.user', 'name email')
      .select('timeEntries actualHours estimatedHours');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Calculate total time by user
    const timeByUser = {};
    if (task.timeEntries && task.timeEntries.length > 0) {
      task.timeEntries.forEach(entry => {
        const userId = entry.user._id.toString();
        if (!timeByUser[userId]) {
          timeByUser[userId] = {
            user: entry.user,
            totalMinutes: 0,
            totalHours: 0,
            entries: []
          };
        }
        timeByUser[userId].totalMinutes += entry.duration || 0;
        timeByUser[userId].totalHours = Math.round((timeByUser[userId].totalMinutes / 60) * 100) / 100;
        timeByUser[userId].entries.push(entry);
      });
    }

    res.status(200).json({
      success: true,
      data: {
        timeEntries: task.timeEntries || [],
        timeByUser: Object.values(timeByUser),
        summary: {
          totalActualHours: task.actualHours,
          estimatedHours: task.estimatedHours,
          remainingHours: Math.max(0, task.estimatedHours - task.actualHours)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching time entries',
      details: error.message
    });
  }
};

// @desc    Update time entry
// @route   PUT /api/v1/tasks/:id/time/:entryId
// @access  Private
const updateTimeEntry = async (req, res) => {
  try {
    const { startTime, endTime, duration, description } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    if (!task.timeEntries) {
      return res.status(404).json({
        success: false,
        error: 'No time entries found for this task'
      });
    }

    const timeEntry = task.timeEntries.id(req.params.entryId);
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
    }

    // Check if user owns this time entry or has admin permissions
    const isAdmin = ['super_admin', 'department_admin'].includes(req.user.role);
    const isOwner = timeEntry.user.toString() === req.user._id.toString();
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own time entries'
      });
    }

    // Update fields
    if (startTime) timeEntry.startTime = new Date(startTime);
    if (endTime) timeEntry.endTime = new Date(endTime);
    if (description !== undefined) timeEntry.description = description;

    // Recalculate duration if start/end times changed
    if (startTime || endTime || duration) {
      if (duration) {
        timeEntry.duration = duration;
        if (startTime && !endTime) {
          timeEntry.endTime = new Date(timeEntry.startTime.getTime() + (duration * 60 * 1000));
        }
      } else if (timeEntry.startTime && timeEntry.endTime) {
        timeEntry.duration = Math.round((timeEntry.endTime - timeEntry.startTime) / (1000 * 60));
      }
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('timeEntries.user', 'name email');

    const updatedEntry = populatedTask.timeEntries.id(req.params.entryId);

    res.status(200).json({
      success: true,
      data: updatedEntry,
      message: 'Time entry updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating time entry',
      details: error.message
    });
  }
};

// @desc    Delete time entry
// @route   DELETE /api/v1/tasks/:id/time/:entryId
// @access  Private
const deleteTimeEntry = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    if (!task.timeEntries) {
      return res.status(404).json({
        success: false,
        error: 'No time entries found for this task'
      });
    }

    const timeEntry = task.timeEntries.id(req.params.entryId);
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        error: 'Time entry not found'
      });
    }

    // Check if user owns this time entry or has admin permissions
    if (timeEntry.user.toString() !== req.user._id.toString() && 
        !['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own time entries'
      });
    }

    task.timeEntries.pull(req.params.entryId);
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting time entry',
      details: error.message
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateProgress,
  addProgressNote,
  uploadAttachment: [upload.single('file'), uploadAttachment],
  deleteAttachment,
  getTasksByDepartment,
  getOverdueTasks,
  startTimeTracking,
  stopTimeTracking,
  addManualTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry
};