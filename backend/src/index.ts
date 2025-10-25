/**
 * SOLTokenForger - Main Entry Point
 *
 * Autonomous token launch platform powered by AI agents
 * Solana Cypherpunk Hackathon 2025
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import 'express-async-errors';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

import { logger } from './utils/logger';
import { config } from './config';
import { connectDatabase } from './database/connection';
import { initializeRedis } from './queue/redis';
import { initializeAgents } from './agents';
import { setupRoutes } from './api/routes';
import { setupWebSocket } from './websocket';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

async function bootstrap() {
  try {
    logger.info('🚀 Starting SOLTokenForger Backend...');

    // Initialize Express app
    const app = express();
    const httpServer = createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Middleware
    app.use(helmet());
    app.use(cors({
      origin: config.allowedOrigins,
      credentials: true,
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(rateLimiter);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
      });
    });

    // Connect to database
    logger.info('📊 Connecting to PostgreSQL...');
    await connectDatabase();

    // Initialize Redis
    logger.info('🔴 Connecting to Redis...');
    await initializeRedis();

    // Initialize AI Agents
    logger.info('🤖 Initializing AI Agents...');
    await initializeAgents();

    // Setup API routes
    logger.info('🛣️  Setting up API routes...');
    setupRoutes(app);

    // Setup WebSocket handlers
    logger.info('🔌 Setting up WebSocket...');
    setupWebSocket(io);

    // Error handling (must be last)
    app.use(errorHandler);

    // Start server
    const PORT = config.port;
    httpServer.listen(PORT, () => {
      logger.info(`✅ SOLTokenForger Backend running on port ${PORT}`);
      logger.info(`📱 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 Solana Network: ${config.solana.network}`);
      logger.info(`🔗 RPC: ${config.solana.rpcUrl}`);
      logger.info('');
      logger.info('🎯 AI Agents Active:');
      logger.info('   - LaunchAgent: Autonomous token deployment');
      logger.info('   - LiquidityAgent: DAMM v2 position optimization');
      logger.info('   - FeeAgent: Dynamic fee management');
      logger.info('');
      logger.info('🏆 Ready for Solana Cypherpunk Hackathon!');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received, shutting down gracefully...`);

      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      // Close connections
      await connectDatabase.close();
      await initializeRedis.close();

      logger.info('All connections closed. Goodbye! 👋');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
