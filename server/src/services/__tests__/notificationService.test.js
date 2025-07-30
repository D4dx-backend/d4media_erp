const notificationService = require('../notificationService');
const Task = require('../../models/Task');
const User = require('../../models/User');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

jest.mock('../../models/Task');
jest.mock('../../models/User');

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTaskAssignmentNotification', () => {
    it('should send task assignment notification to assigned user', async () => {
      // Mock data
      const task = {
        _id: 'task123',
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        dueDate: new Date(),
        estimatedHours: 5
      };

      const assignedUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        notifications: {
          taskUpdates: true
        }
      };

      // Call the method
      await notificationService.sendTaskAssignmentNotification(task, assignedUser);

      // Check if email was sent
      expect(notificationService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: assignedUser.email,
          subject: expect.stringContaining(task.title)
        })
      );
    });

    it('should not send notification if user has disabled task updates', async () => {
      // Mock data
      const task = {
        _id: 'task123',
        title: 'Test Task'
      };

      const assignedUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        notifications: {
          taskUpdates: false
        }
      };

      // Call the method
      await notificationService.sendTaskAssignmentNotification(task, assignedUser);

      // Check that email was not sent
      expect(notificationService.transporter.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('sendTaskStatusChangeNotification', () => {
    it('should send status change notification to all stakeholders', async () => {
      // Mock data
      const task = {
        _id: 'task123',
        title: 'Test Task',
        status: 'in_progress',
        progress: { percentage: 50 }
      };

      const previousStatus = 'pending';
      const changedBy = { _id: 'user123', name: 'Test User' };

      // Mock stakeholders
      const stakeholders = [
        { _id: 'user1', name: 'User 1', email: 'user1@example.com', notifications: { taskUpdates: true } },
        { _id: 'user2', name: 'User 2', email: 'user2@example.com', notifications: { taskUpdates: true } }
      ];

      // Mock getTaskStakeholders method
      notificationService.getTaskStakeholders = jest.fn().mockResolvedValue(stakeholders);

      // Call the method
      await notificationService.sendTaskStatusChangeNotification(task, previousStatus, changedBy);

      // Check if emails were sent to all stakeholders
      expect(notificationService.transporter.sendMail).toHaveBeenCalledTimes(2);
      expect(notificationService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: stakeholders[0].email,
          subject: expect.stringContaining(task.title)
        })
      );
      expect(notificationService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: stakeholders[1].email,
          subject: expect.stringContaining(task.title)
        })
      );
    });
  });

  describe('checkAndNotifyOverdueTasks', () => {
    it('should send notifications for overdue tasks', async () => {
      // Mock overdue tasks
      const overdueTasks = [
        {
          _id: 'task1',
          title: 'Overdue Task 1',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          status: 'in_progress',
          progress: { percentage: 50 }
        },
        {
          _id: 'task2',
          title: 'Overdue Task 2',
          dueDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
          status: 'pending',
          progress: { percentage: 0 }
        }
      ];

      // Mock Task.find
      Task.find.mockResolvedValue(overdueTasks);

      // Mock sendOverdueTaskNotification
      notificationService.sendOverdueTaskNotification = jest.fn();

      // Call the method
      await notificationService.checkAndNotifyOverdueTasks();

      // Check if notifications were sent for each overdue task
      expect(notificationService.sendOverdueTaskNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.sendOverdueTaskNotification).toHaveBeenCalledWith(overdueTasks[0]);
      expect(notificationService.sendOverdueTaskNotification).toHaveBeenCalledWith(overdueTasks[1]);
    });
  });

  describe('checkAndSendDeadlineReminders', () => {
    it('should send reminders for tasks with approaching deadlines', async () => {
      const now = new Date();
      
      // Mock tasks with approaching deadlines
      const tasksDueIn24Hours = [
        {
          _id: 'task1',
          title: 'Due Soon Task 1',
          dueDate: new Date(now.getTime() + 20 * 60 * 60 * 1000), // 20 hours from now
          status: 'in_progress',
          progress: { percentage: 50 }
        }
      ];

      const tasksDueIn2Hours = [
        {
          _id: 'task2',
          title: 'Due Very Soon Task 2',
          dueDate: new Date(now.getTime() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
          status: 'in_progress',
          progress: { percentage: 75 }
        }
      ];

      // Mock Task.find for different queries
      Task.find.mockImplementation((query) => {
        if (query.dueDate.$lte.getTime() - now.getTime() > 20 * 60 * 60 * 1000) {
          return Promise.resolve(tasksDueIn24Hours);
        } else {
          return Promise.resolve(tasksDueIn2Hours);
        }
      });

      // Mock sendDeadlineReminderNotification
      notificationService.sendDeadlineReminderNotification = jest.fn();

      // Call the method
      await notificationService.checkAndSendDeadlineReminders();

      // Check if reminders were sent for each task
      expect(notificationService.sendDeadlineReminderNotification).toHaveBeenCalledTimes(2);
    });
  });
});