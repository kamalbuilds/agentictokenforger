# Database Integration Guide

## Overview
This backend now has full Prisma database integration across ALL API routes.

## Files Created/Modified

### New Files:
1. **src/database/client.ts** - Prisma singleton with utilities
   - `prisma` - Main Prisma client instance
   - `checkDatabaseHealth()` - Database health check
   - `disconnectDatabase()` - Graceful shutdown
   - `bigIntUtils` - BigInt conversion utilities
   - `withTransaction()` - Transaction wrapper with retry logic

### Modified Files:
2. **src/api/routes.ts** - All routes now use database operations

## Database Operations by Endpoint

### Token Launch Endpoints
- `POST /api/launch/create` → Creates `TokenLaunch` record
- `GET /api/launch/:jobId/status` → Queries `TokenLaunch` by job data
- `GET /api/launch/:tokenLaunchId` → Full details with relations
- `POST /api/launch/:tokenLaunchId/cancel` → Updates status to 'failed'

### Risk Analysis Endpoints
- `POST /api/risk/analyze` → Links to `TokenLaunch`, queues analysis
- `GET /api/risk/alerts/:tokenLaunchId` → Queries `RiskAlert` table
- `POST /api/risk/alerts/:alertId/acknowledge` → Updates `RiskAlert`

### Liquidity Endpoints
- `POST /api/liquidity/position/create` → Creates `LiquidityPosition`
- `GET /api/liquidity/positions` → Queries with filters and relations
- `GET /api/liquidity/position/:positionId` → Single position details
- `POST /api/liquidity/position/:positionId/close` → Closes position

### Analytics Endpoints
- `GET /api/stats/overview` → Aggregates from all tables
- `GET /api/transactions` → Transaction history with filters
- `GET /api/agents/activity` → Agent activity logs
- `GET /api/ml/predictions` → ML prediction history

### System Endpoints
- `GET /api/health` → Database connection health check

## Usage Examples

### Creating a Token Launch
```typescript
const response = await fetch('/api/launch/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Token',
    symbol: 'MTK',
    totalSupply: 1000000,
    category: 'meme',
    targetMarketCap: 1000000,
    presaleMode: 'FCFS',
    curveType: 'LINEAR',
    initialPrice: 0.001
  })
});
// Returns: { jobId, tokenLaunchId, tokenMint }
```

### Querying Token Status
```typescript
const response = await fetch('/api/launch/uuid-here');
// Returns full token details with:
// - Liquidity positions
// - Risk alerts
// - Recent transactions
```

### Getting Analytics
```typescript
const response = await fetch('/api/stats/overview');
// Returns aggregated stats:
// - Total/active/graduated launches
// - Success rate
// - Active positions
// - 24h volume and market cap
// - Critical risk alerts
```

## BigInt Handling

All BigInt database fields are automatically converted for JSON:
- `totalSupply` → string
- `targetMarketCap` → string
- `currentMarketCap` → string
- `volume24h` → string
- `liquidityAmount` → string

Use `bigIntUtils` for conversions:
```typescript
import { bigIntUtils } from '../database/client';

// Convert to database BigInt
const dbValue = bigIntUtils.fromValue(1000000);

// Convert from database BigInt
const jsonValue = bigIntUtils.toString(dbBigInt);
const numValue = bigIntUtils.toNumber(dbBigInt);

// Convert entire object
const safe = bigIntUtils.toJSON(objectWithBigInts);
```

## Transaction Usage

Complex operations use transactions:
```typescript
import { withTransaction } from '../database/client';

const result = await withTransaction(async (tx) => {
  const launch = await tx.tokenLaunch.create({ data: {...} });
  const position = await tx.liquidityPosition.create({ data: {...} });
  return { launch, position };
});
// Automatically retries up to 3 times on failure
```

## Health Checks

Monitor database health:
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "latency": 5
  }
}
```

## Migration Commands

```bash
# Generate Prisma client types
npm run generate

# Create new migration
npm run migrate

# Apply migrations in production
npm run migrate:prod

# Open Prisma Studio (GUI)
npm run db:studio
```

## Error Handling

All database operations include:
- Try-catch error handling
- Proper HTTP status codes
- Descriptive error messages
- Logger integration

Example error response:
```json
{
  "success": false,
  "error": "Failed to create launch"
}
```

## Performance Features

1. **Connection Pooling** - Automatic via Prisma
2. **Query Caching** - Stats endpoint cached (5min TTL)
3. **BigInt Optimization** - Efficient string conversion
4. **Transaction Retry** - Automatic retry with backoff
5. **Selective Includes** - Only fetch needed relations

## Next Steps

1. ✅ Database client created
2. ✅ All routes integrated
3. ✅ Migrations ready
4. ⏳ Run migrations: `npm run migrate`
5. ⏳ Start server and test endpoints
6. ⏳ Monitor logs for database operations

## Testing

Test database integration:
```bash
# Health check
curl http://localhost:3000/api/health

# Create launch
curl -X POST http://localhost:3000/api/launch/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","symbol":"TST","totalSupply":1000000,"category":"meme","targetMarketCap":100000}'

# Get stats
curl http://localhost:3000/api/stats/overview
```

## Troubleshooting

**Issue**: "Database not initialized"
**Fix**: Ensure `connectDatabase()` is called in index.ts before routes

**Issue**: BigInt serialization error
**Fix**: Use `bigIntUtils.toString()` or `bigIntUtils.toJSON()`

**Issue**: Connection pool exhausted
**Fix**: Check for missing `await` or unclosed connections

**Issue**: Migration fails
**Fix**: Verify DATABASE_URL in .env and database is running
