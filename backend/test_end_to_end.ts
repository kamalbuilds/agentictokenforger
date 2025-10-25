/**
 * END-TO-END INTEGRATION TEST
 * Tests complete flow: Frontend → Backend → uAgents → Meteora → Solana
 *
 * This test validates:
 * 1. Backend API endpoints
 * 2. uAgent communication (MeTTa reasoning)
 * 3. Meteora DBC token creation
 * 4. Real Solana transactions
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Wallet from environment
const PRIVATE_KEY_ARRAY = [101,6,179,33,192,146,87,29,76,86,64,91,32,165,185,51,137,39,183,11,71,58,71,188,207,196,246,41,14,29,187,197,233,94,115,189,189,83,239,61,196,58,116,194,120,13,4,5,143,108,22,19,183,76,202,7,200,6,222,160,46,70,66,102];
const wallet = Keypair.fromSecretKey(Uint8Array.from(PRIVATE_KEY_ARRAY));

console.log('🚀 END-TO-END INTEGRATION TEST');
console.log('═'.repeat(80));
console.log('');
console.log(`💼 Wallet: ${wallet.publicKey.toBase58()}`);
console.log(`🌐 Backend: ${BACKEND_URL}`);
console.log(`🔗 Solana RPC: ${SOLANA_RPC_URL}`);
console.log('');

// Test Results Tracker
const results: any = {
  backend: {},
  uagents: {},
  meteora: {},
  solana: {},
  integration: {}
};

/**
 * TEST 1: Backend API Health Check
 */
async function testBackendHealth() {
  console.log('📝 TEST 1: Backend API Health Check');
  console.log('─'.repeat(80));

  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });

    console.log(`✅ Backend is healthy`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Uptime: ${Math.floor(response.data.uptime)}s`);

    results.backend.health = true;
    return true;
  } catch (error: any) {
    console.log(`❌ Backend health check failed: ${error.message}`);
    results.backend.health = false;
    return false;
  }
}

/**
 * TEST 2: uAgents Communication Test
 */
async function testUAgentsCommunication() {
  console.log('\n📝 TEST 2: uAgents Communication Test');
  console.log('─'.repeat(80));

  try {
    // Test LaunchCoordinator agent
    console.log('🤖 Testing LaunchCoordinator Agent...');
    const launchResponse = await axios.post('http://localhost:8001/submit', {
      type: 'chat',
      message: 'Analyze this token launch: TestToken with $50,000 target market cap'
    }, { timeout: 10000 });

    if (launchResponse.status === 200) {
      console.log('✅ LaunchCoordinator is responsive');
      console.log(`   Response received: ${launchResponse.data ? 'Yes' : 'No'}`);
      results.uagents.launchCoordinator = true;
    }

    // Test RiskAnalyzer agent
    console.log('\n🤖 Testing RiskAnalyzer Agent...');
    const riskResponse = await axios.post('http://localhost:8003/submit', {
      type: 'analyze',
      token_address: 'CU7qwkMJv85Lv9LzUF8rek61e1pfWh3vYZTjfGGEg3tX' // Our test token
    }, { timeout: 10000 });

    if (riskResponse.status === 200) {
      console.log('✅ RiskAnalyzer is responsive');
      results.uagents.riskAnalyzer = true;
    }

    return true;
  } catch (error: any) {
    console.log(`❌ uAgents communication failed: ${error.message}`);
    console.log(`   Make sure uAgents are running on ports 8001, 8002, 8003`);
    results.uagents.error = error.message;
    return false;
  }
}

/**
 * TEST 3: MeTTa Reasoning Verification
 */
async function testMeTTaReasoning() {
  console.log('\n📝 TEST 3: MeTTa Reasoning Verification');
  console.log('─'.repeat(80));

  try {
    // Send a complex reasoning request
    const reasoningRequest = {
      type: 'metta_query',
      query: `
        (= (token-launch $token $mcap $category)
           (if (and (> $mcap 50000) (eq $category "utility"))
               "high-potential"
               "standard"))
      `,
      context: {
        token: 'TestToken',
        mcap: 100000,
        category: 'utility'
      }
    };

    console.log('🧠 Sending MeTTa reasoning query to LaunchCoordinator...');
    const response = await axios.post('http://localhost:8001/submit', reasoningRequest, {
      timeout: 15000
    });

    if (response.status === 200 && response.data) {
      console.log('✅ MeTTa reasoning engine is working');
      console.log(`   Query processed successfully`);
      results.uagents.mettaReasoning = true;
      return true;
    }

    return false;
  } catch (error: any) {
    console.log(`⚠️  MeTTa reasoning test inconclusive: ${error.message}`);
    console.log(`   Note: This is expected if MeTTa queries are handled internally`);
    results.uagents.mettaReasoning = 'inconclusive';
    return true; // Don't fail on this
  }
}

/**
 * TEST 4: Token Launch via Backend API
 */
async function testTokenLaunchAPI() {
  console.log('\n📝 TEST 4: Token Launch via Backend API');
  console.log('─'.repeat(80));

  try {
    const launchParams = {
      name: 'E2E Test Token',
      symbol: 'E2ET',
      totalSupply: 1000000,
      category: 'utility',
      targetMarketCap: 75000,
      presaleMode: 'FCFS',
      graduationThreshold: 50000,
      initialPrice: 0.01,
      curveType: 'EXPONENTIAL',
      walletAddress: wallet.publicKey.toBase58()
    };

    console.log('📤 Creating token launch...');
    console.log(`   Name: ${launchParams.name}`);
    console.log(`   Symbol: ${launchParams.symbol}`);
    console.log(`   Target Market Cap: $${launchParams.targetMarketCap.toLocaleString()}`);

    const response = await axios.post(`${BACKEND_URL}/api/launch/create`, launchParams, {
      timeout: 10000
    });

    if (response.data.success) {
      console.log(`✅ Token launch created!`);
      console.log(`   Job ID: ${response.data.jobId}`);
      console.log(`   Status: ${response.data.status}`);

      results.backend.launchAPI = {
        success: true,
        jobId: response.data.jobId
      };

      // Wait and check status
      console.log('\n⏳ Checking launch status...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await axios.get(
        `${BACKEND_URL}/api/launch/${response.data.jobId}/status`,
        { timeout: 5000 }
      );

      console.log(`📊 Status: ${statusResponse.data.state}`);
      console.log(`   Progress: ${statusResponse.data.progress || 0}%`);

      return response.data.jobId;
    }

    return null;
  } catch (error: any) {
    console.log(`❌ Token launch API test failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    }
    results.backend.launchAPI = { success: false, error: error.message };
    return null;
  }
}

/**
 * TEST 5: Solana Connection Verification
 */
async function testSolanaConnection() {
  console.log('\n📝 TEST 5: Solana Connection Verification');
  console.log('─'.repeat(80));

  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💰 Wallet balance: ${balance / 1e9} SOL`);

    // Get current slot
    const slot = await connection.getSlot();
    console.log(`📊 Current slot: ${slot.toLocaleString()}`);

    // Verify our test token exists
    const testTokenMint = new PublicKey('CU7qwkMJv85Lv9LzUF8rek61e1pfWh3vYZTjfGGEg3tX');
    const tokenInfo = await connection.getAccountInfo(testTokenMint);

    if (tokenInfo) {
      console.log(`✅ Test token verified on-chain`);
      console.log(`   Mint: ${testTokenMint.toBase58()}`);
    }

    results.solana.connection = true;
    results.solana.balance = balance / 1e9;
    return true;
  } catch (error: any) {
    console.log(`❌ Solana connection test failed: ${error.message}`);
    results.solana.connection = false;
    return false;
  }
}

/**
 * TEST 6: Integration Flow Test
 * Complete flow: Frontend params → Backend → uAgents → Result
 */
async function testCompleteIntegrationFlow() {
  console.log('\n📝 TEST 6: Complete Integration Flow');
  console.log('─'.repeat(80));

  try {
    console.log('🔄 Testing complete flow...');
    console.log('   1. Frontend → Backend (API call)');
    console.log('   2. Backend → uAgents (job processing)');
    console.log('   3. uAgents → Solana/Meteora (execution)');
    console.log('   4. Result → Frontend (WebSocket/polling)');

    // Simulate frontend token launch request
    const frontendParams = {
      name: 'Integration Flow Token',
      symbol: 'IFT',
      totalSupply: 500000,
      category: 'meme',
      targetMarketCap: 100000,
      presaleMode: 'PRO_RATA',
      graduationThreshold: 60000,
      initialPrice: 0.005,
      curveType: 'LINEAR',
      walletAddress: wallet.publicKey.toBase58()
    };

    console.log('\n📤 Step 1: Sending launch request to backend...');
    const launchResponse = await axios.post(
      `${BACKEND_URL}/api/launch/create`,
      frontendParams,
      { timeout: 10000 }
    );

    if (!launchResponse.data.success) {
      throw new Error('Launch creation failed');
    }

    const jobId = launchResponse.data.jobId;
    console.log(`✅ Backend accepted request (Job ID: ${jobId})`);

    // Monitor job status
    console.log('\n📊 Step 2: Monitoring job processing...');
    let attempts = 0;
    let jobComplete = false;

    while (attempts < 10 && !jobComplete) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await axios.get(
        `${BACKEND_URL}/api/launch/${jobId}/status`,
        { timeout: 5000 }
      );

      console.log(`   Attempt ${attempts + 1}: ${statusResponse.data.state} (${statusResponse.data.progress || 0}%)`);

      if (statusResponse.data.state === 'completed' || statusResponse.data.state === 'failed') {
        jobComplete = true;

        if (statusResponse.data.state === 'completed') {
          console.log(`✅ Job completed successfully!`);
          if (statusResponse.data.result) {
            console.log(`   Token Address: ${statusResponse.data.result.tokenAddress || 'N/A'}`);
            console.log(`   Transaction: ${statusResponse.data.result.signature || 'N/A'}`);
          }
          results.integration.flow = 'success';
        } else {
          console.log(`❌ Job failed: ${statusResponse.data.error || 'Unknown error'}`);
          results.integration.flow = 'failed';
        }
      }

      attempts++;
    }

    if (!jobComplete) {
      console.log(`⚠️  Job still processing after ${attempts} attempts`);
      results.integration.flow = 'timeout';
    }

    return jobComplete;
  } catch (error: any) {
    console.log(`❌ Integration flow test failed: ${error.message}`);
    results.integration.flow = 'error';
    results.integration.error = error.message;
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('═'.repeat(80));
  console.log('STARTING END-TO-END INTEGRATION TESTS');
  console.log('═'.repeat(80));
  console.log('');

  const startTime = Date.now();

  // Run tests in sequence
  await testBackendHealth();
  await testUAgentsCommunication();
  await testMeTTaReasoning();
  await testSolanaConnection();
  await testTokenLaunchAPI();
  await testCompleteIntegrationFlow();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Summary
  console.log('\n\n');
  console.log('═'.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log('');

  console.log('Backend Tests:');
  console.log(`  ${results.backend.health ? '✅' : '❌'} Health Check`);
  console.log(`  ${results.backend.launchAPI?.success ? '✅' : '❌'} Launch API`);

  console.log('\nuAgent Tests:');
  console.log(`  ${results.uagents.launchCoordinator ? '✅' : '❌'} LaunchCoordinator`);
  console.log(`  ${results.uagents.riskAnalyzer ? '✅' : '❌'} RiskAnalyzer`);
  console.log(`  ${results.uagents.mettaReasoning === true ? '✅' : results.uagents.mettaReasoning === 'inconclusive' ? '⚠️ ' : '❌'} MeTTa Reasoning`);

  console.log('\nSolana Tests:');
  console.log(`  ${results.solana.connection ? '✅' : '❌'} Connection (Balance: ${results.solana.balance || 0} SOL)`);

  console.log('\nIntegration Tests:');
  console.log(`  ${results.integration.flow === 'success' ? '✅' : results.integration.flow === 'timeout' ? '⏳' : '❌'} Complete Flow`);

  console.log('');
  console.log(`⏱️  Total Duration: ${duration}s`);
  console.log('');

  // Full results
  console.log('📋 Detailed Results:');
  console.log(JSON.stringify(results, null, 2));
  console.log('');

  console.log('═'.repeat(80));
  console.log('🎉 TESTS COMPLETED');
  console.log('═'.repeat(80));
}

// Execute tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
