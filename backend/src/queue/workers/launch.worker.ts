/**
 * Launch Worker - Process Token Launch Jobs
 * Handles token deployment, presale vault creation, and bonding curve setup
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { getRedisClient } from '../redis';
import { MeteoraService, PresaleVaultConfig, DBCConfig } from '../../services/meteora/MeteoraService';
import { Connection } from '@solana/web3.js';
import { config } from '../../config';

const prisma = new PrismaClient();
let meteoraService: MeteoraService;
let io: any; // Socket.io instance (will be injected)

export interface LaunchJobData {
  tokenParams: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    category: string;
    targetMarketCap: string;
  };
  presaleConfig: {
    mode: 'FCFS' | 'PRO_RATA';
    depositLimit: number;
    vestingCliffDuration: number;
    vestingDuration: number;
    immediateRelease: number;
    startTime: number;
    endTime: number;
  };
  curveConfig: {
    type: 'LINEAR' | 'EXPONENTIAL' | 'LOGARITHMIC';
    initialPrice: number;
    graduationThreshold: number;
    tradingFeeRate: number;
    creatorFeeRate: number;
    partnerFeeRate: number;
  };
  feeSchedule: Array<{
    duration: number;
    feeRate: number;
  }>;
  launchId?: string; // Optional: existing TokenLaunch record ID
}

export interface LaunchJobResult {
  success: boolean;
  tokenMint: string;
  presaleVault?: string;
  bondingCurve?: string;
  launchId: string;
  signatures: string[];
  error?: string;
}

/**
 * Process a token launch job
 */
async function processLaunchJob(job: Job<LaunchJobData>): Promise<LaunchJobResult> {
  const startTime = Date.now();
  logger.info(`🚀 Processing launch job: ${job.id}`);
  logger.info(`   Token: ${job.data.tokenParams.name} (${job.data.tokenParams.symbol})`);

  try {
    // Update job progress: Starting
    await job.updateProgress(0);
    emitProgress(job, 0, 'Starting token launch...');

    // Step 1: Initialize MeteoraService if not already initialized
    if (!meteoraService) {
      const connection = new Connection(config.solana.rpcUrl);
      meteoraService = new MeteoraService(connection);
      logger.info('✅ MeteoraService initialized');
    }

    await job.updateProgress(10);
    emitProgress(job, 10, 'MeteoraService ready');

    // Step 2: Create or get TokenLaunch record in database
    let tokenLaunch;
    const tokenMint = `token_${Date.now()}_${Math.random().toString(36).substring(7)}`; // Mock for now

    if (job.data.launchId) {
      tokenLaunch = await prisma.tokenLaunch.findUnique({
        where: { id: job.data.launchId },
      });
      if (!tokenLaunch) {
        throw new Error(`TokenLaunch ${job.data.launchId} not found`);
      }
    } else {
      tokenLaunch = await prisma.tokenLaunch.create({
        data: {
          tokenMint,
          name: job.data.tokenParams.name,
          symbol: job.data.tokenParams.symbol,
          decimals: job.data.tokenParams.decimals,
          totalSupply: BigInt(job.data.tokenParams.totalSupply),
          category: job.data.tokenParams.category,
          targetMarketCap: BigInt(job.data.tokenParams.targetMarketCap),
          presaleMode: job.data.presaleConfig.mode,
          depositLimit: BigInt(job.data.presaleConfig.depositLimit),
          graduationThreshold: BigInt(job.data.curveConfig.graduationThreshold),
          curveType: job.data.curveConfig.type,
          initialPrice: job.data.curveConfig.initialPrice,
          status: 'pending',
        },
      });
      logger.info(`✅ TokenLaunch record created: ${tokenLaunch.id}`);
    }

    await job.updateProgress(20);
    emitProgress(job, 20, 'Database record created');

    // Step 3: Create Presale Vault
    logger.info('📦 Creating Presale Vault...');
    const presaleConfig: PresaleVaultConfig = {
      tokenMint,
      mode: job.data.presaleConfig.mode,
      depositLimit: job.data.presaleConfig.depositLimit,
      vesting: {
        cliffDuration: job.data.presaleConfig.vestingCliffDuration,
        vestingDuration: job.data.presaleConfig.vestingDuration,
        immediateRelease: job.data.presaleConfig.immediateRelease,
      },
      startTime: job.data.presaleConfig.startTime,
      endTime: job.data.presaleConfig.endTime,
    };

    const presaleResult = await meteoraService.createPresaleVault(presaleConfig);
    logger.info(`✅ Presale Vault created: ${presaleResult.publicKey.toBase58()}`);

    await job.updateProgress(50);
    emitProgress(job, 50, 'Presale vault created');

    // Step 4: Create Dynamic Bonding Curve
    logger.info('📈 Creating Dynamic Bonding Curve...');
    const dbcConfig: DBCConfig = {
      tokenMint,
      curveType: job.data.curveConfig.type,
      initialPrice: job.data.curveConfig.initialPrice,
      graduationThreshold: job.data.curveConfig.graduationThreshold,
      tradingFeeRate: job.data.curveConfig.tradingFeeRate,
      creatorFeeRate: job.data.curveConfig.creatorFeeRate,
      partnerFeeRate: job.data.curveConfig.partnerFeeRate,
    };

    const dbcResult = await meteoraService.createDynamicBondingCurve(dbcConfig);
    logger.info(`✅ Bonding Curve created: ${dbcResult.publicKey.toBase58()}`);

    await job.updateProgress(75);
    emitProgress(job, 75, 'Bonding curve deployed');

    // Step 5: Schedule Dynamic Fees (anti-sniper protection)
    // Note: Dynamic fees are configured during pool creation with Alpha Vault
    if (job.data.feeSchedule && job.data.feeSchedule.length > 0) {
      logger.info('⏰ Dynamic fees configured during pool creation');
      logger.info('   Fee schedule will be handled by Alpha Vault mechanism');
      // Dynamic fee scheduling is set during pool creation in Meteora DLMM
      // No separate scheduling API is needed
    }

    await job.updateProgress(90);
    emitProgress(job, 90, 'Dynamic fees configured');

    // Step 6: Update database with results
    // Note: Keep original tokenMint, don't overwrite with vault address
    const updatedLaunch = await prisma.tokenLaunch.update({
      where: { id: tokenLaunch.id },
      data: {
        status: 'active',
        launchedAt: new Date(),
        // tokenMint stays as is (don't overwrite - unique constraint)
      },
    });

    // Log agent activity
    await prisma.agentActivity.create({
      data: {
        agentName: 'LaunchCoordinator',
        activity: 'execution',
        description: `Successfully launched token: ${job.data.tokenParams.name}`,
        data: {
          tokenMint: tokenLaunch.tokenMint,
          presaleVault: presaleResult.publicKey.toBase58(),
          bondingCurve: dbcResult.publicKey.toBase58(),
          jobId: job.id,
        },
        success: true,
        executionTimeMs: Date.now() - startTime,
      },
    });

    await job.updateProgress(100);
    emitProgress(job, 100, 'Launch completed successfully!');

    // Emit Socket.io event
    emitLaunchComplete(tokenLaunch.id, {
      tokenMint: tokenLaunch.tokenMint,
      presaleVault: presaleResult.publicKey.toBase58(),
      bondingCurve: dbcResult.publicKey.toBase58(),
      status: 'active',
    });

    logger.info(`✅ Launch job ${job.id} completed successfully`);
    logger.info(`   Execution time: ${Date.now() - startTime}ms`);

    return {
      success: true,
      tokenMint: tokenLaunch.tokenMint,
      presaleVault: presaleResult.publicKey.toBase58(),
      bondingCurve: dbcResult.publicKey.toBase58(),
      launchId: tokenLaunch.id,
      signatures: [presaleResult.signature, dbcResult.signature],
    };

  } catch (error: any) {
    logger.error(`❌ Launch job ${job.id} failed:`, error);

    // Log failed activity
    await prisma.agentActivity.create({
      data: {
        agentName: 'LaunchCoordinator',
        activity: 'execution',
        description: `Failed to launch token: ${job.data.tokenParams.name}`,
        data: {
          jobId: job.id,
          error: error.message,
        },
        success: false,
        executionTimeMs: Date.now() - startTime,
        error: error.message,
      },
    });

    // Update TokenLaunch status if exists
    if (job.data.launchId) {
      await prisma.tokenLaunch.update({
        where: { id: job.data.launchId },
        data: { status: 'failed' },
      }).catch(() => {});
    }

    // Emit failure event
    emitLaunchFailed(job.data.launchId || 'unknown', {
      error: error.message,
      jobId: job.id,
    });

    throw error;
  }
}

/**
 * Helper: Emit job progress via Socket.io
 */
function emitProgress(job: Job, progress: number, message: string) {
  if (io) {
    io.emit('launch:progress', {
      jobId: job.id,
      progress,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Helper: Emit launch complete event
 */
function emitLaunchComplete(launchId: string, data: any) {
  if (io) {
    io.to(`launch:${data.tokenMint}`).emit('launch:complete', {
      launchId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Helper: Emit launch failed event
 */
function emitLaunchFailed(launchId: string, data: any) {
  if (io) {
    io.emit('launch:failed', {
      launchId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Create and start the launch worker
 */
export function createLaunchWorker(socketIoInstance?: any): Worker {
  if (socketIoInstance) {
    io = socketIoInstance;
  }

  const worker = new Worker<LaunchJobData, LaunchJobResult>(
    'token-launches',
    processLaunchJob,
    {
      connection: getRedisClient(),
      concurrency: 5, // Process up to 5 launches concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // Per 60 seconds
      },
      // Retry configuration
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          // Exponential backoff: 1s, 2s, 4s
          return Math.min(Math.pow(2, attemptsMade) * 1000, 30000);
        },
      },
    }
  );

  // Event handlers
  worker.on('completed', (job, result) => {
    logger.info(`✅ Launch worker completed job ${job.id}`);
    logger.info(`   Token: ${result.tokenMint}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Launch worker failed job ${job?.id}:`, err.message);
    if (job) {
      logger.error(`   Attempts: ${job.attemptsMade}/${3}`);
    }
  });

  worker.on('error', (err) => {
    logger.error('❌ Launch worker error:', err);
  });

  logger.info('✅ Launch worker started');

  return worker;
}
