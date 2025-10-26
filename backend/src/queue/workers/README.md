# BullMQ Queue Workers

This directory contains the BullMQ worker implementations for processing asynchronous jobs in the LaunchPad AI system.

## Workers

### 1. Launch Worker (`launch.worker.ts`)
Processes token launch jobs including:
- Creating presale vaults (FCFS/PRO_RATA modes)
- Deploying dynamic bonding curves
- Scheduling anti-sniper dynamic fees
- Database updates
- Real-time Socket.io progress events

**Queue Name:** `token-launches`
**Concurrency:** 5 jobs
**Retry:** 3 attempts with exponential backoff

**Job Types:**
- `create-token-launch` - Full token launch workflow

### 2. Liquidity Worker (`liquidity.worker.ts`)
Manages liquidity operations:
- Adding liquidity to DAMM v2 pools
- Rebalancing positions based on AI strategies
- Harvesting trading fees
- Closing positions

**Queue Name:** `liquidity-management`
**Concurrency:** 5 jobs
**Retry:** 3 attempts with exponential backoff

**Job Types:**
- `add-liquidity` - Create new liquidity position
- `rebalance-position` - Adjust position ranges
- `harvest-fees` - Collect earned fees
- `close-position` - Remove liquidity and close

### 3. Risk Worker (`risk.worker.ts`)
Analyzes tokens for potential risks:
- Rug pull detection
- Liquidity analysis
- Holder concentration checks
- Price manipulation detection
- Creates risk alerts in database

**Queue Name:** `risk-analysis`
**Concurrency:** 5 jobs
**Retry:** 2 attempts with exponential backoff

**Job Types:**
- `analyze-risk` - Comprehensive risk assessment

## Architecture

```
┌─────────────────┐
│   API Routes    │
└────────┬────────┘
         │ Add Job
         ▼
┌─────────────────┐
│  BullMQ Queue   │
│   (Redis)       │
└────────┬────────┘
         │ Process
         ▼
┌─────────────────┐
│     Worker      │
│  (Processor)    │
└────────┬────────┘
         │
         ├──► MeteoraService
         ├──► Prisma Database
         └──► Socket.io Events
```

## Usage Examples

### Adding a Token Launch Job

```typescript
import { getLaunchQueue } from '../queue/redis';

const queue = getLaunchQueue();

await queue.add('create-token-launch', {
  tokenParams: {
    name: 'MyToken',
    symbol: 'MTK',
    decimals: 9,
    totalSupply: '1000000000',
    category: 'meme',
    targetMarketCap: '1000000',
  },
  presaleConfig: {
    mode: 'FCFS',
    depositLimit: 500000,
    vestingCliffDuration: 0,
    vestingDuration: 2592000,
    immediateRelease: 20,
    startTime: Date.now() / 1000,
    endTime: Date.now() / 1000 + 86400,
  },
  curveConfig: {
    type: 'LINEAR',
    initialPrice: 0.001,
    graduationThreshold: 500000,
    tradingFeeRate: 0.01,
    creatorFeeRate: 0.005,
    partnerFeeRate: 0.002,
  },
  feeSchedule: [
    { duration: 300, feeRate: 0.1 },   // 10% for first 5 min
    { duration: 900, feeRate: 0.05 },  // 5% for next 15 min
    { duration: 3600, feeRate: 0.01 }, // 1% after
  ],
}, {
  priority: 1, // High priority
  attempts: 3,
});
```

### Adding a Liquidity Job

```typescript
import { getLiquidityQueue } from '../queue/redis';

const queue = getLiquidityQueue();

// Add liquidity
await queue.add('add-liquidity', {
  type: 'add-liquidity',
  tokenLaunchId: 'uuid-here',
  poolAddress: 'pool-pubkey',
  lowerPrice: 0.001,
  upperPrice: 0.01,
  amount0: '1000000',
  amount1: '1000000',
});

// Rebalance position
await queue.add('rebalance', {
  type: 'rebalance-position',
  positionId: 'position-uuid',
  newLowerPrice: 0.002,
  newUpperPrice: 0.02,
  strategy: 'balanced',
});

// Harvest fees
await queue.add('harvest', {
  type: 'harvest-fees',
  positionId: 'position-uuid',
});
```

### Adding a Risk Analysis Job

```typescript
import { getRiskQueue } from '../queue/redis';

const queue = getRiskQueue();

await queue.add('analyze', {
  type: 'analyze-risk',
  tokenAddress: 'token-pubkey',
  tokenLaunchId: 'uuid-here',
  checkTypes: ['rug_pull', 'liquidity', 'holder_concentration'],
}, {
  priority: 10, // High priority for risk checks
});
```

## Worker Management

### Starting Workers

Workers are automatically started when the server starts:

```typescript
import { startWorkers } from './queue/workers';

// Pass Socket.io instance for real-time events
await startWorkers(io);
```

### Stopping Workers

```typescript
import { stopWorkers } from './queue/workers';

await stopWorkers(); // Gracefully stops all workers
```

### Getting Worker Status

```typescript
import { getWorkerStatus, getWorkerMetrics } from './queue/workers';

const status = await getWorkerStatus();
console.log(status);
// {
//   workers: [
//     { name: 'token-launches', isRunning: true, isPaused: false },
//     { name: 'liquidity-management', isRunning: true, isPaused: false },
//     { name: 'risk-analysis', isRunning: true, isPaused: false }
//   ],
//   totalWorkers: 3
// }

const metrics = await getWorkerMetrics();
console.log(metrics);
// {
//   'token-launches': {
//     completed: 42,
//     failed: 2,
//     active: 1,
//     waiting: 5,
//     delayed: 0
//   },
//   ...
// }
```

## Monitoring Job Progress

Workers emit Socket.io events for real-time progress tracking:

### Launch Progress Events

```typescript
// Client-side
socket.on('launch:progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
  console.log(`Message: ${data.message}`);
});

socket.on('launch:complete', (data) => {
  console.log('Launch completed:', data);
});

socket.on('launch:failed', (data) => {
  console.error('Launch failed:', data.error);
});
```

### Liquidity Update Events

```typescript
socket.on('liquidity:update', (data) => {
  console.log('Liquidity update:', data);
});
```

### Risk Alert Events

```typescript
socket.on('risk:alert', (data) => {
  console.warn('Risk alert:', data);
  console.log(`Risk Level: ${data.riskLevel}`);
  console.log(`Risk Score: ${data.riskScore}/10`);
});
```

## Error Handling

All workers implement comprehensive error handling:

1. **Automatic Retries**: Jobs are retried with exponential backoff
2. **Database Logging**: All activities logged to `AgentActivity` table
3. **Socket.io Events**: Failures emitted to clients
4. **Graceful Degradation**: Partial failures don't crash the worker

### Retry Strategy

```typescript
// Launch Worker: 3 attempts (1s, 2s, 4s backoff)
// Liquidity Worker: 3 attempts (1s, 2s, 4s backoff)
// Risk Worker: 2 attempts (0.5s, 1s backoff)
```

## Performance

- **Concurrency**: Each worker processes 5 jobs concurrently
- **Rate Limiting**:
  - Launch: 10 jobs/60s
  - Liquidity: 20 jobs/60s
  - Risk: 30 jobs/60s
- **Job Retention**:
  - Completed: Last 100-200 jobs
  - Failed: Last 300-500 jobs

## Database Integration

All workers use Prisma for database operations:

### Tables Updated
- `TokenLaunch` - Launch status and metadata
- `LiquidityPosition` - Position details and performance
- `RiskAlert` - Risk alerts and indicators
- `AgentActivity` - Worker execution logs
- `MLPrediction` - AI model predictions
- `Transaction` - On-chain transactions

## Development

### Adding a New Worker

1. Create new worker file in this directory
2. Implement job processor function
3. Export worker creation function
4. Add to `index.ts`
5. Update queue configuration in `redis.ts`

Example template:

```typescript
import { Worker, Job } from 'bullmq';
import { logger } from '../../utils/logger';
import { getRedisClient } from '../redis';

export function createMyWorker(io?: any): Worker {
  const worker = new Worker(
    'my-queue',
    async (job: Job) => {
      // Process job
      logger.info(`Processing: ${job.id}`);
      return { success: true };
    },
    {
      connection: getRedisClient(),
      concurrency: 5,
    }
  );

  worker.on('completed', (job, result) => {
    logger.info(`Completed: ${job.id}`);
  });

  return worker;
}
```

## Testing

Test workers in isolation:

```typescript
import { processLaunchJob } from './launch.worker';

// Create mock job
const mockJob = {
  id: 'test-123',
  data: { /* job data */ },
  updateProgress: async (progress: number) => {},
};

// Test processor
const result = await processLaunchJob(mockJob as any);
expect(result.success).toBe(true);
```

## Troubleshooting

### Workers Not Starting
- Check Redis connection
- Verify environment variables
- Check logs for initialization errors

### Jobs Stuck in Queue
- Check worker status: `getWorkerStatus()`
- Review job metrics: `getWorkerMetrics()`
- Check for rate limiting

### High Failure Rate
- Review job data format
- Check MeteoraService connectivity
- Verify Solana RPC endpoint
- Check database connection

### Memory Issues
- Clean old jobs: `cleanOldJobs()`
- Reduce concurrency
- Check for memory leaks in processors

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Setup](https://redis.io/docs/getting-started/)
- [Worker Patterns](https://docs.bullmq.io/patterns/worker-patterns)
