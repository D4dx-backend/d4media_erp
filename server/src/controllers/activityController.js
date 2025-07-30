const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const AuditTrail = require('../models/AuditTrail');
const User = require('../models/User');

/**
 * @desc    Get user activity history
 * @route   GET /api/v1/activities/user/:userId?
 * @access  Private (Admin or own activities)
 */
exports.getUserActivities = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const {
      page = 1,
      limit = 50,
      action,
      resource,
      startDate,
      endDate,
      success
    } = req.query;

    // Check permissions - users can only view their own activities unless admin
    if (userId !== req.user._id.toString() && !['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    const query = { user: userId };
    
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (success !== undefined) query.success = success === 'true';
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [activities, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      ActivityLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: activities,
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
    console.error('Error fetching user activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activities',
      error: error.message
    });
  }
};

/**
 * @desc    Get all system activities (Admin only)
 * @route   GET /api/v1/activities/system
 * @access  Private (Admin only)
 */
exports.getSystemActivities = async (req, res) => {
  try {
    // Check admin permissions
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin only'
      });
    }

    const {
      page = 1,
      limit = 100,
      action,
      resource,
      user,
      startDate,
      endDate,
      success
    } = req.query;

    // Build query
    const query = {};
    
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (user) query.user = user;
    if (success !== undefined) query.success = success === 'true';
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [activities, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email role department')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      ActivityLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: activities,
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
    console.error('Error fetching system activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system activities',
      error: error.message
    });
  }
};

/**
 * @desc    Get activity statistics
 * @route   GET /api/v1/activities/stats
 * @access  Private (Admin only)
 */
exports.getActivityStats = async (req, res) => {
  try {
    // Check admin permissions
    if (!['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { startDate, endDate, userId } = req.query;
    
    // Build match query
    const matchQuery = {};
    if (userId) matchQuery.user = new mongoose.Types.ObjectId(userId);
    
    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }

    // Get activity statistics
    const [actionStats, resourceStats, userStats, dailyStats] = await Promise.all([
      // Actions breakdown
      ActivityLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: ['$success', 1, 0] }
            },
            failureCount: {
              $sum: { $cond: ['$success', 0, 1] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Resources breakdown
      ActivityLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$resource',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            _id: 1,
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Most active users
      ActivityLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$user',
            count: { $sum: 1 },
            lastActivity: { $max: '$timestamp' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            count: 1,
            lastActivity: 1,
            user: { $arrayElemAt: ['$user', 0] }
          }
        }
      ]),

      // Daily activity trend (last 30 days)
      ActivityLog.aggregate([
        {
          $match: {
            ...matchQuery,
            timestamp: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            date: '$_id',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { date: 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        actionStats,
        resourceStats,
        userStats,
        dailyStats
      }
    });

  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get audit trail for document
 * @route   GET /api/v1/activities/audit/:documentType/:documentId
 * @access  Private
 */
exports.getDocumentAuditTrail = async (req, res) => {
  try {
    const { documentType, documentId } = req.params;

    if (!['invoice', 'quotation'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    const auditTrail = await AuditTrail.getDocumentAuditTrail(documentType, documentId);

    res.json({
      success: true,
      data: auditTrail
    });

  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit trail',
      error: error.message
    });
  }
};

/**
 * @desc    Get user audit activities
 * @route   GET /api/v1/activities/audit/user/:userId?
 * @access  Private
 */
exports.getUserAuditActivities = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { limit = 100 } = req.query;

    // Check permissions
    if (userId !== req.user._id.toString() && !['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const auditActivities = await AuditTrail.getUserAuditActivities(userId, parseInt(limit));

    res.json({
      success: true,
      data: auditActivities
    });

  } catch (error) {
    console.error('Error fetching user audit activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user audit activities',
      error: error.message
    });
  }
};

/**
 * @desc    Get audit statistics
 * @route   GET /api/v1/activities/audit/stats
 * @access  Private (Admin only)
 */
exports.getAuditStats = async (req, res) => {
  try {
    // Check admin permissions
    if (!['super_admin', 'department_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { startDate, endDate } = req.query;

    const auditStats = await AuditTrail.getAuditStats(startDate, endDate);

    res.json({
      success: true,
      data: auditStats
    });

  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get login history
 * @route   GET /api/v1/activities/login-history
 * @access  Private (Admin only)
 */
exports.getLoginHistory = async (req, res) => {
  try {
    // Check admin permissions
    if (!['super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin only'
      });
    }

    const {
      page = 1,
      limit = 50,
      userId,
      startDate,
      endDate,
      success
    } = req.query;

    // Build query for login activities
    const query = {
      action: { $in: ['login', 'logout'] }
    };
    
    if (userId) query.user = userId;
    if (success !== undefined) query.success = success === 'true';
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [loginHistory, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email role department')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      ActivityLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: loginHistory,
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
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history',
      error: error.message
    });
  }
};