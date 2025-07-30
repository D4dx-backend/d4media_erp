const cron = require('node-cron');
const notificationService = require('./notificationService');
const backupService = require('./backupService');
const { appLogger } = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  // Start all scheduled jobs
  start() {
    appLogger.info('Starting scheduler service...');
    
    // Check for overdue tasks every hour
    const overdueJob = cron.schedule('0 * * * *', async () => {
      appLogger.info('Running overdue task check...');
      await notificationService.checkAndNotifyOverdueTasks();
    }, {
      scheduled: false
    });

    // Check for deadline reminders every 30 minutes
    const deadlineJob = cron.schedule('*/30 * * * *', async () => {
      appLogger.info('Running deadline reminder check...');
      await notificationService.checkAndSendDeadlineReminders();
    }, {
      scheduled: false
    });

    // Run database backup daily at 3:00 AM
    const backupJob = cron.schedule('0 3 * * *', async () => {
      appLogger.info('Running scheduled database backup...');
      try {
        await backupService.createBackup();
        // Apply retention policy - keep backups for 30 days
        const deletedCount = await backupService.applyRetentionPolicy(30);
        appLogger.info(`Applied backup retention policy: ${deletedCount} old backups removed`);
      } catch (error) {
        appLogger.error(`Scheduled backup failed: ${error.message}`);
      }
    }, {
      scheduled: false
    });

    // Start the jobs
    overdueJob.start();
    deadlineJob.start();
    backupJob.start();

    this.jobs.push(overdueJob, deadlineJob, backupJob);
    
    appLogger.info('Scheduler service started successfully');
  }

  // Stop all scheduled jobs
  stop() {
    appLogger.info('Stopping scheduler service...');
    this.jobs.forEach(job => job.destroy());
    this.jobs = [];
    appLogger.info('Scheduler service stopped');
  }

  // Get status of all jobs
  getStatus() {
    return {
      totalJobs: this.jobs.length,
      runningJobs: this.jobs.filter(job => job.running).length
    };
  }
}

module.exports = new SchedulerService();