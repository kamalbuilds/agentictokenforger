/**
 * AI Agents Initialization
 * Manages all uAgents and execution bridges
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger';
import { SolanaExecutionBridge } from './bridge/SolanaExecutionBridge';

let executionBridge: SolanaExecutionBridge;
const agentProcesses: Map<string, ChildProcess> = new Map();

export async function initializeAgents(): Promise<void> {
  try {
    // Initialize Solana Execution Bridge
    logger.info('🌉 Initializing Solana Execution Bridge...');
    executionBridge = new SolanaExecutionBridge();
    logger.info('✅ Solana Execution Bridge initialized');

    // Start uAgents (Python processes)
    if (process.env.ENABLE_AI_AGENTS === 'true') {
      await startUAgents();
    } else {
      logger.info('⚠️  AI Agents disabled (ENABLE_AI_AGENTS=true)');
    }

    logger.info('✅ All agents initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize agents:', error);
    throw error;
  }
}

async function startUAgents(): Promise<void> {
  const agentsDir = path.join(__dirname, 'uagents');

  // List of uAgents to start
  const agents = [
    { name: 'LaunchCoordinator', file: 'LaunchCoordinatorAgent.py' },
    { name: 'LiquidityOptimizer', file: 'LiquidityOptimizerAgent.py' },
    { name: 'RiskAnalyzer', file: 'RiskAnalyzerAgent.py' },
  ];

  for (const agent of agents) {
    try {
      logger.info(`🤖 Starting ${agent.name} agent...`);

      const agentPath = path.join(agentsDir, agent.file);
      const agentProcess = spawn('python3', [agentPath], {
        cwd: agentsDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
      });

      agentProcess.stdout?.on('data', (data: Buffer) => {
        logger.info(`[${agent.name}] ${data.toString().trim()}`);
      });

      agentProcess.stderr?.on('data', (data: Buffer) => {
        logger.error(`[${agent.name}] ${data.toString().trim()}`);
      });

      agentProcess.on('close', (code: number | null) => {
        logger.warn(`[${agent.name}] Process exited with code ${code}`);
        agentProcesses.delete(agent.name);
      });

      agentProcesses.set(agent.name, agentProcess);
      logger.info(`✅ ${agent.name} agent started`);

      // Wait a bit between starting agents
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      logger.error(`❌ Failed to start ${agent.name}:`, error);
    }
  }
}

export function getExecutionBridge(): SolanaExecutionBridge {
  return executionBridge;
}

export async function shutdownAgents(): Promise<void> {
  logger.info('Shutting down agents...');

  for (const [name, agentProcess] of agentProcesses) {
    logger.info(`Stopping ${name} agent...`);
    agentProcess.kill();
  }

  agentProcesses.clear();
  logger.info('All agents stopped');
}
