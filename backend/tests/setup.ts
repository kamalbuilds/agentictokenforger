/**
 * Test Setup
 * Global test configuration and mocks
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.SOLANA_WS_URL = 'wss://api.devnet.solana.com';
process.env.SOLANA_NETWORK = 'devnet';
process.env.PRIVATE_KEY = 'test_private_key';
process.env.JWT_SECRET = 'test_secret';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.METEORA_PROGRAM_ID = 'TestProgramId';

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
