const User = require('../models/User');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { logSecurityEvent, SECURITY_EVENTS } = require('../utils/logger');
const whatsappService = require('../services/whatsappService');

// @desc    Get all users with search and filtering
// @route   GET /api/v1/users
// @access  Private (Super Admin only)
const getUsers = async (req, res, next) => {
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
      role,
      department,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Role filter
    if (role && role.trim() !== '') {
      // Check if it's a comma-separated list of roles
      if (role.includes(',')) {
        const roles = role.split(',');
        query.role = { $in: roles };
      } else {
        query.role = role;
      }
    }

    // Department filter
    if (department && department.trim() !== '') {
      query.department = department;
    }

    // Active status filter
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // Search functionality
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(query)
      .populate('department', 'name code')
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-refreshToken');

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private (Super Admin only)
const getUser = async (req, res, next) => {
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

    const user = await User.findById(req.params.id)
      .populate('department', 'name code description')
      .select('-refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private (Super Admin only)
const createUser = async (req, res, next) => {
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
      email,
      password,
      role,
      department,
      phone,
      company,
      address,
      notifications
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Validate department if role requires it
    if (['department_admin', 'department_staff'].includes(role)) {
      if (!department) {
        return res.status(400).json({
          success: false,
          error: 'Department is required for department roles'
        });
      }

      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid department specified'
        });
      }
    }

    // Create user data
    const userData = {
      name,
      email,
      password,
      role,
      phone,
      company,
      address,
      notifications
    };

    // Add department if provided
    if (department) {
      userData.department = department;
    }

    const user = await User.create(userData);

    // Populate department info for response
    await user.populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Super Admin only)
const updateUser = async (req, res, next) => {
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

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }

    // Validate department if role is being changed or department is being updated
    if (updateData.role || updateData.department) {
      const newRole = updateData.role || user.role;
      const newDepartment = updateData.department;

      if (['department_admin', 'department_staff'].includes(newRole)) {
        if (!newDepartment && !user.department) {
          return res.status(400).json({
            success: false,
            error: 'Department is required for department roles'
          });
        }

        if (newDepartment) {
          const departmentExists = await Department.findById(newDepartment);
          if (!departmentExists) {
            return res.status(400).json({
              success: false,
              error: 'Invalid department specified'
            });
          }
        }
      } else {
        // Remove department for non-department roles
        updateData.department = null;
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('department', 'name code');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (soft delete by deactivating)
// @route   DELETE /api/v1/users/:id
// @access  Private (Super Admin only)
const deleteUser = async (req, res, next) => {
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

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent deleting super admin if it's the last one
    if (user.role === 'super_admin') {
      const superAdminCount = await User.countDocuments({ 
        role: 'super_admin', 
        isActive: true 
      });
      
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last active super admin'
        });
      }
    }

    // Soft delete by deactivating
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Activate/Deactivate user
// @route   PATCH /api/v1/users/:id/status
// @access  Private (Super Admin only)
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean value'
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent deactivating super admin if it's the last one
    if (user.role === 'super_admin' && !isActive) {
      const superAdminCount = await User.countDocuments({ 
        role: 'super_admin', 
        isActive: true 
      });
      
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate the last active super admin'
        });
      }
    }

    // Update status
    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get users by department
// @route   GET /api/v1/users/department/:id
// @access  Private (Department Admin or Super Admin)
const getDepartmentUsers = async (req, res, next) => {
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

    const { id: departmentId } = req.params;
    const {
      page = 1,
      limit = 10,
      role,
      isActive
    } = req.query;

    // Check if department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Build query
    const query = { department: departmentId };

    // Role filter (only department roles)
    if (role && role.trim() !== '') {
      query.role = role;
    }

    // Active status filter
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(query)
      .populate('department', 'name code')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-refreshToken');

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: users,
      department: {
        id: department._id,
        name: department.name,
        code: department.code
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('department', 'name code description')
      .select('-refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
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

    const updateData = req.body;
    
    // Remove fields that users shouldn't be able to update themselves
    delete updateData.role;
    delete updateData.department;
    delete updateData.isActive;
    delete updateData.email; // Email changes should go through a separate verification process

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('department', 'name code description');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update current user password
// @route   PUT /api/v1/users/profile/password
// @access  Private
const updatePassword = async (req, res, next) => {
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change
    logSecurityEvent(SECURITY_EVENTS.PASSWORD_CHANGE, {
      userId: user._id,
      userEmail: user.email,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reset user password (Super Admin only)
// @route   PUT /api/v1/users/:id/reset-password
// @access  Private (Super Admin only)
const resetUserPassword = async (req, res, next) => {
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
    const { newPassword } = req.body;

    // Find user and admin
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password reset
    logSecurityEvent(SECURITY_EVENTS.PASSWORD_RESET, {
      targetUserId: user._id,
      targetUserEmail: user.email,
      adminUserId: req.user.id,
      adminUserEmail: req.user.email,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Send WhatsApp notification if user has phone number
    let whatsappStatus = null;
    if (user.phone) {
      try {
        await whatsappService.sendPasswordResetNotification(
          user.phone,
          user.name,
          newPassword,
          admin.name
        );
        whatsappStatus = 'sent';
        console.log(`WhatsApp notification sent to ${user.phone} for password reset`);
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp notification:', whatsappError.message);
        whatsappStatus = 'failed';
        // Don't fail the entire operation if WhatsApp fails
      }
    } else {
      whatsappStatus = 'no_phone';
      console.log(`No phone number available for user ${user.email}, skipping WhatsApp notification`);
    }

    res.json({
      success: true,
      message: 'User password reset successfully',
      whatsappNotification: {
        status: whatsappStatus,
        message: whatsappStatus === 'sent' 
          ? 'Password sent via WhatsApp' 
          : whatsappStatus === 'failed'
          ? 'Failed to send WhatsApp notification'
          : 'No phone number available for WhatsApp notification'
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Test WhatsApp service (Super Admin only)
// @route   POST /api/v1/users/test-whatsapp
// @access  Private (Super Admin only)
const testWhatsApp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }

    // Log the test attempt
    logSecurityEvent(SECURITY_EVENTS.ADMIN_ACTION, {
      adminUserId: req.user.id,
      adminUserEmail: req.user.email,
      action: 'WHATSAPP_SERVICE_TEST',
      targetPhoneNumber: phoneNumber,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    try {
      const result = await whatsappService.testService(phoneNumber);
      
      res.json({
        success: true,
        message: 'WhatsApp test completed',
        data: result,
        configuration: {
          serviceConfigured: !!(process.env.WHATSAPP_ACCOUNT_ID && process.env.WHATSAPP_SECRET_KEY),
          accountId: process.env.WHATSAPP_ACCOUNT_ID ? 
            process.env.WHATSAPP_ACCOUNT_ID.substring(0, 10) + '...' : 'Not configured',
          apiUrl: 'https://app.dxing.in/api/send/whatsapp'
        }
      });
    } catch (whatsappError) {
      res.status(500).json({
        success: false,
        error: 'WhatsApp service test failed',
        details: whatsappError.message,
        configuration: {
          serviceConfigured: !!(process.env.WHATSAPP_ACCOUNT_ID && process.env.WHATSAPP_SECRET_KEY),
          accountId: process.env.WHATSAPP_ACCOUNT_ID ? 
            process.env.WHATSAPP_ACCOUNT_ID.substring(0, 10) + '...' : 'Not configured',
          apiUrl: 'https://app.dxing.in/api/send/whatsapp'
        }
      });
    }

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getDepartmentUsers,
  getProfile,
  updateProfile,
  updatePassword,
  resetUserPassword,
  testWhatsApp
};