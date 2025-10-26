/**
 * Queue Workers Index
 * Manages all BullMQ worker processes
 */

import { Worker } from 'bullmq';
import { logger } from '../../utils/logger';
import { createLaunchWorker } from './launch.worker';
import { createLiquidityWorker } from './liquidity.worker';
import { createRiskWorker } from './risk.worker';

let workers: Worker[] = [];
let io: any; // Socket.io instance

/**
 * Start all queue workers
 */
export async function startWorkers(socketIoInstance?: any): Promise<void> {
  logger.info('🚀 Starting queue workers...');

  if (socketIoInstance) {
    io = socketIoInstance;
  }

  try {
    // Create and start all workers
    const launchWorker = createLaunchWorker(io);
    const liquidityWorker = createLiquidityWorker(io);
    const riskWorker = createRiskWorker(io);

    workers = [launchWorker, liquidityWorker, riskWorker];

    logger.info('✅ All queue workers started successfully');
    logger.info(`   Active workers: ${workers.length}`);
    logger.info('   - Launch Worker (token-launches queue)');
    logger.info('   - Liquidity Worker (liquidity-management queue)');
    logger.info('   - Risk Worker (risk-analysis queue)');

    // Setup graceful shutdown handlers
    setupGracefulShutdown();

  } catch (error) {
    logger.error('❌ Failed to start workers:', error);
    throw error;
  }
}

/**
 * Stop all queue workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  logger.info('⏹️  Stopping queue workers...');

  try {
    // Close all workers in parallel
    await Promise.all(
      workers.map(async (worker) => {
        await worker.close();
        logger.info(`   Worker closed: ${worker.name}`);
      })
    );

    workers = [];
    logger.info('✅ All queue workers stopped successfully');

  } catch (error) {
    logger.error('❌ Error stopping workers:', error);
    throw error;
  }
}

/**
 * Get worker status
 */
export async function getWorkerStatus(): Promise<{
  workers: Array<{
    name: string;
    isRunning: boolean;
    isPaused: boolean;
  }>;
  totalWorkers: number;
}> {
  const workerStatus = await Promise.all(
    workers.map(async (worker) => ({
      name: worker.name,
      isRunning: await worker.isRunning(),
      isPaused: await worker.isPaused(),
    }))
  );

  return {
    workers: workerStatus,
    totalWorkers: workers.length,
  };
}

/**
 * Pause all workers
 */
export async function pauseWorkers(): Promise<void> {
  logger.info('⏸️  Pausing all workers...');

  await Promise.all(
    workers.map(async (worker) => {
      await worker.pause();
      logger.info(`   Worker paused: ${worker.name}`);
    })
  );

  logger.info('✅ All workers paused');
}

/**
 * Resume all workers
 */
export async function resumeWorkers(): Promise<void> {
  logger.info('▶️  Resuming all workers...');

  await Promise.all(
    workers.map(async (worker) => {
      await worker.resume();
      logger.info(`   Worker resumed: ${worker.name}`);
    })
  );

  logger.info('✅ All workers resumed');
}

/**
 * Setup graceful shutdown on process signals
 */
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received, shutting down workers gracefully...`);

    try {
      // Stop accepting new jobs
      await pauseWorkers();

      // Wait for active jobs to complete (with timeout)
      logger.info('⏳ Waiting for active jobs to complete...');
      await Promise.race([
        waitForActiveJobs(),
        new Promise((resolve) => setTimeout(resolve, 30000)), // 30s timeout
      ]);

      // Close all workers
      await stopWorkers();

      logger.info('✅ Workers shutdown complete');
    } catch (error) {
      logger.error('❌ Error during worker shutdown:', error);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

/**
 * Wait for all active jobs to complete
 */
async function waitForActiveJobs(): Promise<void> {
  const checkInterval = 1000; // Check every 1 second
  const maxWaitTime = 30000; // Max 30 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    // Check if workers are still processing jobs
    const activeStatus = await Promise.all(
      workers.map(async (worker) => {
        return await worker.isRunning();
      })
    );

    const hasActiveWorkers = activeStatus.some(status => status);

    if (!hasActiveWorkers) {
      logger.info('✅ All workers finished processing');
      return;
    }

    // Get approximate job counts from queue
    const totalActiveJobs = activeStatus.filter(Boolean).length;

    if (totalActiveJobs === 0) {
      logger.info('✅ All active jobs completed');
      return;
    }

    logger.info(`   Active jobs remaining: ${totalActiveJobs}`);
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  logger.warn('⚠️  Timeout reached, some jobs may still be active');
}

/**
 * Get worker metrics
 */
export async function getWorkerMetrics(): Promise<{
  [workerName: string]: {
    isRunning: boolean;
    isPaused: boolean;
    name: string;
  };
}> {
  const metrics: any = {};

  for (const worker of workers) {
    metrics[worker.name] = {
      name: worker.name,
      isRunning: await worker.isRunning(),
      isPaused: await worker.isPaused(),
    };
  }

  return metrics;
}

/**
 * Clean completed jobs older than specified age
 * Note: Uses queue.clean() instead of worker.clean()
 */
export async function cleanOldJobs(maxAge: number = 86400000): Promise<void> {
  logger.info(`🧹 Cleaning jobs older than ${maxAge / 1000 / 60} minutes...`);

  // Import queues for cleaning
  const { getLaunchQueue, getLiquidityQueue, getRiskQueue } = await import('../redis');

  try {
    const queues = [
      getLaunchQueue(),
      getLiquidityQueue(),
      getRiskQueue(),
    ];

    for (const queue of queues) {
      try {
        await queue.clean(maxAge, 1000, 'completed');
        await queue.clean(maxAge, 1000, 'failed');
        logger.info(`   Cleaned old jobs from: ${queue.name}`);
      } catch (error) {
        logger.error(`   Failed to clean jobs from ${queue.name}:`, error);
      }
    }

    logger.info('✅ Job cleanup complete');
  } catch (error) {
    logger.error('❌ Failed to clean jobs:', error);
  }
}

// Export worker instances for direct access if needed
export { workers };
