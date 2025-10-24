/**
 * Configuration Management
 * Centralized application configuration
 */

import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),

  // Solana
  SOLANA_RPC_URL: z.string(),
  SOLANA_WS_URL: z.string(),
  SOLANA_NETWORK: z.enum(['mainnet-beta', 'devnet', 'testnet']).default('devnet'),
  PRIVATE_KEY: z.string(),

  // Meteora
  METEORA_API_URL: z.string().default('https://api.meteora.ag'),
  METEORA_PROGRAM_ID: z.string(),

  // AI & ML
  OPENAI_API_KEY: z.string().optional(),
  ML_MODEL_PATH: z.string().default('./ml-models/trained'),
  ML_INFERENCE_URL: z.string().default('http://localhost:8501'),

  // Authentication
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.string().default('7d'),

  // Monitoring
  DATADOG_API_KEY: z.string().optional(),
  MIXPANEL_TOKEN: z.string().optional(),

  // Feature Flags
  ENABLE_AI_AGENTS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ML_PREDICTIONS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_MOBILE_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),

  // Security
  ALLOWED_ORIGINS: z.string().transform(val => val.split(',')),
  CORS_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

const env = parseEnv();

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  host: env.HOST,

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  solana: {
    rpcUrl: env.SOLANA_RPC_URL,
    wsUrl: env.SOLANA_WS_URL,
    network: env.SOLANA_NETWORK,
    privateKey: env.PRIVATE_KEY,
  },

  meteora: {
    apiUrl: env.METEORA_API_URL,
    programId: env.METEORA_PROGRAM_ID,
  },

  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    mlModelPath: env.ML_MODEL_PATH,
    mlInferenceUrl: env.ML_INFERENCE_URL,
  },

  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiry: env.JWT_EXPIRY,
  },

  monitoring: {
    datadogApiKey: env.DATADOG_API_KEY,
    mixpanelToken: env.MIXPANEL_TOKEN,
  },

  features: {
    enableAIAgents: env.ENABLE_AI_AGENTS,
    enableMLPredictions: env.ENABLE_ML_PREDICTIONS,
    enableMobileNotifications: env.ENABLE_MOBILE_NOTIFICATIONS,
  },

  security: {
    corsEnabled: env.CORS_ENABLED,
  },

  allowedOrigins: env.ALLOWED_ORIGINS,

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
} as const;

export type Config = typeof config;
