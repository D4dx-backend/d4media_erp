const express = require('express');
const router = express.Router();

// Import controllers
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateProgress,
  addProgressNote,
  uploadAttachment,
  deleteAttachment,
  getTasksByDepartment,
  getOverdueTasks,
  startTimeTracking,
  stopTimeTracking,
  addManualTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry
} = require('../controllers/taskController');

// Import middleware
const { protect, checkDepartmentAccess, checkResourceOwnership } = require('../middleware/auth');
const { taskPermissions, compositePermissions } = require('../middleware/taskPermissions');

// Import validators
const {
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask,
  validateUpdateProgress,
  validateAddProgressNote,
  validateTaskQuery,
  validateTaskId,
  validateDepartmentId,
  validateAttachmentId,
  validateStartTimeTracking,
  validateStopTimeTracking,
  validateManualTimeEntry,
  validateUpdateTimeEntry,
  validateTimeEntryId
} = require('../validators/taskValidators');

// Apply authentication to all routes
router.use(protect);

// Overdue tasks (must come before /:id routes)
router.get('/overdue',
  checkDepartmentAccess({ resourceType: 'task' }),
  taskPermissions.canRead,
  getOverdueTasks
);

// Task CRUD routes
router.route('/')
  .get(
    validateTaskQuery,
    checkDepartmentAccess({ resourceType: 'task' }),
    taskPermissions.canRead,
    getTasks
  )
  .post(
    validateCreateTask,
    checkDepartmentAccess({ requireWrite: true }),
    taskPermissions.canCreate,
    createTask
  );

// Single task routes
router.route('/:id')
  .get(
    validateTaskId,
    checkResourceOwnership({ resourceType: 'task' }),
    taskPermissions.canRead,
    getTask
  )
  .put(
    validateUpdateTask,
    checkResourceOwnership({ resourceType: 'task' }),
    taskPermissions.canUpdate,
    updateTask
  )
  .delete(
    validateTaskId,
    checkResourceOwnership({ resourceType: 'task' }),
    taskPermissions.canDelete,
    deleteTask
  );

// Task assignment
router.put('/:id/assign',
  validateAssignTask,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canAssign,
  assignTask
);

// Progress tracking
router.put('/:id/progress',
  validateUpdateProgress,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdateAssigned,
  updateProgress
);

// Progress notes
router.post('/:id/notes',
  validateAddProgressNote,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdateAssigned,
  addProgressNote
);

// File attachments
router.post('/:id/attachments',
  validateTaskId,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdate,
  uploadAttachment
);

router.delete('/:id/attachments/:attachmentId',
  validateAttachmentId,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdate,
  deleteAttachment
);

// Department-specific routes
router.get('/department/:departmentId',
  validateDepartmentId,
  checkDepartmentAccess({ resourceType: 'task' }),
  taskPermissions.canRead,
  getTasksByDepartment
);

// Time tracking routes
router.post('/:id/time/start',
  validateStartTimeTracking,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdateAssigned,
  startTimeTracking
);

router.put('/:id/time/stop',
  validateStopTimeTracking,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdateAssigned,
  stopTimeTracking
);

router.post('/:id/time/manual',
  validateManualTimeEntry,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdateAssigned,
  addManualTimeEntry
);

router.get('/:id/time',
  validateTaskId,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canRead,
  getTimeEntries
);

router.put('/:id/time/:entryId',
  validateUpdateTimeEntry,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdateAssigned,
  updateTimeEntry
);

router.delete('/:id/time/:entryId',
  validateTimeEntryId,
  checkResourceOwnership({ resourceType: 'task' }),
  taskPermissions.canUpdateAssigned,
  deleteTimeEntry
);

module.exports = router;