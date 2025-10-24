/**
 * API Routes Configuration
 */

import { Express, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getExecutionBridge } from '../agents';
import { getLaunchQueue, getRiskQueue, getLiquidityQueue } from '../queue/redis';

export function setupRoutes(app: Express): void {
  // Launch endpoints
  app.post('/api/launch/create', async (req: Request, res: Response) => {
    try {
      const { name, symbol, totalSupply, category, targetMarketCap } = req.body;

      logger.info(`Received launch request for: ${name}`);

      // Add to queue for processing
      const queue = getLaunchQueue();
      const job = await queue.add('create-token', {
        tokenParams: {
          name,
          symbol,
          totalSupply,
          category,
          targetMarketCap,
        },
      });

      res.json({
        success: true,
        jobId: job.id,
        message: 'Token launch queued for processing',
      });
    } catch (error) {
      logger.error('Launch creation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create launch',
      });
    }
  });

  app.get('/api/launch/:jobId/status', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const queue = getLaunchQueue();
      const job = await queue.getJob(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found',
        });
      }

      const state = await job.getState();
      const progress = job.progress;

      res.json({
        success: true,
        jobId: job.id,
        state,
        progress,
        data: job.returnvalue,
      });
    } catch (error) {
      logger.error('Failed to get job status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get status',
      });
    }
  });

  // Risk analysis endpoints
  app.post('/api/risk/analyze', async (req: Request, res: Response) => {
    try {
      const { tokenAddress } = req.body;

      logger.info(`Risk analysis requested for: ${tokenAddress}`);

      const queue = getRiskQueue();
      const job = await queue.add('analyze-risk', {
        tokenAddress,
      });

      res.json({
        success: true,
        jobId: job.id,
        message: 'Risk analysis queued',
      });
    } catch (error) {
      logger.error('Risk analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze risk',
      });
    }
  });

  // Liquidity management endpoints
  app.post('/api/liquidity/position/create', async (req: Request, res: Response) => {
    try {
      const { poolAddress, lowerPrice, upperPrice, amount0, amount1 } = req.body;

      logger.info(`Creating liquidity position for pool: ${poolAddress}`);

      const queue = getLiquidityQueue();
      const job = await queue.add('create-position', {
        poolAddress,
        lowerPrice,
        upperPrice,
        amount0,
        amount1,
      });

      res.json({
        success: true,
        jobId: job.id,
        message: 'Position creation queued',
      });
    } catch (error) {
      logger.error('Position creation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create position',
      });
    }
  });

  app.get('/api/liquidity/positions', async (req: Request, res: Response) => {
    try {
      // Mock response - would query from database
      res.json({
        success: true,
        positions: [],
      });
    } catch (error) {
      logger.error('Failed to get positions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get positions',
      });
    }
  });

  // Stats endpoints
  app.get('/api/stats/overview', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        stats: {
          totalLaunches: 0,
          activeLaunches: 0,
          totalVolume: 0,
          activePositions: 0,
        },
      });
    } catch (error) {
      logger.error('Failed to get stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stats',
      });
    }
  });

  logger.info('✅ API routes configured');
}
