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
    redisClient = new Redis(config.redis.url || 'redis://localhost:6379', {
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
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs for debugging
        },
      },
    });

    liquidityQueue = new Queue('liquidity-management', {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100,
        },
        removeOnFail: {
          count: 500,
        },
      },
    });

    riskQueue = new Queue('risk-analysis', {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 500,
        },
        removeOnComplete: {
          count: 200,
        },
        removeOnFail: {
          count: 300,
        },
      },
    });

    logger.info('✅ BullMQ queues initialized');
    logger.info('   Note: Workers are started separately via startWorkers()');

  } catch (error) {
    logger.error('❌ Failed to initialize Redis:', error);
    throw error;
  }
}

// Workers are now initialized separately in src/queue/workers/index.ts
// This allows for better separation of concerns and graceful shutdown handling

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
