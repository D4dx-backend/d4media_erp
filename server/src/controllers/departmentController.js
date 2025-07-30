const Department = require('../models/Department');
const User = require('../models/User');
const Task = require('../models/Task');
const { validationResult } = require('express-validator');

// @desc    Get all departments with search and filtering
// @route   GET /api/v1/departments
// @access  Private (Super Admin, Department Admin, Reception)
const getDepartments = async (req, res, next) => {
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

    const {
      page = 1,
      limit = 10,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with population
    const departments = await Department.find(query)
      .populate('admin', 'name email')
      .populate('staffCount')
      .populate('activeTasksCount')
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Department.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: departments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalDepartments: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single department by ID
// @route   GET /api/v1/departments/:id
// @access  Private (Super Admin, Department Admin, Reception)
const getDepartment = async (req, res, next) => {
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

    const department = await Department.findById(req.params.id)
      .populate('admin', 'name email phone')
      .populate('staffCount')
      .populate('activeTasksCount');

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new department
// @route   POST /api/v1/departments
// @access  Private (Super Admin only)
const createDepartment = async (req, res, next) => {
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

    const {
      name,
      code,
      description,
      admin,
      settings,
      taskTypes
    } = req.body;

    // Check if department with same name or code already exists
    // Use a safer approach to avoid RegExp issues
    const existingDepartment = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } },
        { code: code.toUpperCase() }
      ]
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        error: 'Department with this name or code already exists'
      });
    }

    // Validate admin user if provided
    if (admin) {
      const adminUser = await User.findById(admin);
      if (!adminUser) {
        return res.status(400).json({
          success: false,
          error: 'Invalid admin user specified'
        });
      }

      // Check if user can be a department admin
      if (!['super_admin', 'department_admin'].includes(adminUser.role)) {
        return res.status(400).json({
          success: false,
          error: 'Selected user cannot be assigned as department admin'
        });
      }
    }

    // Create department data
    const departmentData = {
      name: name.trim(),
      code: code.toUpperCase(),
      description: description?.trim(),
      admin,
      settings: {
        defaultTaskPriority: settings?.defaultTaskPriority || 'medium',
        autoAssignment: settings?.autoAssignment || false,
        requireApproval: settings?.requireApproval || false
      },
      taskTypes: taskTypes || []
    };

    const department = await Department.create(departmentData);

    // Update admin user's role and department if admin is assigned
    if (admin) {
      await User.findByIdAndUpdate(admin, {
        role: 'department_admin',
        department: department._id
      });
    }

    // Populate admin info for response
    await department.populate('admin', 'name email');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });

  } catch (error) {
    console.error('Department creation error:', error);
    next(error);
  }
};

// @desc    Update department
// @route   PUT /api/v1/departments/:id
// @access  Private (Super Admin only)
const updateDepartment = async (req, res, next) => {
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

    const { id } = req.params;
    const updateData = req.body;

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Check if name or code is being changed and if it already exists
    if (updateData.name || updateData.code) {
      const query = { _id: { $ne: id } };
      const orConditions = [];

      if (updateData.name && updateData.name !== department.name) {
        orConditions.push({ 
          name: { 
            $regex: new RegExp('^' + updateData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') 
          } 
        });
      }

      if (updateData.code && updateData.code.toUpperCase() !== department.code) {
        orConditions.push({ code: updateData.code.toUpperCase() });
      }

      if (orConditions.length > 0) {
        query.$or = orConditions;
        const existingDepartment = await Department.findOne(query);
        if (existingDepartment) {
          return res.status(400).json({
            success: false,
            error: 'Department with this name or code already exists'
          });
        }
      }
    }

    // Validate admin user if being changed
    if (updateData.admin && updateData.admin !== department.admin?.toString()) {
      const adminUser = await User.findById(updateData.admin);
      if (!adminUser) {
        return res.status(400).json({
          success: false,
          error: 'Invalid admin user specified'
        });
      }

      // Check if user can be a department admin
      if (!['super_admin', 'department_admin'].includes(adminUser.role)) {
        return res.status(400).json({
          success: false,
          error: 'Selected user cannot be assigned as department admin'
        });
      }
    }

    // Prepare update data
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.code) updateData.code = updateData.code.toUpperCase();
    if (updateData.description) updateData.description = updateData.description.trim();

    // Update department
    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('admin', 'name email');

    // Update admin user's role and department if admin is changed
    if (updateData.admin) {
      // Remove previous admin's department assignment if exists
      if (department.admin) {
        await User.findByIdAndUpdate(department.admin, {
          department: null,
          role: 'department_staff' // Demote to staff
        });
      }

      // Assign new admin
      await User.findByIdAndUpdate(updateData.admin, {
        role: 'department_admin',
        department: updatedDepartment._id
      });
    }

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete department (soft delete by deactivating)
// @route   DELETE /api/v1/departments/:id
// @access  Private (Super Admin only)
const deleteDepartment = async (req, res, next) => {
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

    const { id } = req.params;

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Check for active tasks
    const activeTasksCount = await Task.countDocuments({
      department: id,
      status: { $in: ['pending', 'in_progress', 'review'] }
    });

    if (activeTasksCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${activeTasksCount} active tasks. Please complete or reassign tasks first.`,
        activeTasksCount
      });
    }

    // Check for assigned users
    const assignedUsersCount = await User.countDocuments({
      department: id,
      isActive: true
    });

    if (assignedUsersCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${assignedUsersCount} assigned users. Please reassign users first.`,
        assignedUsersCount
      });
    }

    // Soft delete by deactivating
    department.isActive = false;
    await department.save();

    res.json({
      success: true,
      message: 'Department deactivated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Toggle department status (activate/deactivate)
// @route   PATCH /api/v1/departments/:id/status
// @access  Private (Super Admin only)
const toggleDepartmentStatus = async (req, res, next) => {
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

    const { id } = req.params;
    const { isActive } = req.body;

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // If deactivating, check for active tasks and users
    if (!isActive) {
      const activeTasksCount = await Task.countDocuments({
        department: id,
        status: { $in: ['pending', 'in_progress', 'review'] }
      });

      if (activeTasksCount > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot deactivate department with ${activeTasksCount} active tasks. Please complete or reassign tasks first.`,
          activeTasksCount
        });
      }
    }

    // Update status
    department.isActive = isActive;
    await department.save();

    res.json({
      success: true,
      message: `Department ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: department._id,
        name: department.name,
        code: department.code,
        isActive: department.isActive
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get department task types
// @route   GET /api/v1/departments/:id/task-types
// @access  Private (Department Admin, Super Admin)
const getDepartmentTaskTypes = async (req, res, next) => {
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

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: {
        departmentId: department._id,
        departmentName: department.name,
        taskTypes: department.taskTypes
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update department task types
// @route   PUT /api/v1/departments/:id/task-types
// @access  Private (Department Admin, Super Admin)
const updateDepartmentTaskTypes = async (req, res, next) => {
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

    const { id } = req.params;
    const { taskTypes } = req.body;

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Validate task types array
    if (!Array.isArray(taskTypes)) {
      return res.status(400).json({
        success: false,
        error: 'Task types must be an array'
      });
    }

    // Update task types
    department.taskTypes = taskTypes;
    await department.save();

    res.json({
      success: true,
      message: 'Department task types updated successfully',
      data: {
        departmentId: department._id,
        departmentName: department.name,
        taskTypes: department.taskTypes
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
  getDepartmentTaskTypes,
  updateDepartmentTaskTypes
};