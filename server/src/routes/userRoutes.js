const express = require('express');
const router = express.Router();
const { protect, authorize, checkDepartment } = require('../middleware/auth');
const {
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
} = require('../controllers/userController');
const {
  createUserValidation,
  updateUserValidation,
  getUsersValidation,
  userIdValidation,
  departmentUsersValidation,
  updateProfileValidation,
  updatePasswordValidation,
  resetPasswordValidation
} = require('../validators/userValidators');

// All user routes require authentication
router.use(protect);

// Profile routes (accessible to all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, updateProfile);
router.put('/profile/password', updatePasswordValidation, updatePassword);

// Department users route (accessible to department admins and super admins)
router.get('/department/:id', 
  departmentUsersValidation,
  authorize('super_admin', 'department_admin'),
  checkDepartment,
  getDepartmentUsers
);

// Admin only routes (Super Admin only)
router.get('/', 
  getUsersValidation,
  authorize('super_admin'), 
  getUsers
);

router.post('/', 
  createUserValidation,
  authorize('super_admin'), 
  createUser
);

router.get('/:id', 
  userIdValidation,
  authorize('super_admin'), 
  getUser
);

router.put('/:id', 
  updateUserValidation,
  authorize('super_admin'), 
  updateUser
);

router.delete('/:id', 
  userIdValidation,
  authorize('super_admin'), 
  deleteUser
);

router.patch('/:id/status', 
  userIdValidation,
  authorize('super_admin'), 
  toggleUserStatus
);

router.put('/:id/reset-password', 
  resetPasswordValidation,
  authorize('super_admin'), 
  resetUserPassword
);

router.post('/test-whatsapp', 
  authorize('super_admin'), 
  testWhatsApp
);

module.exports = router;