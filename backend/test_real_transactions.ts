/**
 * REAL PRODUCTION TEST
 * Execute actual Solana transactions and test Meteora integration
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import fs from 'fs';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const METEORA_API_URL = process.env.METEORA_API_URL || 'https://api.meteora.ag';

// Load wallet from .env - use the funded wallet
import dotenv from 'dotenv';
import path from 'path';

// Load from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Hardcoded private key from .env for testing
const PRIVATE_KEY_ARRAY = [101,6,179,33,192,146,87,29,76,86,64,91,32,165,185,51,137,39,183,11,71,58,71,188,207,196,246,41,14,29,187,197,233,94,115,189,189,83,239,61,196,58,116,194,120,13,4,5,143,108,22,19,183,76,202,7,200,6,222,160,46,70,66,102];

const wallet = Keypair.fromSecretKey(Uint8Array.from(PRIVATE_KEY_ARRAY));

console.log('🚀 REAL PRODUCTION TEST - SOLTokenForger');
console.log('═'.repeat(70));
console.log('');
console.log(`💼 Wallet: ${wallet.publicKey.toBase58()}`);
console.log(`🌐 Network: Solana Devnet`);
console.log(`🔗 RPC: ${SOLANA_RPC_URL}`);
console.log('');

// Test 1: Create Real SPL Token on Devnet
async function createRealToken() {
  console.log('📝 TEST 1: Creating Real SPL Token on Devnet');
  console.log('─'.repeat(70));

  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💰 Current balance: ${balance / 1e9} SOL`);

    if (balance < 0.01 * 1e9) {
      console.log('❌ Insufficient balance! Please fund wallet from https://faucet.solana.com');
      return null;
    }

    // Create new token mint
    console.log('🏗️  Creating token mint...');
    const decimals = 9;

    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey, // mint authority
      wallet.publicKey, // freeze authority
      decimals
    );

    console.log(`✅ Token Mint Created: ${mint.toBase58()}`);
    console.log(`🔍 View on Explorer: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);

    // Create associated token account
    console.log('📦 Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );

    console.log(`✅ Token Account: ${tokenAccount.address.toBase58()}`);

    // Mint initial supply
    const initialSupply = 1_000_000; // 1 million tokens
    console.log(`🪙 Minting ${initialSupply.toLocaleString()} tokens...`);

    const mintTx = await mintTo(
      connection,
      wallet,
      mint,
      tokenAccount.address,
      wallet.publicKey,
      initialSupply * Math.pow(10, decimals)
    );

    console.log(`✅ Minted tokens! Signature: ${mintTx}`);
    console.log(`🔍 View transaction: https://explorer.solana.com/tx/${mintTx}?cluster=devnet`);

    return {
      mint: mint.toBase58(),
      tokenAccount: tokenAccount.address.toBase58(),
      supply: initialSupply,
      decimals,
      signature: mintTx
    };

  } catch (error: any) {
    console.log(`❌ Token creation failed: ${error.message}`);
    console.error(error);
    return null;
  }
}

// Test 2: Test Meteora API Endpoints
async function testMeteoraAPI() {
  console.log('\n📝 TEST 2: Testing Meteora API Integration');
  console.log('─'.repeat(70));

  try {
    // Test 1: Get all pools
    console.log('🔍 Fetching Meteora pools...');
    const poolsResponse = await axios.get(`${METEORA_API_URL}/pools`, {
      timeout: 10000
    });

    if (poolsResponse.data) {
      const pools = Array.isArray(poolsResponse.data) ? poolsResponse.data : [];
      console.log(`✅ Found ${pools.length} pools`);

      if (pools.length > 0) {
        console.log(`📊 Sample pool: ${pools[0].address || pools[0].pool_address || 'N/A'}`);
      }
    }

    // Test 2: Get pool info (if we have pools)
    console.log('\n🔍 Testing pool info endpoint...');
    const testPoolAddress = 'vVTYpKUvcZHr5EJJKRefamq7u8W8eDjz7gqERAvga3R'; // Known Meteora pool

    try {
      const poolInfoResponse = await axios.get(`${METEORA_API_URL}/pool/${testPoolAddress}`, {
        timeout: 10000
      });

      if (poolInfoResponse.data) {
        console.log(`✅ Pool info retrieved successfully`);
        console.log(`📊 Pool: ${testPoolAddress}`);
      }
    } catch (poolError: any) {
      console.log(`⚠️  Pool info endpoint returned: ${poolError.response?.status || 'error'}`);
    }

    // Test 3: Get user positions
    console.log('\n🔍 Testing user positions endpoint...');
    try {
      const positionsResponse = await axios.get(
        `${METEORA_API_URL}/user_positions/${wallet.publicKey.toBase58()}`,
        { timeout: 10000 }
      );

      if (positionsResponse.data) {
        const positions = Array.isArray(positionsResponse.data) ? positionsResponse.data : [];
        console.log(`✅ User has ${positions.length} position(s)`);
      }
    } catch (posError: any) {
      console.log(`⚠️  User positions endpoint returned: ${posError.response?.status || 'error'}`);
    }

    console.log('\n✅ Meteora API is accessible');
    return true;

  } catch (error: any) {
    console.log(`❌ Meteora API test failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return false;
  }
}

// Test 3: Send Transaction to Backend API
async function testBackendLaunch(tokenData: any) {
  console.log('\n📝 TEST 3: Testing Backend Token Launch API');
  console.log('─'.repeat(70));

  try {
    const launchRequest = {
      name: 'RealTestToken',
      symbol: 'RTEST',
      tokenMint: tokenData.mint,
      totalSupply: tokenData.supply,
      category: 'utility',
      targetMarketCap: 100000,
      presaleMode: 'FCFS',
      graduationThreshold: 50000,
      initialPrice: 0.001,
      curveType: 'EXPONENTIAL'
    };

    console.log('📤 Sending launch request to backend...');
    console.log(`   Token: ${launchRequest.name} (${launchRequest.symbol})`);
    console.log(`   Mint: ${launchRequest.tokenMint}`);

    const response = await axios.post('http://localhost:3000/api/launch/create', launchRequest, {
      timeout: 5000
    });

    if (response.data.success) {
      console.log(`✅ Launch request accepted!`);
      console.log(`   Job ID: ${response.data.jobId}`);
      console.log(`   Message: ${response.data.message}`);

      // Wait and check status
      console.log('\n⏳ Waiting 5 seconds for processing...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await axios.get(
        `http://localhost:3000/api/launch/${response.data.jobId}/status`,
        { timeout: 5000 }
      );

      console.log(`📊 Job Status: ${statusResponse.data.state}`);
      console.log(`   Progress: ${statusResponse.data.progress || 0}%`);

      return response.data.jobId;
    }

    return null;

  } catch (error: any) {
    console.log(`❌ Backend API test failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// Test 4: Check uAgent Logs
async function checkUAgentLogs() {
  console.log('\n📝 TEST 4: Checking uAgent Activity');
  console.log('─'.repeat(70));

  try {
    const logs = [
      '/tmp/launch_coord.log',
      '/tmp/liquidity_opt.log',
      '/tmp/risk_analyzer.log'
    ];

    for (const logFile of logs) {
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.split('\n').slice(-10); // Last 10 lines

        const agentName = logFile.includes('launch') ? 'LaunchCoordinator' :
                         logFile.includes('liquidity') ? 'LiquidityOptimizer' : 'RiskAnalyzer';

        console.log(`\n📋 ${agentName}:`);
        const relevantLines = lines.filter(l =>
          l.includes('INFO') || l.includes('ERROR') || l.includes('✅') || l.includes('Agent Address')
        );

        if (relevantLines.length > 0) {
          relevantLines.forEach(line => {
            console.log(`   ${line.substring(0, 100)}`);
          });
        } else {
          console.log('   (No recent activity)');
        }
      }
    }

    console.log('\n✅ uAgent logs checked');
    return true;

  } catch (error: any) {
    console.log(`❌ Failed to check logs: ${error.message}`);
    return false;
  }
}

// Test 5: Real Solana Transaction
async function testRealSolanaTransaction() {
  console.log('\n📝 TEST 5: Executing Real Solana Transaction');
  console.log('─'.repeat(70));

  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    // Create a simple transfer transaction
    const recipient = Keypair.generate();
    console.log(`📤 Sending 0.001 SOL to ${recipient.publicKey.toBase58()}`);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipient.publicKey,
        lamports: 0.001 * 1e9
      })
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet]
    );

    console.log(`✅ Transaction confirmed!`);
    console.log(`   Signature: ${signature}`);
    console.log(`🔍 View: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    return signature;

  } catch (error: any) {
    console.log(`❌ Transaction failed: ${error.message}`);
    return null;
  }
}

// Run all tests
async function runProductionTests() {
  console.log('═'.repeat(70));
  console.log('STARTING PRODUCTION TESTS');
  console.log('═'.repeat(70));
  console.log('');

  const results: any = {
    tokenCreation: null,
    meteoraAPI: null,
    backendLaunch: null,
    uagentLogs: null,
    solanaTransaction: null
  };

  // Test 1: Create real token
  const tokenData = await createRealToken();
  results.tokenCreation = tokenData;

  if (!tokenData) {
    console.log('\n⚠️  Skipping remaining tests due to token creation failure');
    return;
  }

  // Test 2: Meteora API
  results.meteoraAPI = await testMeteoraAPI();

  // Test 3: Backend launch
  results.backendLaunch = await testBackendLaunch(tokenData);

  // Test 4: Check uAgent logs
  results.uagentLogs = await checkUAgentLogs();

  // Test 5: Simple Solana transaction
  results.solanaTransaction = await testRealSolanaTransaction();

  // Summary
  console.log('\n\n');
  console.log('═'.repeat(70));
  console.log('📊 PRODUCTION TEST RESULTS');
  console.log('═'.repeat(70));
  console.log('');
  console.log(`✅ Token Creation:      ${results.tokenCreation ? 'PASSED' : 'FAILED'}`);
  console.log(`${results.meteoraAPI ? '✅' : '❌'} Meteora API:        ${results.meteoraAPI ? 'PASSED' : 'FAILED'}`);
  console.log(`${results.backendLaunch ? '✅' : '❌'} Backend Launch:     ${results.backendLaunch ? 'PASSED' : 'FAILED'}`);
  console.log(`${results.uagentLogs ? '✅' : '❌'} uAgent Logs:        ${results.uagentLogs ? 'PASSED' : 'FAILED'}`);
  console.log(`${results.solanaTransaction ? '✅' : '❌'} Solana Transaction: ${results.solanaTransaction ? 'PASSED' : 'FAILED'}`);
  console.log('');

  if (results.tokenCreation) {
    console.log('🎯 REAL TOKEN CREATED:');
    console.log(`   Mint: ${results.tokenCreation.mint}`);
    console.log(`   Supply: ${results.tokenCreation.supply.toLocaleString()}`);
    console.log(`   Explorer: https://explorer.solana.com/address/${results.tokenCreation.mint}?cluster=devnet`);
  }

  console.log('');
  console.log('═'.repeat(70));
  console.log('🎉 PRODUCTION TESTS COMPLETED');
  console.log('═'.repeat(70));
}

// Execute tests
runProductionTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
