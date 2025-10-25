/**
 * Redis Connection and Queue Management
 * BullMQ for agent task processing
 */

import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisClient: Redis;
let launchQueue: Queue;
let liquidityQueue: Queue;
let riskQueue: Queue;

export async function initializeRedis(): Promise<void> {
  try {
    // Create Redis connection
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('❌ Redis connection error:', error);
    });

    // Initialize BullMQ queues
    launchQueue = new Queue('token-launches', {
      connection: redisClient,
    });

    liquidityQueue = new Queue('liquidity-management', {
      connection: redisClient,
    });

    riskQueue = new Queue('risk-analysis', {
      connection: redisClient,
    });

    logger.info('✅ BullMQ queues initialized');

    // Initialize workers
    initializeWorkers();

  } catch (error) {
    logger.error('❌ Failed to initialize Redis:', error);
    throw error;
  }
}

function initializeWorkers() {
  // Launch Queue Worker
  new Worker('token-launches', async (job) => {
    logger.info(`Processing launch job: ${job.id}`);

    // Job would be processed by LaunchCoordinatorAgent
    const { tokenParams, strategy } = job.data;

    // Execute launch
    logger.info(`Launching token: ${tokenParams.name}`);

    return {
      success: true,
      tokenMint: 'MOCK_TOKEN_MINT',
    };
  }, {
    connection: redisClient,
  });

  // Liquidity Queue Worker
  new Worker('liquidity-management', async (job) => {
    logger.info(`Processing liquidity job: ${job.id}`);

    // Job would be processed by LiquidityOptimizerAgent
    const { action, positionId } = job.data;

    logger.info(`Executing ${action} for position: ${positionId}`);

    return {
      success: true,
      action,
    };
  }, {
    connection: redisClient,
  });

  // Risk Queue Worker
  new Worker('risk-analysis', async (job) => {
    logger.info(`Processing risk analysis job: ${job.id}`);

    // Job would be processed by RiskAnalyzerAgent
    const { tokenAddress } = job.data;

    logger.info(`Analyzing risk for token: ${tokenAddress}`);

    return {
      success: true,
      riskScore: 7.5,
    };
  }, {
    connection: redisClient,
  });

  logger.info('✅ Queue workers initialized');
}

export function getRedisClient(): Redis {
  return redisClient;
}

export function getLaunchQueue(): Queue {
  return launchQueue;
}

export function getLiquidityQueue(): Queue {
  return liquidityQueue;
}

export function getRiskQueue(): Queue {
  return riskQueue;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

// Extend initializeRedis with close method
initializeRedis.close = disconnectRedis;
