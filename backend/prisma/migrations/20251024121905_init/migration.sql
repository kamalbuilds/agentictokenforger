-- CreateTable
CREATE TABLE "TokenLaunch" (
    "id" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 9,
    "totalSupply" BIGINT NOT NULL,
    "category" TEXT NOT NULL,
    "targetMarketCap" BIGINT NOT NULL,
    "presaleMode" TEXT,
    "depositLimit" BIGINT,
    "graduationThreshold" BIGINT,
    "curveType" TEXT,
    "initialPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "launchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graduatedAt" TIMESTAMP(3),
    "currentMarketCap" BIGINT NOT NULL DEFAULT 0,
    "volume24h" BIGINT NOT NULL DEFAULT 0,
    "holderCount" INTEGER NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenLaunch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityPosition" (
    "id" TEXT NOT NULL,
    "positionNft" TEXT NOT NULL,
    "poolAddress" TEXT NOT NULL,
    "tokenLaunchId" TEXT NOT NULL,
    "lowerPrice" DOUBLE PRECISION NOT NULL,
    "upperPrice" DOUBLE PRECISION NOT NULL,
    "liquidityAmount" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "feesEarned" BIGINT NOT NULL DEFAULT 0,
    "apr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capitalEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impermanentLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastRebalanceAt" TIMESTAMP(3),
    "rebalanceCount" INTEGER NOT NULL DEFAULT 0,
    "aiManaged" BOOLEAN NOT NULL DEFAULT true,
    "optimizationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAlert" (
    "id" TEXT NOT NULL,
    "tokenLaunchId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "indicators" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "tokenLaunchId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "launchesCreated" INTEGER NOT NULL DEFAULT 0,
    "totalVolume" BIGINT NOT NULL DEFAULT 0,
    "successfulLaunches" INTEGER NOT NULL DEFAULT 0,
    "riskTolerance" TEXT NOT NULL DEFAULT 'medium',
    "autoInvest" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentActivity" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "executionTimeMs" INTEGER NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLPrediction" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "prediction" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "actualOutcome" JSONB,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenLaunch_tokenMint_key" ON "TokenLaunch"("tokenMint");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPosition_positionNft_key" ON "LiquidityPosition"("positionNft");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_signature_key" ON "Transaction"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- AddForeignKey
ALTER TABLE "LiquidityPosition" ADD CONSTRAINT "LiquidityPosition_tokenLaunchId_fkey" FOREIGN KEY ("tokenLaunchId") REFERENCES "TokenLaunch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAlert" ADD CONSTRAINT "RiskAlert_tokenLaunchId_fkey" FOREIGN KEY ("tokenLaunchId") REFERENCES "TokenLaunch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tokenLaunchId_fkey" FOREIGN KEY ("tokenLaunchId") REFERENCES "TokenLaunch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
