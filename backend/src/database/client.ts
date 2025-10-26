/**
 * Prisma Database Client Singleton
 *
 * This module provides a single instance of PrismaClient across the application
 * to avoid multiple database connections and ensure efficient connection pooling.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Import existing connection for compatibility
import { getDatabaseClient } from './connection';

// Global type augmentation for Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

/**
 * Prisma Client - uses existing connection if available
 */
let _prisma: PrismaClient | null = null;

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) {
      try {
        // Try to get existing client from connection.ts
        _prisma = getDatabaseClient();
      } catch {
        // Fall back to creating new client
        _prisma = globalForPrisma.prisma ?? new PrismaClient({
          log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        });

        // Prevent multiple instances in development (hot reload)
        if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = _prisma;
        }
      }
    }
    return (_prisma as any)[prop];
  },
});

/**
 * Database health check utility
 * Tests connection and query execution
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    logger.info(`Database health check passed (${latency}ms)`);

    return {
      connected: true,
      latency,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);

    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Graceful shutdown handler
 * Disconnects Prisma client properly
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
    throw error;
  }
}

/**
 * BigInt conversion utilities
 * Prisma uses BigInt but API typically uses numbers/strings
 */
export const bigIntUtils = {
  /**
   * Convert BigInt to number (safe for values <= Number.MAX_SAFE_INTEGER)
   */
  toNumber(value: bigint | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return Number(value);
  },

  /**
   * Convert BigInt to string (safe for all values)
   */
  toString(value: bigint | null | undefined): string {
    if (value === null || value === undefined) return '0';
    return value.toString();
  },

  /**
   * Convert number/string to BigInt
   */
  fromValue(value: number | string | bigint): bigint {
    if (typeof value === 'bigint') return value;
    return BigInt(value);
  },

  /**
   * Convert object with BigInt fields to JSON-safe object
   */
  toJSON<T extends Record<string, any>>(obj: T): any {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        typeof value === 'bigint' ? value.toString() : value,
      ])
    );
  },
};

/**
 * Transaction wrapper with retry logic
 */
export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Transaction failed');
      logger.warn(`Transaction attempt ${attempt} failed:`, lastError.message);

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw lastError;
}

// Log initialization
logger.info('Prisma client initialized');
