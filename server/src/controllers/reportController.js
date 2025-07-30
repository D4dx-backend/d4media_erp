const Task = require('../models/Task');

/**
 * Report controller with real data from database
 */

// Helper function to get daily report data
const getDailyReportData = async (queryParams) => {
  const { date, department, user, client } = queryParams;
  
  // Use provided date or default to today
  const reportDate = date ? new Date(date) : new Date();
  reportDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(reportDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Build query
  let query = {
    createdAt: { $gte: reportDate, $lt: nextDay }
  };

  // Add filters
  if (department) query.department = department;
  if (user) query.assignedTo = user;
  if (client) query.client = client;

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .populate('client', 'name email company');

  // Calculate detailed statistics
  const statistics = {
    total: tasks.length,
    byStatus: {
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in_progress').length,
      review: tasks.filter(task => task.status === 'review').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      cancelled: tasks.filter(task => task.status === 'cancelled').length
    },
    byPriority: {
      low: tasks.filter(task => task.priority === 'low').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      high: tasks.filter(task => task.priority === 'high').length,
      urgent: tasks.filter(task => task.priority === 'urgent').length
    },
    totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
    totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
  };

  return {
    date: reportDate,
    tasks,
    statistics,
    filters: { date, department, user, client }
  };
};

// Helper function to get weekly report data
const getWeeklyReportData = async (queryParams) => {
  const { startDate, endDate, department, user, client } = queryParams;
  
  // Use provided dates or default to last 7 days
  let weekStart, weekEnd;
  
  if (startDate && endDate) {
    weekStart = new Date(startDate);
    weekEnd = new Date(endDate);
  } else {
    weekEnd = new Date();
    weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
  }
  
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  // Build query
  let query = {
    createdAt: { $gte: weekStart, $lte: weekEnd }
  };

  // Add filters
  if (department) query.department = department;
  if (user) query.assignedTo = user;
  if (client) query.client = client;

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .populate('client', 'name email company');

  // Calculate detailed statistics
  const statistics = {
    total: tasks.length,
    byStatus: {
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in_progress').length,
      review: tasks.filter(task => task.status === 'review').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      cancelled: tasks.filter(task => task.status === 'cancelled').length
    },
    byPriority: {
      low: tasks.filter(task => task.priority === 'low').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      high: tasks.filter(task => task.priority === 'high').length,
      urgent: tasks.filter(task => task.priority === 'urgent').length
    },
    totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
    totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
  };

  return {
    startDate: weekStart,
    endDate: weekEnd,
    tasks,
    statistics,
    filters: { startDate, endDate, department, user, client }
  };
};

// Helper function to get monthly report data
const getMonthlyReportData = async (queryParams) => {
  const { month, year, department, user, client } = queryParams;
  
  // Use provided month/year or default to current month
  const reportYear = year ? parseInt(year) : new Date().getFullYear();
  const reportMonth = month ? parseInt(month) - 1 : new Date().getMonth(); // month is 0-indexed
  
  const startDate = new Date(reportYear, reportMonth, 1);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(reportYear, reportMonth + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  // Build query
  let query = {
    createdAt: { $gte: startDate, $lte: endDate }
  };

  // Add filters
  if (department) query.department = department;
  if (user) query.assignedTo = user;
  if (client) query.client = client;

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('department', 'name')
    .populate('client', 'name email company');

  // Calculate detailed statistics
  const statistics = {
    total: tasks.length,
    byStatus: {
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in_progress').length,
      review: tasks.filter(task => task.status === 'review').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      cancelled: tasks.filter(task => task.status === 'cancelled').length
    },
    byPriority: {
      low: tasks.filter(task => task.priority === 'low').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      high: tasks.filter(task => task.priority === 'high').length,
      urgent: tasks.filter(task => task.priority === 'urgent').length
    },
    totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
    totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
  };

  return {
    month: reportMonth + 1, // Convert back to 1-indexed
    year: reportYear,
    startDate,
    endDate,
    tasks,
    statistics,
    filters: { month, year, department, user, client }
  };
};

// @desc    Get daily report
// @route   GET /api/v1/reports/daily
// @access  Private
exports.getDailyReport = async (req, res) => {
  try {
    const { date, department, user, client } = req.query;
    console.log('Daily report request:', { date, department, user, client });
    
    // Use provided date or default to today
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log('Date range:', { reportDate, nextDay });

    // Build query
    let query = {
      createdAt: { $gte: reportDate, $lt: nextDay }
    };

    // Add filters
    if (department) query.department = department;
    if (user) query.assignedTo = user;
    if (client) query.client = client;

    console.log('Query:', query);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .populate('client', 'name email company');

    console.log('Found tasks:', tasks.length);

    // Calculate detailed statistics
    const statistics = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in_progress').length,
        review: tasks.filter(task => task.status === 'review').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        cancelled: tasks.filter(task => task.status === 'cancelled').length
      },
      byPriority: {
        low: tasks.filter(task => task.priority === 'low').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        high: tasks.filter(task => task.priority === 'high').length,
        urgent: tasks.filter(task => task.priority === 'urgent').length
      },
      totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        date: reportDate,
        tasks,
        statistics,
        filters: { date, department, user, client }
      }
    });
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily report',
      error: error.message
    });
  }
};

// @desc    Get weekly report
// @route   GET /api/v1/reports/weekly
// @access  Private
exports.getWeeklyReport = async (req, res) => {
  try {
    const { startDate, endDate, department, user, client } = req.query;
    
    // Use provided dates or default to last 7 days
    let weekStart, weekEnd;
    
    if (startDate && endDate) {
      weekStart = new Date(startDate);
      weekEnd = new Date(endDate);
    } else {
      weekEnd = new Date();
      weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
    }
    
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);

    // Build query
    let query = {
      createdAt: { $gte: weekStart, $lte: weekEnd }
    };

    // Add filters
    if (department) query.department = department;
    if (user) query.assignedTo = user;
    if (client) query.client = client;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .populate('client', 'name email company');

    // Calculate detailed statistics
    const statistics = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in_progress').length,
        review: tasks.filter(task => task.status === 'review').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        cancelled: tasks.filter(task => task.status === 'cancelled').length
      },
      byPriority: {
        low: tasks.filter(task => task.priority === 'low').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        high: tasks.filter(task => task.priority === 'high').length,
        urgent: tasks.filter(task => task.priority === 'urgent').length
      },
      totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        startDate: weekStart,
        endDate: weekEnd,
        tasks,
        statistics,
        filters: { startDate, endDate, department, user, client }
      }
    });
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly report',
      error: error.message
    });
  }
};

// @desc    Get monthly report
// @route   GET /api/v1/reports/monthly
// @access  Private
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year, department, user, client } = req.query;
    
    // Use provided month/year or default to current month
    const reportYear = year ? parseInt(year) : new Date().getFullYear();
    const reportMonth = month ? parseInt(month) - 1 : new Date().getMonth(); // month is 0-indexed
    
    const startDate = new Date(reportYear, reportMonth, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportYear, reportMonth + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    // Build query
    let query = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Add filters
    if (department) query.department = department;
    if (user) query.assignedTo = user;
    if (client) query.client = client;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .populate('client', 'name email company');

    // Calculate detailed statistics
    const statistics = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in_progress').length,
        review: tasks.filter(task => task.status === 'review').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        cancelled: tasks.filter(task => task.status === 'cancelled').length
      },
      byPriority: {
        low: tasks.filter(task => task.priority === 'low').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        high: tasks.filter(task => task.priority === 'high').length,
        urgent: tasks.filter(task => task.priority === 'urgent').length
      },
      totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        month: reportMonth + 1, // Convert back to 1-indexed
        year: reportYear,
        startDate,
        endDate,
        tasks,
        statistics,
        filters: { month, year, department, user, client }
      }
    });
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly report',
      error: error.message
    });
  }
};

// @desc    Get dashboard data
// @route   GET /api/v1/reports/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    console.log('Dashboard endpoint called!');
    const { departmentId } = req.query;
    console.log('Department filter:', departmentId);
    
    // Build query based on user role and department filter
    let query = {};
    if (departmentId) {
      query.department = departmentId;
    }

    // Get all tasks for calculations
    const allTasks = await Task.find(query);
    console.log('Found tasks:', allTasks.length);
    
    // Calculate status breakdown
    const statusBreakdown = {
      pending: allTasks.filter(task => task.status === 'pending').length,
      inProgress: allTasks.filter(task => task.status === 'in_progress').length,
      review: allTasks.filter(task => task.status === 'review').length,
      completed: allTasks.filter(task => task.status === 'completed').length,
      cancelled: allTasks.filter(task => task.status === 'cancelled').length
    };

    // Calculate priority breakdown
    const priorityBreakdown = {
      low: allTasks.filter(task => task.priority === 'low').length,
      medium: allTasks.filter(task => task.priority === 'medium').length,
      high: allTasks.filter(task => task.priority === 'high').length,
      urgent: allTasks.filter(task => task.priority === 'urgent').length
    };

    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = allTasks.filter(task => 
      task.dueDate < now && !['completed', 'cancelled'].includes(task.status)
    ).length;

    // Calculate tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasksDueToday = allTasks.filter(task => 
      task.dueDate >= today && 
      task.dueDate < tomorrow && 
      !['completed', 'cancelled'].includes(task.status)
    ).length;

    // Calculate average progress
    const activeTasks = allTasks.filter(task => !['completed', 'cancelled'].includes(task.status));
    const avgProgress = activeTasks.length > 0 
      ? activeTasks.reduce((sum, task) => sum + (task.progress?.percentage || 0), 0) / activeTasks.length
      : 0;

    const totalTasks = allTasks.length;
    const activeTasksCount = activeTasks.length;

    res.status(200).json({
      success: true,
      data: {
        statusBreakdown,
        priorityBreakdown,
        overdueTasks,
        tasksDueToday,
        avgProgress: Math.round(avgProgress * 10) / 10, // Round to 1 decimal place
        totalTasks,
        activeTasks: activeTasksCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
};

// @desc    Export report as PDF
// @route   GET /api/v1/reports/:type/export/pdf
// @access  Private
exports.exportReportPDF = async (req, res) => {
  try {
    const { type } = req.params;
    const { date, startDate, endDate, month, year, department, user, client } = req.query;
    
    console.log(`Generating PDF for ${type} report with params:`, req.query);
    
    // Get the report data based on type
    let reportData;
    let filename;
    
    switch (type) {
      case 'daily':
        reportData = await getDailyReportData(req.query);
        filename = `daily-report-${date || new Date().toISOString().split('T')[0]}.pdf`;
        break;
      case 'weekly':
        reportData = await getWeeklyReportData(req.query);
        filename = `weekly-report-${startDate || 'current'}.pdf`;
        break;
      case 'monthly':
        reportData = await getMonthlyReportData(req.query);
        filename = `monthly-report-${month || new Date().getMonth() + 1}-${year || new Date().getFullYear()}.pdf`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }
    
    // Generate PDF using a simple HTML-to-PDF approach
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    
    if (reportData.date) {
      doc.text(`Report Date: ${new Date(reportData.date).toLocaleDateString()}`, 50, 100);
    }
    
    // Add statistics
    if (reportData.statistics) {
      doc.fontSize(16).text('Summary Statistics', 50, 140);
      doc.fontSize(12);
      doc.text(`Total Tasks: ${reportData.statistics.total || 0}`, 50, 170);
      doc.text(`Completed: ${reportData.statistics.byStatus?.completed || 0}`, 50, 190);
      doc.text(`In Progress: ${reportData.statistics.byStatus?.inProgress || 0}`, 50, 210);
      doc.text(`Pending: ${reportData.statistics.byStatus?.pending || 0}`, 50, 230);
      doc.text(`Estimated Hours: ${(reportData.statistics.totalEstimatedHours || 0).toFixed(1)}`, 50, 250);
      doc.text(`Actual Hours: ${(reportData.statistics.totalActualHours || 0).toFixed(1)}`, 50, 270);
    }
    
    // Add tasks list
    if (reportData.tasks && reportData.tasks.length > 0) {
      doc.fontSize(16).text('Tasks', 50, 310);
      let yPosition = 340;
      
      reportData.tasks.slice(0, 10).forEach((task, index) => { // Limit to first 10 tasks
        doc.fontSize(10);
        doc.text(`${index + 1}. ${task.title}`, 50, yPosition);
        doc.text(`   Status: ${task.status} | Priority: ${task.priority}`, 50, yPosition + 15);
        doc.text(`   Department: ${task.department?.name || 'N/A'}`, 50, yPosition + 30);
        yPosition += 50;
        
        // Add new page if needed
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });
      
      if (reportData.tasks.length > 10) {
        doc.text(`... and ${reportData.tasks.length - 10} more tasks`, 50, yPosition + 20);
      }
    }
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF report',
      error: error.message
    });
  }
};

// @desc    Export report as CSV
// @route   GET /api/v1/reports/:type/export/csv
// @access  Private
exports.exportReportCSV = async (req, res) => {
  try {
    const { type } = req.params;
    const { date, startDate, endDate, month, year, department, user, client } = req.query;
    
    console.log(`Generating CSV for ${type} report with params:`, req.query);
    
    // Get the report data based on type
    let reportData;
    let filename;
    
    switch (type) {
      case 'daily':
        reportData = await getDailyReportData(req.query);
        filename = `daily-report-${date || new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'weekly':
        reportData = await getWeeklyReportData(req.query);
        filename = `weekly-report-${startDate || 'current'}.csv`;
        break;
      case 'monthly':
        reportData = await getMonthlyReportData(req.query);
        filename = `monthly-report-${month || new Date().getMonth() + 1}-${year || new Date().getFullYear()}.csv`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }
    
    // Prepare CSV data
    const csvData = [];
    
    // Add header row
    csvData.push([
      'Task ID',
      'Title',
      'Description',
      'Department',
      'Assigned To',
      'Client',
      'Status',
      'Priority',
      'Estimated Hours',
      'Actual Hours',
      'Due Date',
      'Created Date',
      'Progress %'
    ]);
    
    // Add task rows
    if (reportData.tasks && reportData.tasks.length > 0) {
      reportData.tasks.forEach(task => {
        csvData.push([
          task._id || '',
          task.title || '',
          task.description || '',
          task.department?.name || '',
          task.assignedTo?.name || '',
          task.client?.name || '',
          task.status || '',
          task.priority || '',
          task.estimatedHours || 0,
          task.actualHours || 0,
          task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
          task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '',
          task.progress?.percentage || 0
        ]);
      });
    }
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    ).join('\n');
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send CSV data
    res.send(csvString);
    
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating CSV report',
      error: error.message
    });
  }
};

// @desc    Get user-based report
// @route   GET /api/v1/reports/user
// @access  Private
exports.getUserReport = async (req, res) => {
  try {
    const { userId, startDate, endDate, department } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Set date range (default to last 30 days if not provided)
    let dateStart, dateEnd;
    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
    } else {
      dateEnd = new Date();
      dateStart = new Date();
      dateStart.setDate(dateStart.getDate() - 30);
    }
    
    dateStart.setHours(0, 0, 0, 0);
    dateEnd.setHours(23, 59, 59, 999);

    // Build query
    let query = {
      assignedTo: userId,
      createdAt: { $gte: dateStart, $lte: dateEnd }
    };

    if (department) query.department = department;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .populate('client', 'name email company');

    // Calculate user performance statistics
    const statistics = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in_progress').length,
        review: tasks.filter(task => task.status === 'review').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        cancelled: tasks.filter(task => task.status === 'cancelled').length
      },
      byPriority: {
        low: tasks.filter(task => task.priority === 'low').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        high: tasks.filter(task => task.priority === 'high').length,
        urgent: tasks.filter(task => task.priority === 'urgent').length
      },
      totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
      completionRate: tasks.length > 0 ? (tasks.filter(task => task.status === 'completed').length / tasks.length) * 100 : 0,
      avgProgress: tasks.length > 0 ? tasks.reduce((sum, task) => sum + (task.progress?.percentage || 0), 0) / tasks.length : 0
    };

    // Calculate overdue tasks for this user
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.dueDate < now && !['completed', 'cancelled'].includes(task.status)
    ).length;

    res.status(200).json({
      success: true,
      data: {
        userId,
        user: tasks.length > 0 ? tasks[0].assignedTo : null,
        startDate: dateStart,
        endDate: dateEnd,
        tasks,
        statistics: {
          ...statistics,
          overdueTasks
        },
        filters: { userId, startDate, endDate, department }
      }
    });
  } catch (error) {
    console.error('Error fetching user report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user report',
      error: error.message
    });
  }
};

// @desc    Get client-based report
// @route   GET /api/v1/reports/client
// @access  Private
exports.getClientReport = async (req, res) => {
  try {
    const { clientId, startDate, endDate, department } = req.query;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    // Set date range (default to last 30 days if not provided)
    let dateStart, dateEnd;
    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
    } else {
      dateEnd = new Date();
      dateStart = new Date();
      dateStart.setDate(dateStart.getDate() - 30);
    }
    
    dateStart.setHours(0, 0, 0, 0);
    dateEnd.setHours(23, 59, 59, 999);

    // Build query
    let query = {
      client: clientId,
      createdAt: { $gte: dateStart, $lte: dateEnd }
    };

    if (department) query.department = department;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .populate('client', 'name email company');

    // Calculate client project statistics
    const statistics = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in_progress').length,
        review: tasks.filter(task => task.status === 'review').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        cancelled: tasks.filter(task => task.status === 'cancelled').length
      },
      byPriority: {
        low: tasks.filter(task => task.priority === 'low').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        high: tasks.filter(task => task.priority === 'high').length,
        urgent: tasks.filter(task => task.priority === 'urgent').length
      },
      totalEstimatedHours: tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      totalActualHours: tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0),
      completionRate: tasks.length > 0 ? (tasks.filter(task => task.status === 'completed').length / tasks.length) * 100 : 0,
      avgProgress: tasks.length > 0 ? tasks.reduce((sum, task) => sum + (task.progress?.percentage || 0), 0) / tasks.length : 0
    };

    // Calculate department breakdown for this client
    const departmentBreakdown = {};
    tasks.forEach(task => {
      const deptName = task.department?.name || 'Unassigned';
      if (!departmentBreakdown[deptName]) {
        departmentBreakdown[deptName] = 0;
      }
      departmentBreakdown[deptName]++;
    });

    // Calculate overdue tasks for this client
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.dueDate < now && !['completed', 'cancelled'].includes(task.status)
    ).length;

    res.status(200).json({
      success: true,
      data: {
        clientId,
        client: tasks.length > 0 ? tasks[0].client : null,
        startDate: dateStart,
        endDate: dateEnd,
        tasks,
        statistics: {
          ...statistics,
          overdueTasks,
          departmentBreakdown
        },
        filters: { clientId, startDate, endDate, department }
      }
    });
  } catch (error) {
    console.error('Error fetching client report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client report',
      error: error.message
    });
  }
};

