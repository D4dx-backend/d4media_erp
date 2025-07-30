const mongoose = require('mongoose');
const Department = require('../../models/Department');
const User = require('../../models/User');
const Task = require('../../models/Task');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus
} = require('../departmentController');

// Mock data
const mockSuperAdmin = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Super Admin',
  email: 'admin@d4media.com',
  role: 'super_admin',
  isActive: true
};

const mockDepartmentData = {
  name: 'Test Department',
  code: 'TEST',
  description: 'Test department for unit testing',
  settings: {
    defaultTaskPriority: 'medium',
    autoAssignment: false,
    requireApproval: true
  },
  taskTypes: [
    {
      name: 'Design Task',
      estimatedHours: 4,
      billingRate: 50
    }
  ]
};

// Mock JWT token for authentication
const mockToken = 'mock-jwt-token';

// Mock middleware
jest.mock('../../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = mockSuperAdmin;
    next();
  },
  authorize: (...roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ success: false, error: 'Access denied' });
    }
  }
}));

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => []
  }))
}));

describe('Department Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup mock request, response, and next
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: mockSuperAdmin
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('createDepartment', () => {
    it('should create a new department successfully', async () => {
      // Setup request
      mockReq.body = mockDepartmentData;

      // Mock Department.findOne to return null (no existing department)
      Department.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock Department.create
      const mockCreatedDepartment = {
        ...mockDepartmentData,
        _id: new mongoose.Types.ObjectId(),
        code: mockDepartmentData.code.toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
        populate: jest.fn().mockResolvedValue({
          ...mockDepartmentData,
          _id: new mongoose.Types.ObjectId(),
          admin: null
        })
      };
      Department.create = jest.fn().mockResolvedValue(mockCreatedDepartment);

      await createDepartment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Department created successfully',
        data: expect.any(Object)
      });
      expect(Department.create).toHaveBeenCalledWith({
        name: mockDepartmentData.name,
        code: mockDepartmentData.code.toUpperCase(),
        description: mockDepartmentData.description,
        admin: undefined,
        settings: mockDepartmentData.settings,
        taskTypes: mockDepartmentData.taskTypes
      });
    });

    it('should return error for duplicate department name or code', async () => {
      // Setup request
      mockReq.body = mockDepartmentData;

      // Mock Department.findOne to return existing department
      Department.findOne = jest.fn().mockResolvedValue({ name: 'Test Department' });

      await createDepartment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Department with this name or code already exists'
      });
    });
  });

  describe('getDepartments', () => {
    it('should get all departments with pagination', async () => {
      // Setup request
      mockReq.query = { page: '1', limit: '10' };

      const mockDepartments = [
        {
          ...mockDepartmentData,
          _id: new mongoose.Types.ObjectId(),
          createdAt: new Date()
        }
      ];

      // Mock Department.find chain
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDepartments)
      };
      Department.find = jest.fn().mockReturnValue(mockQuery);
      Department.countDocuments = jest.fn().mockResolvedValue(1);

      await getDepartments(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDepartments,
        pagination: expect.objectContaining({
          currentPage: 1,
          totalDepartments: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          limit: 10
        })
      });
    });
  });

  describe('getDepartment', () => {
    it('should get a single department by ID', async () => {
      const departmentId = new mongoose.Types.ObjectId();
      mockReq.params.id = departmentId.toString();

      const mockDepartment = {
        ...mockDepartmentData,
        _id: departmentId
      };

      // Mock Department.findById chain with multiple populate calls
      const mockQuery = {
        populate: jest.fn().mockReturnThis()
      };
      // The controller calls populate 3 times, so we need to handle the chain
      mockQuery.populate
        .mockReturnValueOnce(mockQuery) // First populate call
        .mockReturnValueOnce(mockQuery) // Second populate call  
        .mockResolvedValueOnce(mockDepartment); // Final populate call returns the department
      
      Department.findById = jest.fn().mockReturnValue(mockQuery);

      await getDepartment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDepartment
      });
      expect(Department.findById).toHaveBeenCalledWith(departmentId.toString());
    });

    it('should return 404 for non-existent department', async () => {
      const departmentId = new mongoose.Types.ObjectId();
      mockReq.params.id = departmentId.toString();

      // Mock Department.findById to return null
      const mockQuery = {
        populate: jest.fn().mockReturnThis()
      };
      // The controller calls populate 3 times, so we need to handle the chain
      mockQuery.populate
        .mockReturnValueOnce(mockQuery) // First populate call
        .mockReturnValueOnce(mockQuery) // Second populate call  
        .mockResolvedValueOnce(null); // Final populate call returns null
      
      Department.findById = jest.fn().mockReturnValue(mockQuery);

      await getDepartment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Department not found'
      });
    });
  });

  describe('updateDepartment', () => {
    it('should update a department successfully', async () => {
      const departmentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Updated Department',
        description: 'Updated description'
      };

      mockReq.params.id = departmentId.toString();
      mockReq.body = updateData;

      const mockExistingDepartment = {
        ...mockDepartmentData,
        _id: departmentId,
        name: 'Test Department',
        code: 'TEST'
      };

      const mockUpdatedDepartment = {
        ...mockExistingDepartment,
        ...updateData,
        populate: jest.fn().mockResolvedValue({
          ...mockExistingDepartment,
          ...updateData
        })
      };

      // Mock Department.findById
      Department.findById = jest.fn().mockResolvedValue(mockExistingDepartment);
      
      // Mock Department.findOne for duplicate check
      Department.findOne = jest.fn().mockResolvedValue(null);
      
      // Mock Department.findByIdAndUpdate
      Department.findByIdAndUpdate = jest.fn().mockReturnValue(mockUpdatedDepartment);

      await updateDepartment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Department updated successfully',
        data: expect.any(Object)
      });
    });
  });

  describe('toggleDepartmentStatus', () => {
    it('should toggle department status successfully', async () => {
      const departmentId = new mongoose.Types.ObjectId();
      mockReq.params.id = departmentId.toString();
      mockReq.body = { isActive: false };

      const mockDepartment = {
        ...mockDepartmentData,
        _id: departmentId,
        isActive: true,
        save: jest.fn().mockResolvedValue(true)
      };

      Department.findById = jest.fn().mockResolvedValue(mockDepartment);
      Task.countDocuments = jest.fn().mockResolvedValue(0);

      await toggleDepartmentStatus(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Department deactivated successfully',
        data: {
          id: departmentId,
          name: mockDepartmentData.name,
          code: mockDepartmentData.code,
          isActive: false
        }
      });
      expect(mockDepartment.save).toHaveBeenCalled();
    });

    it('should prevent deactivation when department has active tasks', async () => {
      const departmentId = new mongoose.Types.ObjectId();
      mockReq.params.id = departmentId.toString();
      mockReq.body = { isActive: false };

      const mockDepartment = {
        ...mockDepartmentData,
        _id: departmentId,
        isActive: true
      };

      Department.findById = jest.fn().mockResolvedValue(mockDepartment);
      Task.countDocuments = jest.fn().mockResolvedValue(5); // 5 active tasks

      await toggleDepartmentStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot deactivate department with 5 active tasks. Please complete or reassign tasks first.',
        activeTasksCount: 5
      });
    });
  });

  describe('deleteDepartment', () => {
    it('should prevent deletion when department has active tasks', async () => {
      const departmentId = new mongoose.Types.ObjectId();
      mockReq.params.id = departmentId.toString();

      const mockDepartment = {
        ...mockDepartmentData,
        _id: departmentId,
        isActive: true
      };

      Department.findById = jest.fn().mockResolvedValue(mockDepartment);
      Task.countDocuments = jest.fn().mockResolvedValue(3); // 3 active tasks

      await deleteDepartment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete department with 3 active tasks. Please complete or reassign tasks first.',
        activeTasksCount: 3
      });
    });

    it('should prevent deletion when department has assigned users', async () => {
      const departmentId = new mongoose.Types.ObjectId();
      mockReq.params.id = departmentId.toString();

      const mockDepartment = {
        ...mockDepartmentData,
        _id: departmentId,
        isActive: true
      };

      Department.findById = jest.fn().mockResolvedValue(mockDepartment);
      Task.countDocuments = jest.fn().mockResolvedValue(0); // No active tasks
      User.countDocuments = jest.fn().mockResolvedValue(2); // 2 assigned users

      await deleteDepartment(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete department with 2 assigned users. Please reassign users first.',
        assignedUsersCount: 2
      });
    });

    it('should soft delete department when no constraints exist', async () => {
      const departmentId = new mongoose.Types.ObjectId();
      mockReq.params.id = departmentId.toString();

      const mockDepartment = {
        ...mockDepartmentData,
        _id: departmentId,
        isActive: true,
        save: jest.fn().mockResolvedValue(true)
      };

      Department.findById = jest.fn().mockResolvedValue(mockDepartment);
      Task.countDocuments = jest.fn().mockResolvedValue(0); // No active tasks
      User.countDocuments = jest.fn().mockResolvedValue(0); // No assigned users

      await deleteDepartment(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Department deactivated successfully'
      });
      expect(mockDepartment.isActive).toBe(false);
      expect(mockDepartment.save).toHaveBeenCalled();
    });
  });
});