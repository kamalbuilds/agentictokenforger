/**
 * Database Connection Management
 * PostgreSQL connection with Prisma ORM
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

export async function connectDatabase(): Promise<PrismaClient> {
  try {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });

    await prisma.$connect();
    logger.info('✅ PostgreSQL connected successfully');

    return prisma;
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

export function getDatabaseClient(): PrismaClient {
  if (!prisma) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
}

// Extend connectDatabase with close method
connectDatabase.close = disconnectDatabase;
