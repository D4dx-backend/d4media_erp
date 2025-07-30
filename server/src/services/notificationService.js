const nodemailer = require("nodemailer");
const User = require("../models/User");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const socketIO = require("socket.io");
const {
  getAllowedOrigins,
  getSocketIOCorsConfig,
} = require("../utils/corsConfig");

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.io = null;
  }

  // Initialize Socket.IO for real-time notifications
  initializeSocketIO(server) {
    // Get environment-aware allowed origins (consistent with main server)
    const allowedOrigins = getAllowedOrigins();

    this.io = socketIO(server, {
      cors: getSocketIOCorsConfig(allowedOrigins),
      allowEIO3: true, // Allow Engine.IO v3 clients to connect
      transports: ["websocket", "polling"], // Support both WebSocket and polling
    });

    this.io.on("connection", (socket) => {
      console.log("Client connected to notification socket:", socket.id);

      // Authenticate user and join their personal notification room
      socket.on("authenticate", async (token) => {
        try {
          // This is a placeholder - actual JWT verification would be implemented
          // For now, we'll just use the user ID directly for simplicity
          const userId = token;
          if (userId) {
            socket.join(`user:${userId}`);
            console.log(`User ${userId} joined their notification room`);

            // Send unread notifications count on connection
            const unreadCount = await this.getUnreadNotificationsCount(userId);
            socket.emit("unread_count", unreadCount);
          }
        } catch (error) {
          console.error("Socket authentication error:", error);
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected from notification socket:", socket.id);
      });
    });

    console.log("Socket.IO initialized for real-time notifications");
    return this.io;
  }

  // Create database notification
  async createNotification(data) {
    try {
      const notification = await Notification.create({
        recipient: data.recipient,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || "medium",
        relatedModel: data.relatedModel || null,
        relatedId: data.relatedId || null,
        metadata: data.metadata || {},
      });

      // Send real-time notification if socket is initialized
      if (this.io) {
        this.io.to(`user:${data.recipient}`).emit("new_notification", {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          priority: notification.priority,
        });

        // Update unread count
        const unreadCount = await this.getUnreadNotificationsCount(
          data.recipient
        );
        this.io.to(`user:${data.recipient}`).emit("unread_count", unreadCount);
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      const query = { recipient: userId };
      const limit = options.limit || 20;
      const skip = options.skip || 0;
      const sort = options.sort || { createdAt: -1 };

      if (options.unreadOnly) {
        query.read = false;
      }

      const notifications = await Notification.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Notification.countDocuments(query);

      return {
        notifications,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + limit,
        },
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return {
        notifications: [],
        pagination: { total: 0, limit: 0, skip: 0, hasMore: false },
      };
    }
  }

  // Get unread notifications count
  async getUnreadNotificationsCount(userId) {
    try {
      return await Notification.countDocuments({
        recipient: userId,
        read: false,
      });
    } catch (error) {
      console.error("Error getting unread notifications count:", error);
      return 0;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { read: true },
        { new: true }
      );

      if (notification && this.io) {
        const unreadCount = await this.getUnreadNotificationsCount(userId);
        this.io.to(`user:${userId}`).emit("unread_count", unreadCount);
      }

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return null;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true }
      );

      if (this.io) {
        this.io.to(`user:${userId}`).emit("unread_count", 0);
      }

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        recipient: userId,
      });

      if (result.deletedCount > 0 && this.io) {
        const unreadCount = await this.getUnreadNotificationsCount(userId);
        this.io.to(`user:${userId}`).emit("unread_count", unreadCount);
      }

      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  // Send task assignment notification
  async sendTaskAssignmentNotification(task, assignedUser) {
    try {
      if (!assignedUser.notifications?.taskUpdates) return;

      const subject = `New Task Assigned: ${task.title}`;
      const html = `
        <h2>New Task Assignment</h2>
        <p>Hello ${assignedUser.name},</p>
        <p>You have been assigned a new task:</p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
          <h3>${task.title}</h3>
          <p><strong>Description:</strong> ${task.description}</p>
          <p><strong>Priority:</strong> ${task.priority}</p>
          <p><strong>Due Date:</strong> ${new Date(
            task.dueDate
          ).toLocaleDateString()}</p>
          <p><strong>Estimated Hours:</strong> ${task.estimatedHours}</p>
        </div>
        <p>Please log in to the system to view more details and start working on this task.</p>
      `;

      // Send email notification
      await this.sendEmail(assignedUser.email, subject, html);

      // Create database notification
      await this.createNotification({
        recipient: assignedUser._id,
        type: "task_assignment",
        title: `New Task: ${task.title}`,
        message: `You have been assigned a new ${
          task.priority
        } priority task due on ${new Date(task.dueDate).toLocaleDateString()}.`,
        priority: task.priority === "urgent" ? "urgent" : "medium",
        relatedModel: "Task",
        relatedId: task._id,
        metadata: {
          taskTitle: task.title,
          taskPriority: task.priority,
          dueDate: task.dueDate,
        },
      });
    } catch (error) {
      console.error("Error sending task assignment notification:", error);
    }
  }

  // Send task status change notification
  async sendTaskStatusChangeNotification(task, previousStatus, changedBy) {
    try {
      const stakeholders = await this.getTaskStakeholders(task);

      for (const user of stakeholders) {
        if (!user.notifications?.taskUpdates) continue;

        const subject = `Task Status Updated: ${task.title}`;
        const html = `
          <h2>Task Status Update</h2>
          <p>Hello ${user.name},</p>
          <p>The status of task "${task.title}" has been updated:</p>
          <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
            <p><strong>Previous Status:</strong> ${this.formatStatus(
              previousStatus
            )}</p>
            <p><strong>New Status:</strong> ${this.formatStatus(
              task.status
            )}</p>
            <p><strong>Updated By:</strong> ${changedBy.name}</p>
            <p><strong>Progress:</strong> ${task.progress.percentage}%</p>
          </div>
          <p>Log in to the system to view more details.</p>
        `;

        // Send email notification
        await this.sendEmail(user.email, subject, html);

        // Create database notification
        await this.createNotification({
          recipient: user._id,
          type: "task_status",
          title: `Task Status Updated: ${task.title}`,
          message: `Status changed from ${this.formatStatus(
            previousStatus
          )} to ${this.formatStatus(task.status)} by ${changedBy.name}.`,
          priority: task.priority === "urgent" ? "high" : "medium",
          relatedModel: "Task",
          relatedId: task._id,
          metadata: {
            taskTitle: task.title,
            previousStatus,
            newStatus: task.status,
            updatedBy: changedBy.name,
            progress: task.progress.percentage,
          },
        });
      }
    } catch (error) {
      console.error("Error sending task status change notification:", error);
    }
  }

  // Send overdue task notification
  async sendOverdueTaskNotification(task) {
    try {
      const stakeholders = await this.getTaskStakeholders(task);

      for (const user of stakeholders) {
        if (!user.notifications?.deadlineReminders) continue;

        const daysOverdue = Math.ceil(
          (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)
        );
        const subject = `⚠️ Overdue Task: ${task.title}`;
        const html = `
          <h2 style="color: #dc3545;">Overdue Task Alert</h2>
          <p>Hello ${user.name},</p>
          <p>The following task is overdue and requires immediate attention:</p>
          <div style="border: 2px solid #dc3545; padding: 15px; margin: 10px 0; background-color: #f8d7da;">
            <h3>${task.title}</h3>
            <p><strong>Due Date:</strong> ${new Date(
              task.dueDate
            ).toLocaleDateString()}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <p><strong>Current Status:</strong> ${this.formatStatus(
              task.status
            )}</p>
            <p><strong>Progress:</strong> ${task.progress.percentage}%</p>
          </div>
          <p>Please take immediate action to complete this task or update its status.</p>
        `;

        // Send email notification
        await this.sendEmail(user.email, subject, html);

        // Create database notification
        await this.createNotification({
          recipient: user._id,
          type: "overdue_task",
          title: `⚠️ Overdue Task: ${task.title}`,
          message: `Task "${task.title}" is ${daysOverdue} day(s) overdue and requires immediate attention.`,
          priority: "urgent",
          relatedModel: "Task",
          relatedId: task._id,
          metadata: {
            taskTitle: task.title,
            dueDate: task.dueDate,
            daysOverdue,
            priority: task.priority,
            status: task.status,
            progress: task.progress.percentage,
          },
        });
      }
    } catch (error) {
      console.error("Error sending overdue task notification:", error);
    }
  }

  // Send deadline reminder notification
  async sendDeadlineReminderNotification(task, hoursUntilDeadline) {
    try {
      const stakeholders = await this.getTaskStakeholders(task);

      for (const user of stakeholders) {
        if (!user.notifications?.deadlineReminders) continue;

        const subject = `⏰ Deadline Reminder: ${task.title}`;
        const html = `
          <h2 style="color: #ffc107;">Deadline Reminder</h2>
          <p>Hello ${user.name},</p>
          <p>This is a reminder that the following task is due soon:</p>
          <div style="border: 2px solid #ffc107; padding: 15px; margin: 10px 0; background-color: #fff3cd;">
            <h3>${task.title}</h3>
            <p><strong>Due Date:</strong> ${new Date(
              task.dueDate
            ).toLocaleDateString()} at ${new Date(
          task.dueDate
        ).toLocaleTimeString()}</p>
            <p><strong>Time Remaining:</strong> ${hoursUntilDeadline} hours</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <p><strong>Current Status:</strong> ${this.formatStatus(
              task.status
            )}</p>
            <p><strong>Progress:</strong> ${task.progress.percentage}%</p>
          </div>
          <p>Please ensure this task is completed on time.</p>
        `;

        // Send email notification
        await this.sendEmail(user.email, subject, html);

        // Create database notification
        await this.createNotification({
          recipient: user._id,
          type: "deadline_reminder",
          title: `⏰ Deadline Reminder: ${task.title}`,
          message: `Task "${task.title}" is due in ${hoursUntilDeadline} hours.`,
          priority: task.priority === "urgent" ? "high" : "medium",
          relatedModel: "Task",
          relatedId: task._id,
          metadata: {
            taskTitle: task.title,
            dueDate: task.dueDate,
            hoursRemaining: hoursUntilDeadline,
            priority: task.priority,
            status: task.status,
            progress: task.progress.percentage,
          },
        });
      }
    } catch (error) {
      console.error("Error sending deadline reminder notification:", error);
    }
  }

  // Send progress update notification
  async sendProgressUpdateNotification(task, progressNote, updatedBy) {
    try {
      const stakeholders = await this.getTaskStakeholders(task);

      for (const user of stakeholders) {
        if (
          !user.notifications?.taskUpdates ||
          user._id.toString() === updatedBy._id.toString()
        )
          continue;

        const subject = `Progress Update: ${task.title}`;
        const html = `
          <h2>Task Progress Update</h2>
          <p>Hello ${user.name},</p>
          <p>There's a new progress update for task "${task.title}":</p>
          <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
            <p><strong>Progress:</strong> ${task.progress.percentage}%</p>
            <p><strong>Status:</strong> ${this.formatStatus(task.status)}</p>
            <p><strong>Updated By:</strong> ${updatedBy.name}</p>
            ${
              progressNote
                ? `<p><strong>Note:</strong> ${progressNote}</p>`
                : ""
            }
          </div>
          <p>Log in to the system to view more details.</p>
        `;

        // Send email notification
        await this.sendEmail(user.email, subject, html);

        // Create database notification
        await this.createNotification({
          recipient: user._id,
          type: "progress_update",
          title: `Progress Update: ${task.title}`,
          message: progressNote
            ? `${updatedBy.name} updated progress to ${task.progress.percentage}%: "${progressNote}"`
            : `${updatedBy.name} updated progress to ${task.progress.percentage}%`,
          priority: "medium",
          relatedModel: "Task",
          relatedId: task._id,
          metadata: {
            taskTitle: task.title,
            progress: task.progress.percentage,
            status: task.status,
            updatedBy: updatedBy.name,
            progressNote: progressNote || null,
          },
        });
      }
    } catch (error) {
      console.error("Error sending progress update notification:", error);
    }
  }

  // Send client feedback notification
  async sendClientFeedbackNotification(task, feedback, client) {
    try {
      const stakeholders = await this.getTaskStakeholders(task);

      for (const user of stakeholders) {
        if (!user.notifications?.taskUpdates || user.role === "client")
          continue;

        const subject = `Client Feedback: ${task.title}`;
        const html = `
          <h2>New Client Feedback</h2>
          <p>Hello ${user.name},</p>
          <p>${client.name} has provided feedback for task "${task.title}":</p>
          <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
            <p><strong>Feedback:</strong> ${feedback}</p>
          </div>
          <p>Log in to the system to view more details and respond.</p>
        `;

        // Send email notification
        await this.sendEmail(user.email, subject, html);

        // Create database notification
        await this.createNotification({
          recipient: user._id,
          type: "client_feedback",
          title: `Client Feedback: ${task.title}`,
          message: `${client.name} has provided feedback: "${feedback.substring(
            0,
            100
          )}${feedback.length > 100 ? "..." : ""}"`,
          priority: "high",
          relatedModel: "Task",
          relatedId: task._id,
          metadata: {
            taskTitle: task.title,
            clientName: client.name,
            clientId: client._id,
            feedback,
          },
        });
      }
    } catch (error) {
      console.error("Error sending client feedback notification:", error);
    }
  }

  // Send system notification to specific users or roles
  async sendSystemNotification(title, message, options = {}) {
    try {
      const { recipients, roles, priority = "medium", emailSubject } = options;

      // Build query to find target users
      const query = { isActive: true };

      if (recipients && recipients.length > 0) {
        query._id = { $in: recipients };
      } else if (roles && roles.length > 0) {
        query.role = { $in: roles };
      } else {
        // Default to super_admin if no specific targets
        query.role = "super_admin";
      }

      const users = await User.find(query);

      for (const user of users) {
        // Create database notification
        await this.createNotification({
          recipient: user._id,
          type: "system",
          title,
          message,
          priority,
          metadata: options.metadata || {},
        });

        // Send email if requested
        if (options.sendEmail && user.notifications?.email) {
          const subject = emailSubject || `System Notification: ${title}`;
          const html = `
            <h2>System Notification</h2>
            <p>Hello ${user.name},</p>
            <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
              <h3>${title}</h3>
              <p>${message}</p>
            </div>
            <p>Log in to the system for more information.</p>
          `;

          await this.sendEmail(user.email, subject, html);
        }
      }

      return users.length;
    } catch (error) {
      console.error("Error sending system notification:", error);
      return 0;
    }
  }

  // Get all stakeholders for a task (assigned user, creator, client, department admin)
  async getTaskStakeholders(task) {
    const stakeholderIds = new Set();

    // Add assigned user
    if (task.assignedTo) {
      if (typeof task.assignedTo === "object" && task.assignedTo._id) {
        stakeholderIds.add(task.assignedTo._id.toString());
      } else {
        stakeholderIds.add(task.assignedTo.toString());
      }
    }

    // Add creator
    if (task.createdBy) {
      if (typeof task.createdBy === "object" && task.createdBy._id) {
        stakeholderIds.add(task.createdBy._id.toString());
      } else {
        stakeholderIds.add(task.createdBy.toString());
      }
    }

    // Add client
    if (task.client) {
      if (typeof task.client === "object" && task.client._id) {
        stakeholderIds.add(task.client._id.toString());
      } else {
        stakeholderIds.add(task.client.toString());
      }
    }

    // Add department admin if available
    if (task.department && task.department.admin) {
      if (
        typeof task.department.admin === "object" &&
        task.department.admin._id
      ) {
        stakeholderIds.add(task.department.admin._id.toString());
      } else {
        stakeholderIds.add(task.department.admin.toString());
      }
    }

    // Fetch all stakeholders
    const stakeholders = await User.find({
      _id: { $in: Array.from(stakeholderIds) },
      isActive: true,
    });

    return stakeholders;
  }

  // Format status for display
  formatStatus(status) {
    const statusMap = {
      pending: "Pending",
      in_progress: "In Progress",
      review: "Under Review",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return statusMap[status] || status;
  }

  // Send email helper
  async sendEmail(to, subject, html) {
    try {
      if (!process.env.SMTP_USER) {
        console.log("Email notification (SMTP not configured):", {
          to,
          subject,
        });
        return;
      }

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });

      console.log("Email sent successfully to:", to);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  // Check for overdue tasks and send notifications
  async checkAndNotifyOverdueTasks() {
    try {
      const overdueTasks = await Task.find({
        dueDate: { $lt: new Date() },
        status: { $nin: ["completed", "cancelled"] },
      }).populate("assignedTo createdBy client department");

      for (const task of overdueTasks) {
        await this.sendOverdueTaskNotification(task);
      }

      console.log(`Processed ${overdueTasks.length} overdue tasks`);
    } catch (error) {
      console.error("Error checking overdue tasks:", error);
    }
  }

  // Check for upcoming deadlines and send reminders
  async checkAndSendDeadlineReminders() {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(
        now.getTime() + 24 * 60 * 60 * 1000
      );
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Tasks due in 24 hours
      const tasksDueIn24Hours = await Task.find({
        dueDate: { $gte: now, $lte: twentyFourHoursFromNow },
        status: { $nin: ["completed", "cancelled"] },
      }).populate("assignedTo createdBy client department");

      for (const task of tasksDueIn24Hours) {
        const hoursUntilDeadline = Math.ceil(
          (new Date(task.dueDate) - now) / (1000 * 60 * 60)
        );
        await this.sendDeadlineReminderNotification(task, hoursUntilDeadline);
      }

      // Tasks due in 2 hours
      const tasksDueIn2Hours = await Task.find({
        dueDate: { $gte: now, $lte: twoHoursFromNow },
        status: { $nin: ["completed", "cancelled"] },
      }).populate("assignedTo createdBy client department");

      for (const task of tasksDueIn2Hours) {
        const hoursUntilDeadline = Math.ceil(
          (new Date(task.dueDate) - now) / (1000 * 60 * 60)
        );
        if (hoursUntilDeadline <= 2) {
          await this.sendDeadlineReminderNotification(task, hoursUntilDeadline);
        }
      }

      console.log(
        `Sent deadline reminders for ${
          tasksDueIn24Hours.length + tasksDueIn2Hours.length
        } tasks`
      );
    } catch (error) {
      console.error("Error checking deadline reminders:", error);
    }
  }
}

module.exports = new NotificationService();
