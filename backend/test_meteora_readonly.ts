/**
 * Test Meteora API and Read-Only Solana Operations
 * No wallet signature required
 */

import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const METEORA_API_URL = 'https://api.meteora.ag';
const WALLET_ADDRESS = 'GhyXbXu7y3DVptMiSPBri12rGMxJBKtex4hWSa6bfg9j';

console.log('🔍 METEORA & SOLANA READ-ONLY TESTS');
console.log('═'.repeat(70));
console.log('');

// Test 1: Solana Balance Check
async function testSolanaBalance() {
  console.log('📝 TEST 1: Solana Devnet Connection');
  console.log('─'.repeat(70));

  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    const pubkey = new PublicKey(WALLET_ADDRESS);
    const balance = await connection.getBalance(pubkey);
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();

    console.log(`✅ Connected to Solana Devnet`);
    console.log(`   Wallet: ${WALLET_ADDRESS}`);
    console.log(`   Balance: ${balance / 1e9} SOL`);
    console.log(`   Current Slot: ${slot.toLocaleString()}`);
    console.log(`   Block Height: ${blockHeight.toLocaleString()}`);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    console.log(`   Latest Blockhash: ${blockhash.substring(0, 20)}...`);

    return { balance, slot, blockHeight };

  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

// Test 2: Meteora API - List Pools
async function testMeteoraPoolsList() {
  console.log('\n📝 TEST 2: Meteora Pools API');
  console.log('─'.repeat(70));

  try {
    console.log(`🔗 Connecting to: ${METEORA_API_URL}`);

    // Try different endpoints
    const endpoints = [
      '/pools',
      '/v1/pools',
      '/dlmm/pools',
      '/pair/all'
    ];

    let successfulEndpoint: string | null = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`   Testing: ${endpoint}...`);
        const response = await axios.get(`${METEORA_API_URL}${endpoint}`, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.status === 200 && response.data) {
          console.log(`   ✅ ${endpoint} - Success!`);
          successfulEndpoint = endpoint;

          if (Array.isArray(response.data)) {
            console.log(`      Found ${response.data.length} items`);
            if (response.data.length > 0) {
              const sample = response.data[0];
              console.log(`      Sample keys: ${Object.keys(sample).slice(0, 5).join(', ')}`);
            }
          } else if (typeof response.data === 'object') {
            console.log(`      Response keys: ${Object.keys(response.data).slice(0, 5).join(', ')}`);
          }
          break;
        }
      } catch (endpointError: any) {
        const status = endpointError.response?.status || 'no response';
        console.log(`   ⚠️  ${endpoint} - ${status}`);
      }
    }

    if (successfulEndpoint) {
      console.log(`\n✅ Meteora API is accessible via ${successfulEndpoint}`);
      return true;
    } else {
      console.log(`\n⚠️  All endpoints returned errors - API may have changed`);
      return false;
    }

  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

// Test 3: Check Token Accounts
async function testTokenAccounts() {
  console.log('\n📝 TEST 3: Token Accounts');
  console.log('─'.repeat(70));

  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const pubkey = new PublicKey(WALLET_ADDRESS);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });

    console.log(`✅ Found ${tokenAccounts.value.length} token account(s)`);

    tokenAccounts.value.slice(0, 5).forEach((account, idx) => {
      const data = account.account.data.parsed.info;
      console.log(`   ${idx + 1}. Mint: ${data.mint.substring(0, 20)}...`);
      console.log(`      Balance: ${data.tokenAmount.uiAmountString || 0}`);
    });

    return tokenAccounts.value.length;

  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return null;
  }
}

// Test 4: Backend API Health
async function testBackendAPI() {
  console.log('\n📝 TEST 4: Backend API');
  console.log('─'.repeat(70));

  try {
    const healthResponse = await axios.get('http://localhost:3000/health', {
      timeout: 5000
    });

    if (healthResponse.data) {
      console.log(`✅ Backend is healthy`);
      console.log(`   Status: ${healthResponse.data.status}`);
      console.log(`   Uptime: ${Math.floor(healthResponse.data.uptime)}s`);
      console.log(`   Version: ${healthResponse.data.version}`);
    }

    return true;

  } catch (error: any) {
    console.log(`❌ Backend not accessible: ${error.message}`);
    return false;
  }
}

// Test 5: uAgent Status Check
async function testUAgentStatus() {
  console.log('\n📝 TEST 5: uAgent Status');
  console.log('─'.repeat(70));

  try {
    const fs = await import('fs');

    const logs = {
      'LaunchCoordinator': '/tmp/launch_coord.log',
      'LiquidityOptimizer': '/tmp/liquidity_opt.log',
      'RiskAnalyzer': '/tmp/risk_analyzer.log'
    };

    let activeAgents = 0;

    for (const [name, logPath] of Object.entries(logs)) {
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf-8');
        const isRunning = content.includes('Agent Address') || content.includes('Ready');

        if (isRunning) {
          console.log(`   ✅ ${name} - Running`);
          activeAgents++;
        } else {
          console.log(`   ❌ ${name} - Not active`);
        }
      } else {
        console.log(`   ⚠️  ${name} - No log file`);
      }
    }

    console.log(`\n   ${activeAgents}/3 agents active`);
    return activeAgents === 3;

  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

// Run all read-only tests
async function runTests() {
  console.log('═'.repeat(70));
  console.log('STARTING READ-ONLY TESTS');
  console.log('═'.repeat(70));
  console.log('');

  const results: any = {};

  results.solana = await testSolanaBalance();
  results.meteora = await testMeteoraPoolsList();
  results.tokenAccounts = await testTokenAccounts();
  results.backend = await testBackendAPI();
  results.uagents = await testUAgentStatus();

  // Summary
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(70));
  console.log('');

  const tests = [
    { name: 'Solana Connection', result: results.solana },
    { name: 'Meteora API', result: results.meteora },
    { name: 'Token Accounts', result: results.tokenAccounts !== null },
    { name: 'Backend API', result: results.backend },
    { name: 'uAgents (3/3)', result: results.uagents }
  ];

  tests.forEach(test => {
    const icon = test.result ? '✅' : '❌';
    console.log(`${icon} ${test.name.padEnd(25)} ${test.result ? 'PASSED' : 'FAILED'}`);
  });

  const passed = tests.filter(t => t.result).length;
  console.log('');
  console.log(`Results: ${passed}/${tests.length} tests passed`);
  console.log('');
  console.log('═'.repeat(70));
}

runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
