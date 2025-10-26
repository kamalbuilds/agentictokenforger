/**
 * uAgent Bridge REST API Routes
 * Provides HTTP endpoints for uAgents to communicate with Solana execution layer
 *
 * Replaces WebSocket-based communication with simple REST API
 */

import { Router, Request, Response } from 'express';
import { getExecutionBridge } from '../agents';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/uagent-bridge/execute
 * Execute a command from uAgent
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const command = req.body;
    logger.info(`📨 Received uAgent command: ${command.action}`);

    // Get the execution bridge
    const bridge = getExecutionBridge();

    // Execute the command
    const result = await bridge.executeCommand(command);

    // Return result to uAgent
    res.json({
      success: result.success,
      data: result.data,
      transaction_signatures: result.transaction_signatures,
      error: result.error,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('❌ Failed to execute uAgent command:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/uagent-bridge/status
 * Check bridge status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'operational',
    bridge_type: 'REST API',
    capabilities: [
      'token_deployment',
      'meteora_integration',
      'liquidity_management',
      'transaction_execution',
    ],
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/uagent-bridge/register
 * Register a new uAgent
 */
router.post('/register', (req: Request, res: Response) => {
  const { agent_address, agent_type, capabilities } = req.body;

  logger.info(`🤖 Registering uAgent: ${agent_type} (${agent_address})`);
  logger.info(`   Capabilities: ${capabilities.join(', ')}`);

  res.json({
    success: true,
    message: 'Agent registered successfully',
    agent_address,
    timestamp: new Date().toISOString(),
  });
});

export default router;
