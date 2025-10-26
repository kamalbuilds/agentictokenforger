/**
 * Liquidity Worker - Process Liquidity Management Jobs
 * Handles adding liquidity, rebalancing positions, and harvesting fees
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { getRedisClient } from '../redis';
import { MeteoraService } from '../../services/meteora/MeteoraService';
import { Connection } from '@solana/web3.js';
import { config } from '../../config';

const prisma = new PrismaClient();
let meteoraService: MeteoraService;
let io: any; // Socket.io instance

export type LiquidityJobType = 'add-liquidity' | 'rebalance-position' | 'harvest-fees' | 'close-position';

export interface AddLiquidityJobData {
  type: 'add-liquidity';
  tokenLaunchId: string;
  poolAddress: string;
  lowerPrice: number;
  upperPrice: number;
  amount0: string;
  amount1: string;
}

export interface RebalanceJobData {
  type: 'rebalance-position';
  positionId: string;
  newLowerPrice: number;
  newUpperPrice: number;
  strategy: 'aggressive' | 'balanced' | 'conservative';
}

export interface HarvestFeesJobData {
  type: 'harvest-fees';
  positionId: string;
}

export interface ClosePositionJobData {
  type: 'close-position';
  positionId: string;
  reason: string;
}

export type LiquidityJobData = AddLiquidityJobData | RebalanceJobData | HarvestFeesJobData | ClosePositionJobData;

export interface LiquidityJobResult {
  success: boolean;
  type: LiquidityJobType;
  positionId?: string;
  feesHarvested?: string;
  signature?: string;
  error?: string;
}

/**
 * Process liquidity management job
 */
async function processLiquidityJob(job: Job<LiquidityJobData>): Promise<LiquidityJobResult> {
  const startTime = Date.now();
  logger.info(`💧 Processing liquidity job: ${job.id}`);
  logger.info(`   Type: ${job.data.type}`);

  try {
    // Initialize MeteoraService if needed
    if (!meteoraService) {
      const connection = new Connection(config.solana.rpcUrl);
      meteoraService = new MeteoraService(connection);
    }

    await job.updateProgress(10);

    // Route to appropriate handler based on job type
    let result: LiquidityJobResult;

    switch (job.data.type) {
      case 'add-liquidity':
        result = await handleAddLiquidity(job as Job<AddLiquidityJobData>);
        break;
      case 'rebalance-position':
        result = await handleRebalancePosition(job as Job<RebalanceJobData>);
        break;
      case 'harvest-fees':
        result = await handleHarvestFees(job as Job<HarvestFeesJobData>);
        break;
      case 'close-position':
        result = await handleClosePosition(job as Job<ClosePositionJobData>);
        break;
      default:
        throw new Error(`Unknown liquidity job type: ${(job.data as any).type}`);
    }

    // Log agent activity
    await prisma.agentActivity.create({
      data: {
        agentName: 'LiquidityOptimizer',
        activity: 'execution',
        description: `Successfully executed ${job.data.type}`,
        data: {
          jobId: job.id,
          type: result.type,
          success: result.success,
          positionId: result.positionId,
        },
        success: true,
        executionTimeMs: Date.now() - startTime,
      },
    });

    await job.updateProgress(100);
    logger.info(`✅ Liquidity job ${job.id} completed successfully`);

    return result;

  } catch (error: any) {
    logger.error(`❌ Liquidity job ${job.id} failed:`, error);

    // Log failed activity
    await prisma.agentActivity.create({
      data: {
        agentName: 'LiquidityOptimizer',
        activity: 'execution',
        description: `Failed to execute ${job.data.type}`,
        data: {
          jobId: job.id,
          errorMessage: error.message,
          type: job.data.type,
        },
        success: false,
        executionTimeMs: Date.now() - startTime,
        error: error.message,
      },
    });

    throw error;
  }
}

/**
 * Handle add liquidity job
 */
async function handleAddLiquidity(job: Job<AddLiquidityJobData>): Promise<LiquidityJobResult> {
  const { tokenLaunchId, poolAddress, lowerPrice, upperPrice, amount0, amount1 } = job.data;

  logger.info('💰 Adding liquidity to DAMM v2 pool...');

  await job.updateProgress(25);

  // Add liquidity via MeteoraService
  const result = await meteoraService.addLiquidityToDAMM({
    poolAddress: new PublicKey(poolAddress),
    lowerPrice,
    upperPrice,
    amount0,
    amount1,
  });

  await job.updateProgress(60);

  // Create LiquidityPosition record
  const position = await prisma.liquidityPosition.create({
    data: {
      positionNft: result.publicKey.toBase58(),
      poolAddress,
      tokenLaunchId,
      lowerPrice,
      upperPrice,
      liquidityAmount: BigInt(amount0), // Simplified
      status: 'active',
      aiManaged: true,
    },
  });

  logger.info(`✅ Liquidity position created: ${position.id}`);

  // Emit Socket.io event
  emitLiquidityUpdate(position.id, {
    type: 'position_created',
    positionId: position.id,
    positionNft: result.publicKey.toBase58(),
    signature: result.signature,
  });

  await job.updateProgress(90);

  return {
    success: true,
    type: 'add-liquidity',
    positionId: position.id,
    signature: result.signature,
  };
}

/**
 * Handle rebalance position job
 */
async function handleRebalancePosition(job: Job<RebalanceJobData>): Promise<LiquidityJobResult> {
  const { positionId, newLowerPrice, newUpperPrice, strategy } = job.data;

  logger.info(`🔄 Rebalancing position: ${positionId}`);
  logger.info(`   Strategy: ${strategy}`);

  await job.updateProgress(25);

  // Get existing position
  const position = await prisma.liquidityPosition.findUnique({
    where: { id: positionId },
    include: { tokenLaunch: true },
  });

  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  // Update status
  await prisma.liquidityPosition.update({
    where: { id: positionId },
    data: { status: 'rebalancing' },
  });

  await job.updateProgress(40);

  // Close existing position
  const closeResult = await meteoraService.closeDAMMPosition(
    new PublicKey(position.positionNft)
  );

  logger.info(`✅ Old position closed: ${closeResult.signature}`);

  await job.updateProgress(60);

  // Open new position with adjusted range
  const addResult = await meteoraService.addLiquidityToDAMM({
    poolAddress: new PublicKey(position.poolAddress),
    lowerPrice: newLowerPrice,
    upperPrice: newUpperPrice,
    amount0: position.liquidityAmount.toString(),
    amount1: position.liquidityAmount.toString(),
  });

  logger.info(`✅ New position created: ${addResult.publicKey.toBase58()}`);

  await job.updateProgress(80);

  // Update position record
  const updatedPosition = await prisma.liquidityPosition.update({
    where: { id: positionId },
    data: {
      positionNft: addResult.publicKey.toBase58(),
      lowerPrice: newLowerPrice,
      upperPrice: newUpperPrice,
      status: 'active',
      lastRebalanceAt: new Date(),
      rebalanceCount: { increment: 1 },
    },
  });

  // Emit Socket.io event
  emitLiquidityUpdate(positionId, {
    type: 'position_rebalanced',
    positionId,
    newLowerPrice,
    newUpperPrice,
    strategy,
  });

  await job.updateProgress(95);

  return {
    success: true,
    type: 'rebalance-position',
    positionId,
    signature: addResult.signature,
  };
}

/**
 * Handle harvest fees job
 */
async function handleHarvestFees(job: Job<HarvestFeesJobData>): Promise<LiquidityJobResult> {
  const { positionId } = job.data;

  logger.info(`💸 Harvesting fees for position: ${positionId}`);

  await job.updateProgress(25);

  // Get position
  const position = await prisma.liquidityPosition.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  await job.updateProgress(40);

  // Harvest fees via MeteoraService
  const result = await meteoraService.harvestFees(
    new PublicKey(position.positionNft),
    new PublicKey(position.poolAddress)
  );

  logger.info(`✅ Harvested ${result.amount} tokens`);

  await job.updateProgress(70);

  // Update position with earned fees
  await prisma.liquidityPosition.update({
    where: { id: positionId },
    data: {
      feesEarned: { increment: BigInt(result.amount) },
    },
  });

  // Calculate APR (simplified calculation)
  const apr = calculateAPR(position, result.amount);

  await prisma.liquidityPosition.update({
    where: { id: positionId },
    data: { apr },
  });

  // Emit Socket.io event
  emitLiquidityUpdate(positionId, {
    type: 'fees_harvested',
    positionId,
    amount: result.amount,
    apr,
  });

  await job.updateProgress(95);

  return {
    success: true,
    type: 'harvest-fees',
    positionId,
    feesHarvested: result.amount,
    signature: result.signature,
  };
}

/**
 * Handle close position job
 */
async function handleClosePosition(job: Job<ClosePositionJobData>): Promise<LiquidityJobResult> {
  const { positionId, reason } = job.data;

  logger.info(`🔚 Closing position: ${positionId}`);
  logger.info(`   Reason: ${reason}`);

  await job.updateProgress(25);

  // Get position
  const position = await prisma.liquidityPosition.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  await job.updateProgress(40);

  // Close position on-chain
  const result = await meteoraService.closeDAMMPosition(
    new PublicKey(position.positionNft)
  );

  logger.info(`✅ Position closed: ${result.signature}`);

  await job.updateProgress(70);

  // Update database
  await prisma.liquidityPosition.update({
    where: { id: positionId },
    data: { status: 'closed' },
  });

  // Emit Socket.io event
  emitLiquidityUpdate(positionId, {
    type: 'position_closed',
    positionId,
    reason,
  });

  await job.updateProgress(95);

  return {
    success: true,
    type: 'close-position',
    positionId,
    signature: result.signature,
  };
}

/**
 * Helper: Calculate APR (simplified)
 */
function calculateAPR(position: any, feesEarned: string): number {
  // Simplified APR calculation
  // In production, this would use time-weighted returns
  const fees = parseFloat(feesEarned);
  const liquidity = Number(position.liquidityAmount);

  if (liquidity === 0) return 0;

  const dailyReturn = fees / liquidity;
  const apr = dailyReturn * 365 * 100; // Annualized

  return Math.min(apr, 10000); // Cap at 10000%
}

/**
 * Helper: Emit liquidity update via Socket.io
 */
function emitLiquidityUpdate(positionId: string, data: any) {
  if (io) {
    io.to(`liquidity:${positionId}`).emit('liquidity:update', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Create and start the liquidity worker
 */
export function createLiquidityWorker(socketIoInstance?: any): Worker {
  if (socketIoInstance) {
    io = socketIoInstance;
  }

  const worker = new Worker<LiquidityJobData, LiquidityJobResult>(
    'liquidity-management',
    processLiquidityJob,
    {
      connection: getRedisClient(),
      concurrency: 5, // Process up to 5 liquidity operations concurrently
      limiter: {
        max: 20, // Max 20 jobs
        duration: 60000, // Per 60 seconds
      },
      // Retry on network errors
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          return Math.min(Math.pow(2, attemptsMade) * 1000, 15000);
        },
      },
    }
  );

  // Event handlers
  worker.on('completed', (job, result) => {
    logger.info(`✅ Liquidity worker completed job ${job.id}`);
    logger.info(`   Type: ${result.type}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Liquidity worker failed job ${job?.id}:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error('❌ Liquidity worker error:', err);
  });

  logger.info('✅ Liquidity worker started');

  return worker;
}
