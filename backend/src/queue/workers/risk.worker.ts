/**
 * Risk Worker - Process Risk Analysis Jobs
 * Analyzes token launches for potential risks and creates alerts
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { PublicKey, Connection } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { getRedisClient } from '../redis';
import { config } from '../../config';

const prisma = new PrismaClient();
let connection: Connection;
let io: any; // Socket.io instance

export interface RiskJobData {
  type: 'analyze-risk';
  tokenAddress: string;
  tokenLaunchId: string;
  checkTypes?: ('rug_pull' | 'liquidity' | 'holder_concentration' | 'price_manipulation')[];
}

export interface RiskJobResult {
  success: boolean;
  tokenAddress: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    confidence: number;
  }>;
  indicators: {
    rugPullRisk: number;
    liquidityRisk: number;
    holderConcentration: number;
    priceVolatility: number;
    contractSafety: number;
  };
  error?: string;
}

/**
 * Process risk analysis job
 */
async function processRiskJob(job: Job<RiskJobData>): Promise<RiskJobResult> {
  const startTime = Date.now();
  logger.info(`🔍 Processing risk analysis job: ${job.id}`);
  logger.info(`   Token: ${job.data.tokenAddress}`);

  try {
    // Initialize Solana connection if needed
    if (!connection) {
      connection = new Connection(config.solana.rpcUrl);
    }

    await job.updateProgress(10);

    const { tokenAddress, tokenLaunchId, checkTypes } = job.data;

    // Step 1: Fetch on-chain data
    logger.info('📊 Fetching on-chain data...');
    const onChainData = await fetchOnChainData(tokenAddress);

    await job.updateProgress(30);

    // Step 2: Analyze risk indicators
    logger.info('🧮 Calculating risk indicators...');
    const indicators = await analyzeRiskIndicators(onChainData, checkTypes);

    await job.updateProgress(60);

    // Step 3: Calculate overall risk score (0-10 scale)
    const riskScore = calculateOverallRiskScore(indicators);
    const riskLevel = getRiskLevel(riskScore);

    logger.info(`   Risk Score: ${riskScore.toFixed(2)}/10`);
    logger.info(`   Risk Level: ${riskLevel}`);

    await job.updateProgress(75);

    // Step 4: Create risk alerts if needed
    const alerts = await createRiskAlerts(
      tokenLaunchId,
      tokenAddress,
      indicators,
      riskScore,
      riskLevel
    );

    await job.updateProgress(85);

    // Step 5: Update TokenLaunch with risk assessment
    await prisma.tokenLaunch.update({
      where: { id: tokenLaunchId },
      data: {
        riskScore,
        riskLevel,
      },
    });

    // Log agent activity
    await prisma.agentActivity.create({
      data: {
        agentName: 'RiskAnalyzer',
        activity: 'analysis',
        description: `Risk analysis completed for ${tokenAddress}`,
        data: {
          jobId: job.id,
          riskScore,
          riskLevel,
          indicators,
          alertCount: alerts.length,
        },
        success: true,
        executionTimeMs: Date.now() - startTime,
        confidenceScore: calculateConfidence(indicators),
      },
    });

    // Log ML prediction
    await prisma.mLPrediction.create({
      data: {
        modelName: 'risk_scoring',
        modelVersion: '1.0.0',
        input: { tokenAddress, indicators },
        prediction: { riskScore, riskLevel, alerts },
        confidence: calculateConfidence(indicators),
      },
    });

    await job.updateProgress(100);

    // Emit Socket.io events for high-risk alerts
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      emitRiskAlert(tokenAddress, {
        riskScore,
        riskLevel,
        alerts,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`✅ Risk analysis job ${job.id} completed`);
    logger.info(`   Found ${alerts.length} alerts`);

    return {
      success: true,
      tokenAddress,
      riskScore,
      riskLevel,
      alerts: alerts.map(alert => ({
        type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        confidence: alert.confidence,
      })),
      indicators,
    };

  } catch (error: any) {
    logger.error(`❌ Risk analysis job ${job.id} failed:`, error);

    // Log failed activity
    await prisma.agentActivity.create({
      data: {
        agentName: 'RiskAnalyzer',
        activity: 'analysis',
        description: `Risk analysis failed for ${job.data.tokenAddress}`,
        data: { jobId: job.id, error: error.message },
        success: false,
        executionTimeMs: Date.now() - startTime,
        error: error.message,
      },
    });

    throw error;
  }
}

/**
 * Fetch on-chain data for risk analysis
 */
async function fetchOnChainData(tokenAddress: string): Promise<any> {
  try {
    const tokenPubkey = new PublicKey(tokenAddress);

    // Fetch token account info
    const accountInfo = await connection.getAccountInfo(tokenPubkey);

    if (!accountInfo) {
      logger.warn(`⚠️ Token account not found: ${tokenAddress}`);
      return {
        exists: false,
        balance: 0,
        holders: [],
        liquidityPools: [],
      };
    }

    // Fetch token supply and holder data
    // In production, this would use actual Solana token program queries
    const mockData = {
      exists: true,
      balance: accountInfo.lamports,
      supply: 1000000000,
      holders: [
        { address: 'holder1', balance: 500000000, percentage: 50 },
        { address: 'holder2', balance: 200000000, percentage: 20 },
        { address: 'holder3', balance: 100000000, percentage: 10 },
      ],
      liquidityPools: [
        { address: 'pool1', liquidity: 100000, locked: false },
      ],
      transactions24h: 150,
      volume24h: 50000,
      priceHistory: [0.001, 0.0012, 0.0011, 0.0015], // Last 4 hours
    };

    return mockData;

  } catch (error: any) {
    logger.error('Failed to fetch on-chain data:', error);
    throw new Error(`On-chain data fetch failed: ${error.message}`);
  }
}

/**
 * Analyze risk indicators
 */
async function analyzeRiskIndicators(
  onChainData: any,
  checkTypes?: string[]
): Promise<RiskJobResult['indicators']> {

  // 1. Rug Pull Risk (0-10 scale)
  let rugPullRisk = 0;
  if (!checkTypes || checkTypes.includes('rug_pull')) {
    // Check liquidity lock
    const hasLockedLiquidity = onChainData.liquidityPools?.some((p: any) => p.locked);
    rugPullRisk += hasLockedLiquidity ? 0 : 3;

    // Check creator holdings
    const creatorHolding = onChainData.holders?.[0]?.percentage || 0;
    if (creatorHolding > 50) rugPullRisk += 4;
    else if (creatorHolding > 30) rugPullRisk += 2;
  }

  // 2. Liquidity Risk
  let liquidityRisk = 0;
  if (!checkTypes || checkTypes.includes('liquidity')) {
    const totalLiquidity = onChainData.liquidityPools?.reduce((sum: number, p: any) => sum + p.liquidity, 0) || 0;
    if (totalLiquidity < 10000) liquidityRisk = 8;
    else if (totalLiquidity < 50000) liquidityRisk = 5;
    else if (totalLiquidity < 100000) liquidityRisk = 3;
    else liquidityRisk = 1;
  }

  // 3. Holder Concentration Risk
  let holderConcentration = 0;
  if (!checkTypes || checkTypes.includes('holder_concentration')) {
    const top3Holdings = onChainData.holders?.slice(0, 3).reduce((sum: number, h: any) => sum + h.percentage, 0) || 0;
    if (top3Holdings > 80) holderConcentration = 9;
    else if (top3Holdings > 60) holderConcentration = 6;
    else if (top3Holdings > 40) holderConcentration = 3;
    else holderConcentration = 1;
  }

  // 4. Price Volatility Risk
  let priceVolatility = 0;
  if (!checkTypes || checkTypes.includes('price_manipulation')) {
    const prices = onChainData.priceHistory || [];
    if (prices.length >= 2) {
      const volatility = calculateVolatility(prices);
      if (volatility > 0.5) priceVolatility = 8; // >50% volatility
      else if (volatility > 0.3) priceVolatility = 5;
      else if (volatility > 0.15) priceVolatility = 3;
      else priceVolatility = 1;
    }
  }

  // 5. Contract Safety (simplified)
  const contractSafety = onChainData.exists ? 2 : 8;

  return {
    rugPullRisk,
    liquidityRisk,
    holderConcentration,
    priceVolatility,
    contractSafety,
  };
}

/**
 * Calculate overall risk score from indicators
 */
function calculateOverallRiskScore(indicators: RiskJobResult['indicators']): number {
  const weights = {
    rugPullRisk: 0.35,
    liquidityRisk: 0.25,
    holderConcentration: 0.2,
    priceVolatility: 0.15,
    contractSafety: 0.05,
  };

  const score =
    indicators.rugPullRisk * weights.rugPullRisk +
    indicators.liquidityRisk * weights.liquidityRisk +
    indicators.holderConcentration * weights.holderConcentration +
    indicators.priceVolatility * weights.priceVolatility +
    indicators.contractSafety * weights.contractSafety;

  return Math.min(Math.max(score, 0), 10);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 8) return 'CRITICAL';
  if (score >= 6) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}

/**
 * Create risk alerts in database
 */
async function createRiskAlerts(
  tokenLaunchId: string,
  tokenAddress: string,
  indicators: RiskJobResult['indicators'],
  riskScore: number,
  riskLevel: string
): Promise<any[]> {
  const alerts: any[] = [];

  // Rug pull risk alert
  if (indicators.rugPullRisk >= 6) {
    const alert = await prisma.riskAlert.create({
      data: {
        tokenLaunchId,
        alertType: 'rug_pull',
        severity: indicators.rugPullRisk >= 8 ? 'critical' : 'high',
        message: `High rug pull risk detected. Score: ${indicators.rugPullRisk.toFixed(1)}/10`,
        indicators: { rugPullRisk: indicators.rugPullRisk },
        confidence: 0.85,
      },
    });
    alerts.push(alert);
  }

  // Liquidity risk alert
  if (indicators.liquidityRisk >= 6) {
    const alert = await prisma.riskAlert.create({
      data: {
        tokenLaunchId,
        alertType: 'liquidity',
        severity: indicators.liquidityRisk >= 8 ? 'high' : 'medium',
        message: `Low liquidity detected. Score: ${indicators.liquidityRisk.toFixed(1)}/10`,
        indicators: { liquidityRisk: indicators.liquidityRisk },
        confidence: 0.9,
      },
    });
    alerts.push(alert);
  }

  // Holder concentration alert
  if (indicators.holderConcentration >= 7) {
    const alert = await prisma.riskAlert.create({
      data: {
        tokenLaunchId,
        alertType: 'suspicious_activity',
        severity: 'high',
        message: `High holder concentration risk. Score: ${indicators.holderConcentration.toFixed(1)}/10`,
        indicators: { holderConcentration: indicators.holderConcentration },
        confidence: 0.8,
      },
    });
    alerts.push(alert);
  }

  // Overall high risk alert
  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    const alert = await prisma.riskAlert.create({
      data: {
        tokenLaunchId,
        alertType: 'high_risk',
        severity: riskLevel === 'CRITICAL' ? 'critical' : 'high',
        message: `Overall ${riskLevel} risk level. Score: ${riskScore.toFixed(2)}/10`,
        indicators,
        confidence: 0.88,
      },
    });
    alerts.push(alert);
  }

  return alerts;
}

/**
 * Calculate price volatility
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

  return Math.sqrt(variance);
}

/**
 * Calculate confidence score
 */
function calculateConfidence(indicators: RiskJobResult['indicators']): number {
  // More data points = higher confidence
  const dataQuality = 0.85; // Would be calculated based on on-chain data completeness
  return dataQuality;
}

/**
 * Helper: Emit risk alert via Socket.io
 */
function emitRiskAlert(tokenAddress: string, data: any) {
  if (io) {
    io.to(`risk:${tokenAddress}`).emit('risk:alert', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Create and start the risk worker
 */
export function createRiskWorker(socketIoInstance?: any): Worker {
  if (socketIoInstance) {
    io = socketIoInstance;
  }

  const worker = new Worker<RiskJobData, RiskJobResult>(
    'risk-analysis',
    processRiskJob,
    {
      connection: getRedisClient(),
      concurrency: 5, // Process up to 5 risk analyses concurrently
      // High-priority queue - process risk checks quickly
      limiter: {
        max: 30, // Max 30 jobs
        duration: 60000, // Per 60 seconds
      },
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          return Math.min(Math.pow(2, attemptsMade) * 500, 10000);
        },
      },
    }
  );

  // Event handlers
  worker.on('completed', (job, result) => {
    logger.info(`✅ Risk worker completed job ${job.id}`);
    logger.info(`   Risk Level: ${result.riskLevel} (${result.riskScore.toFixed(2)}/10)`);
    logger.info(`   Alerts: ${result.alerts.length}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Risk worker failed job ${job?.id}:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error('❌ Risk worker error:', err);
  });

  logger.info('✅ Risk worker started');

  return worker;
}
