/**
 * Scheduled Cleanup Job Script
 * 
 * This script sets up a scheduled job to clean up orphaned product images.
 * 
 * Usage:
 * 1. Install node-cron: npm install node-cron @types/node-cron
 * 2. Run this script: ts-node server/scripts/scheduleCleanupJob.ts
 * 3. Or integrate into your main server.ts file
 * 
 * Cron Schedule Examples:
 * - Daily at 2 AM: '0 2 * * *'
 * - Every 6 hours: '0 */6 * * *'
 * - Weekly on Sunday at 3 AM: '0 3 * * 0'
 */

import cron from 'node-cron';
import { connectDatabase } from '../src/config/database';
import { cleanupOrphanedImages } from '../src/jobs/cleanupOrphanedImages';

// Schedule cleanup job to run daily at 2 AM
const CLEANUP_SCHEDULE = process.env.CLEANUP_SCHEDULE || '0 2 * * *';

async function startCleanupScheduler() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('Database connected for cleanup scheduler');

    // Schedule the cleanup job
    cron.schedule(CLEANUP_SCHEDULE, async () => {
      console.log(`[${new Date().toISOString()}] Starting scheduled cleanup job...`);
      try {
        await cleanupOrphanedImages();
        console.log(`[${new Date().toISOString()}] Cleanup job completed successfully`);
      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Cleanup job failed:`, error.message);
      }
    });

    console.log(`Cleanup job scheduled: ${CLEANUP_SCHEDULE}`);
    console.log('Cleanup scheduler started. Press Ctrl+C to stop.');
  } catch (error: any) {
    console.error('Failed to start cleanup scheduler:', error);
    process.exit(1);
  }
}

// Run cleanup immediately on startup (optional)
if (process.env.RUN_CLEANUP_ON_START === 'true') {
  connectDatabase()
    .then(() => cleanupOrphanedImages())
    .then(() => {
      console.log('Initial cleanup completed');
      startCleanupScheduler();
    })
    .catch((error) => {
      console.error('Initial cleanup failed:', error);
      process.exit(1);
    });
} else {
  startCleanupScheduler();
}

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\nCleanup scheduler stopped');
  process.exit(0);
});

