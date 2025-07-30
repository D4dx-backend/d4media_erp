const request = require('supertest');
const express = require('express');
const { validationResult } = require('express-validator');
const User = require('../../models/User');
const Department = require('../../models/Department');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getDepartmentUsers,
  getProfile,
  updateProfile
} = require('../userController');

// Mock the models and validation
jest.mock('../../models/User');
jest.mock('../../models/Department');
jest.mock('express-validator');

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'user123', role: 'super_admin' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock validation to pass by default
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  describe('getUsers', () => {
    it('should return paginated users list', async () => {
      const mockUsers = [
        { _id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'department_staff' },
        { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'department_admin' }
      ];

      User.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments.mockResolvedValue(2);

      await getUsers(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 2,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10
        }
      });
    });

    it('should handle search functionality', async () => {
      req.query.search = 'john';
      const mockUsers = [
        { _id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'department_staff' }
      ];

      User.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments.mockResolvedValue(1);

      await getUsers(req, res, next);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
          { company: { $regex: 'john', $options: 'i' } }
        ]
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid page number' }]
      });

      await getUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: [{ msg: 'Invalid page number' }]
      });
    });
  });

  describe('getUser', () => {
    it('should return single user by ID', async () => {
      req.params.id = 'user123';
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'department_staff'
      };

      User.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await getUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should return 404 when user not found', async () => {
      req.params.id = 'nonexistent';
      User.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(null)
      });

      await getUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('createUser', () => {
    it('should create new user successfully', async () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'department_staff',
        department: 'dept123'
      };

      User.findOne.mockResolvedValue(null); // No existing user
      Department.findById.mockResolvedValue({ _id: 'dept123', name: 'Design' });
      
      const mockUser = {
        _id: 'user123',
        ...req.body,
        populate: jest.fn().mockResolvedValue({
          _id: 'user123',
          ...req.body,
          department: { _id: 'dept123', name: 'Design' }
        })
      };
      User.create.mockResolvedValue(mockUser);

      await createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        data: expect.any(Object)
      });
    });

    it('should return error when user already exists', async () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'department_staff'
      };

      User.findOne.mockResolvedValue({ _id: 'existing123' });

      await createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User already exists with this email'
      });
    });

    it('should require department for department roles', async () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'department_staff'
        // No department provided
      };

      User.findOne.mockResolvedValue(null);

      await createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Department is required for department roles'
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      req.params.id = 'user123';
      req.body = { name: 'Updated Name' };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'department_staff'
      };

      User.findById.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue(null); // No email conflict
      User.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockUser,
          name: 'Updated Name'
        })
      });

      await updateUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: expect.objectContaining({
          name: 'Updated Name'
        })
      });
    });

    it('should return 404 when user not found', async () => {
      req.params.id = 'nonexistent';
      req.body = { name: 'Updated Name' };

      User.findById.mockResolvedValue(null);

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('deleteUser', () => {
    it('should deactivate user successfully', async () => {
      req.params.id = 'user123';
      const mockUser = {
        _id: 'user123',
        role: 'department_staff',
        isActive: true,
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      await deleteUser(req, res, next);

      expect(mockUser.isActive).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deactivated successfully'
      });
    });

    it('should prevent deleting last super admin', async () => {
      req.params.id = 'user123';
      const mockUser = {
        _id: 'user123',
        role: 'super_admin',
        isActive: true
      };

      User.findById.mockResolvedValue(mockUser);
      User.countDocuments.mockResolvedValue(1); // Only one super admin

      await deleteUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete the last active super admin'
      });
    });
  });

  describe('toggleUserStatus', () => {
    it('should activate user successfully', async () => {
      req.params.id = 'user123';
      req.body = { isActive: true };
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'department_staff',
        isActive: false,
        save: jest.fn().mockResolvedValue()
      };

      User.findById.mockResolvedValue(mockUser);

      await toggleUserStatus(req, res, next);

      expect(mockUser.isActive).toBe(true);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User activated successfully',
        data: {
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          isActive: true
        }
      });
    });

    it('should validate isActive parameter', async () => {
      req.params.id = 'user123';
      req.body = { isActive: 'invalid' };

      await toggleUserStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'isActive must be a boolean value'
      });
    });
  });

  describe('getDepartmentUsers', () => {
    it('should return users from specific department', async () => {
      req.params.id = 'dept123';
      const mockDepartment = { _id: 'dept123', name: 'Design', code: 'DES' };
      const mockUsers = [
        { _id: 'user1', name: 'John Doe', department: 'dept123' }
      ];

      Department.findById.mockResolvedValue(mockDepartment);
      User.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments.mockResolvedValue(1);

      await getDepartmentUsers(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        department: {
          id: 'dept123',
          name: 'Design',
          code: 'DES'
        },
        pagination: expect.any(Object)
      });
    });

    it('should return 404 when department not found', async () => {
      req.params.id = 'nonexistent';
      Department.findById.mockResolvedValue(null);

      await getDepartmentUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Department not found'
      });
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'department_staff'
      };

      User.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await getProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      req.body = { name: 'Updated Name', phone: '+1234567890' };
      const mockUser = {
        _id: 'user123',
        name: 'Updated Name',
        phone: '+1234567890'
      };

      User.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      await updateProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: mockUser
      });
    });

    it('should not allow updating restricted fields', async () => {
      req.body = { 
        name: 'Updated Name',
        role: 'super_admin', // Should be removed
        email: 'new@example.com', // Should be removed
        isActive: false // Should be removed
      };

      User.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'user123',
          name: 'Updated Name'
        })
      });

      await updateProfile(req, res, next);

      // Verify that restricted fields were removed from updateData
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { name: 'Updated Name' }, // Only allowed fields
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should call next with error when database operation fails', async () => {
      const error = new Error('Database connection failed');
      User.find.mockImplementation(() => {
        throw error;
      });

      await getUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});