/**
 * WebSocket Event Handlers
 * Real-time updates for launches, risk alerts, and liquidity events
 */

import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export function setupWebSocket(io: SocketIOServer): void {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Subscribe to launch updates
    socket.on('subscribe:launch', (tokenAddress: string) => {
      socket.join(`launch:${tokenAddress}`);
      logger.info(`Client ${socket.id} subscribed to launch: ${tokenAddress}`);
    });

    // Subscribe to risk alerts
    socket.on('subscribe:risk', (tokenAddress: string) => {
      socket.join(`risk:${tokenAddress}`);
      logger.info(`Client ${socket.id} subscribed to risk alerts: ${tokenAddress}`);
    });

    // Subscribe to liquidity updates
    socket.on('subscribe:liquidity', (positionId: string) => {
      socket.join(`liquidity:${positionId}`);
      logger.info(`Client ${socket.id} subscribed to liquidity: ${positionId}`);
    });

    // Unsubscribe events
    socket.on('unsubscribe:launch', (tokenAddress: string) => {
      socket.leave(`launch:${tokenAddress}`);
    });

    socket.on('unsubscribe:risk', (tokenAddress: string) => {
      socket.leave(`risk:${tokenAddress}`);
    });

    socket.on('unsubscribe:liquidity', (positionId: string) => {
      socket.leave(`liquidity:${positionId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ WebSocket handlers configured');
}

// Helper functions to emit events
export function emitLaunchUpdate(io: SocketIOServer, tokenAddress: string, data: any) {
  io.to(`launch:${tokenAddress}`).emit('launch:update', data);
}

export function emitRiskAlert(io: SocketIOServer, tokenAddress: string, data: any) {
  io.to(`risk:${tokenAddress}`).emit('risk:alert', data);
}

export function emitLiquidityUpdate(io: SocketIOServer, positionId: string, data: any) {
  io.to(`liquidity:${positionId}`).emit('liquidity:update', data);
}
