/**
 * Backup service for automated database backups with retention policies
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { appLogger, logSecurityEvent, SECURITY_EVENTS } = require('../utils/logger');

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

/**
 * Create a database backup
 * @returns {Promise<string>} - Path to the created backup file
 */
const createBackup = async () => {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.gz`;
      const backupPath = path.join(backupsDir, backupFileName);
      
      // Get MongoDB URI from environment
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MongoDB URI not found in environment variables');
      }
      
      // Extract database name from URI
      const dbName = process.env.DB_NAME || mongoUri.split('/').pop().split('?')[0];
      
      // Create backup using mongodump
      const mongodump = spawn('mongodump', [
        `--uri=${mongoUri}`,
        `--archive=${backupPath}`,
        '--gzip'
      ]);
      
      mongodump.stdout.on('data', (data) => {
        appLogger.debug(`mongodump stdout: ${data}`);
      });
      
      mongodump.stderr.on('data', (data) => {
        appLogger.debug(`mongodump stderr: ${data}`);
      });
      
      mongodump.on('close', (code) => {
        if (code === 0) {
          appLogger.info(`Backup created successfully: ${backupFileName}`);
          logSecurityEvent(
            'DATABASE_BACKUP_CREATED',
            { backupFile: backupFileName }
          );
          resolve(backupPath);
        } else {
          reject(new Error(`mongodump process exited with code ${code}`));
        }
      });
      
      mongodump.on('error', (err) => {
        reject(new Error(`Failed to start mongodump: ${err.message}`));
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Apply retention policy to backups
 * @param {number} daysToKeep - Number of days to keep backups
 * @returns {Promise<number>} - Number of deleted backup files
 */
const applyRetentionPolicy = async (daysToKeep = 30) => {
  try {
    const files = fs.readdirSync(backupsDir);
    const now = new Date();
    let deletedCount = 0;
    
    for (const file of files) {
      if (!file.startsWith('backup-')) continue;
      
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      const fileDate = new Date(stats.mtime);
      const diffDays = (now - fileDate) / (1000 * 60 * 60 * 24);
      
      if (diffDays > daysToKeep) {
        fs.unlinkSync(filePath);
        deletedCount++;
        appLogger.info(`Deleted old backup: ${file}`);
      }
    }
    
    return deletedCount;
  } catch (error) {
    appLogger.error(`Error applying retention policy: ${error.message}`);
    throw error;
  }
};

/**
 * Restore database from backup file
 * @param {string} backupFilePath - Path to backup file
 * @returns {Promise<boolean>} - True if restore was successful
 */
const restoreBackup = async (backupFilePath) => {
  return new Promise((resolve, reject) => {
    try {
      // Get MongoDB URI from environment
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MongoDB URI not found in environment variables');
      }
      
      // Restore backup using mongorestore
      const mongorestore = spawn('mongorestore', [
        `--uri=${mongoUri}`,
        `--archive=${backupFilePath}`,
        '--gzip',
        '--drop' // Drop collections before restoring
      ]);
      
      mongorestore.stdout.on('data', (data) => {
        appLogger.debug(`mongorestore stdout: ${data}`);
      });
      
      mongorestore.stderr.on('data', (data) => {
        appLogger.debug(`mongorestore stderr: ${data}`);
      });
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          appLogger.info(`Restore completed successfully from: ${path.basename(backupFilePath)}`);
          logSecurityEvent(
            'DATABASE_RESTORE_COMPLETED',
            { backupFile: path.basename(backupFilePath) },
            'warn'
          );
          resolve(true);
        } else {
          reject(new Error(`mongorestore process exited with code ${code}`));
        }
      });
      
      mongorestore.on('error', (err) => {
        reject(new Error(`Failed to start mongorestore: ${err.message}`));
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * List available backups
 * @returns {Array<Object>} - List of backup files with metadata
 */
const listBackups = () => {
  try {
    const files = fs.readdirSync(backupsDir);
    const backups = [];
    
    for (const file of files) {
      if (!file.startsWith('backup-')) continue;
      
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      
      backups.push({
        filename: file,
        path: filePath,
        size: stats.size,
        createdAt: stats.mtime
      });
    }
    
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    appLogger.error(`Error listing backups: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createBackup,
  applyRetentionPolicy,
  restoreBackup,
  listBackups
};