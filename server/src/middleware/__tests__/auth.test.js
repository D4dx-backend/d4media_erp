const jwt = require('jsonwebtoken');
const { protect, authorize, checkDepartmentAccess, checkResourceOwnership } = require('../auth');
const User = require('../../models/User');
const Task = require('../../models/Task');

// Mock the models
jest.mock('../../models/User');
jest.mock('../../models/Task');
jest.mock('../../models/StudioBooking');
jest.mock('../../models/Department');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
      params: {},
      body: {},
      method: 'GET'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    it('should deny access when no token is provided', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      const error = new Error('Token is not valid');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token is not valid'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user is not found', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user123' });
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token is not valid - user not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user is inactive', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user123' });
      const mockUser = {
        _id: 'user123',
        isActive: false,
        role: 'department_staff'
      };
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account is deactivated'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access when token is valid and user is active', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user123' });
      const mockUser = {
        _id: 'user123',
        isActive: true,
        role: 'department_staff',
        department: { _id: 'dept123' }
      };
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should deny access when user is not authenticated', () => {
      const middleware = authorize('super_admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Please authenticate first.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user role is not authorized', () => {
      req.user = { role: 'department_staff' };
      const middleware = authorize('super_admin', 'department_admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access when user role is authorized', () => {
      req.user = { role: 'department_admin' };
      const middleware = authorize('super_admin', 'department_admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('checkDepartmentAccess middleware', () => {
    it('should allow super admin to access any department', async () => {
      req.user = { role: 'super_admin' };
      req.params.departmentId = 'dept123';
      const middleware = checkDepartmentAccess();
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow reception to access any department', async () => {
      req.user = { role: 'reception' };
      req.params.departmentId = 'dept123';
      const middleware = checkDepartmentAccess();
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny department staff access to other departments', async () => {
      req.user = { 
        role: 'department_staff',
        department: { _id: 'dept456' }
      };
      req.params.departmentId = 'dept123';
      const middleware = checkDepartmentAccess();
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. You can only access your own department.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow department staff to access their own department', async () => {
      req.user = { 
        role: 'department_staff',
        department: { _id: 'dept123' }
      };
      req.params.departmentId = 'dept123';
      const middleware = checkDepartmentAccess();
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny client access by default', async () => {
      req.user = { role: 'client' };
      const middleware = checkDepartmentAccess();
      
      try {
        await middleware(req, res, next);
      } catch (error) {
        // If there's an error, the middleware should still handle it gracefully
        expect(res.status).toHaveBeenCalledWith(500);
        return;
      }

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. Clients have limited access.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow client access when clientAccessOnly is true', async () => {
      req.user = { role: 'client' };
      const middleware = checkDepartmentAccess({ clientAccessOnly: true });
      
      try {
        await middleware(req, res, next);
      } catch (error) {
        // If there's an error, the middleware should still handle it gracefully
        expect(res.status).toHaveBeenCalledWith(500);
        return;
      }

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('checkResourceOwnership middleware', () => {
    it('should allow super admin to access any resource', async () => {
      req.user = { role: 'super_admin' };
      req.params.id = 'task123';
      const middleware = checkResourceOwnership({ resourceType: 'task' });
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when resource is not found', async () => {
      req.user = { role: 'department_staff' };
      req.params.id = 'task123';
      Task.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      
      const middleware = checkResourceOwnership({ resourceType: 'task' });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Task not found'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});