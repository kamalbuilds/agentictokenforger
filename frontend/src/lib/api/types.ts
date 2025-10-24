// Token Launch Types
export interface TokenParams {
  name: string;
  symbol: string;
  totalSupply: string;
  category: string;
  targetMarketCap: string;
  initialLiquidity?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface LaunchResponse {
  success: boolean;
  jobId: string;
  message?: string;
}

export interface LaunchStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  tokenMint?: string;
  error?: string;
  steps: {
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    timestamp?: string;
  }[];
}

export interface AIRecommendation {
  bondingCurveType: string;
  initialPrice: number;
  graduationThreshold: number;
  liquidityRange: {
    min: number;
    max: number;
  };
  estimatedAPR: number;
  riskScore: number;
  confidence: number;
  reasoning: string[];
}

// Token Types
export interface Token {
  id: string;
  tokenMint: string;
  name: string;
  symbol: string;
  category: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  totalSupply: string;
  marketCap: string;
  price: number;
  holders: number;
  volume24h: string;
  change24h: number;
  riskScore: number;
  verified: boolean;
  liquidityLocked: boolean;
  launchedAt: string;
  createdAt: string;
}

export interface TokenDetails extends Token {
  bondingCurve: {
    type: string;
    currentPrice: number;
    initialPrice: number;
    graduationThreshold: number;
    progress: number;
  };
  liquidity: {
    totalLocked: string;
    poolAddress: string;
    lockDuration: number;
  };
  security: {
    contractVerified: boolean;
    teamVerified: boolean;
    auditUrl?: string;
  };
}

// Risk Types
export interface RiskAnalysis {
  tokenAddress: string;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: {
    liquidityLock: {
      score: number;
      status: string;
      duration?: number;
    };
    teamVerification: {
      score: number;
      verified: boolean;
    };
    contractSecurity: {
      score: number;
      verified: boolean;
      issues: string[];
    };
    holderDistribution: {
      score: number;
      topHolderPercentage: number;
    };
    tradingPattern: {
      score: number;
      anomalies: string[];
    };
  };
  redFlags: string[];
  recommendations: string[];
  confidence: number;
}

// Portfolio Types
export interface TokenHolding {
  id: string;
  tokenMint: string;
  name: string;
  symbol: string;
  balance: number;
  valueUSD: number;
  avgBuyPrice: number;
  currentPrice: number;
  change24h: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Portfolio {
  walletAddress: string;
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: TokenHolding[];
}

// Transaction Types
export interface Transaction {
  id: string;
  signature: string;
  type: 'buy' | 'sell' | 'transfer';
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  price: number;
  total: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// WebSocket Event Types
export interface WSEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface LaunchUpdateEvent extends WSEvent {
  type: 'launch:update';
  data: {
    jobId: string;
    status: string;
    progress: number;
    step?: string;
  };
}

export interface RiskAlertEvent extends WSEvent {
  type: 'risk:alert';
  data: {
    tokenAddress: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    redFlags: string[];
  };
}

export interface PriceUpdateEvent extends WSEvent {
  type: 'price:update';
  data: {
    tokenMint: string;
    price: number;
    change24h: number;
    volume24h: string;
  };
}

// API Error Types
export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

// Stats Types
export interface PlatformStats {
  totalLaunches: number;
  successRate: number;
  totalVolume: string;
  activeUsers: number;
  avgRiskScore: number;
}
