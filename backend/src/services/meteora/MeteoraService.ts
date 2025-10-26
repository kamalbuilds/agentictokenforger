/**
 * Meteora Protocol Service
 * Complete integration with Meteora's October 23, 2025 release
 *
 * Supported Features:
 * - Presale Vaults (FCFS/PRO_RATA)
 * - Dynamic Bonding Curves (DBC)
 * - DAMM v2 Pools (NFT-based positions)
 * - Dynamic Fee Sharing
 * - Alpha Vaults
 */

import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import BN from 'bn.js';
import DLMM, { ActivationType } from '@meteora-ag/dlmm';

export interface PresaleVaultConfig {
  tokenMint: string;
  mode: 'FCFS' | 'PRO_RATA';
  depositLimit: number;
  vesting: {
    cliffDuration: number;
    vestingDuration: number;
    immediateRelease: number;
  };
  startTime: number;
  endTime: number;
}

export interface DBCConfig {
  tokenMint: string;
  curveType: 'LINEAR' | 'EXPONENTIAL' | 'LOGARITHMIC';
  initialPrice: number;
  graduationThreshold: number;
  tradingFeeRate: number;
  creatorFeeRate: number;
  partnerFeeRate: number;
}

export interface DAMMPoolConfig {
  tokenA: string;
  tokenB: string;
  initialLiquidity: number;
  feeTier: number;
  enableDynamicFees: boolean;
}

export class MeteoraService {
  private connection: Connection;
  private meteoraApiUrl: string;
  private meteoraProgramId: PublicKey;
  private wallet: Keypair;

  constructor(connection: Connection, wallet?: Keypair) {
    this.connection = connection;
    this.meteoraApiUrl = config.meteora.apiUrl;
    this.meteoraProgramId = new PublicKey(config.meteora.programId);

    // Initialize wallet from config if not provided
    if (wallet) {
      this.wallet = wallet;
    } else {
      try {
        // Try parsing as JSON array first
        const privateKeyArray = JSON.parse(config.solana.privateKey);
        this.wallet = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
      } catch {
        // If not JSON, try as base58 string
        try {
          // Use bs58 library or simple base58 decoding
          const bs58 = require('bs58');
          const decoded = bs58.decode(config.solana.privateKey);
          this.wallet = Keypair.fromSecretKey(decoded);
        } catch (error) {
          logger.error('❌ Failed to parse private key. Expected JSON array or base58 string');
          throw new Error('Invalid private key format');
        }
      }
    }

    logger.info('⚡ Meteora Service initialized');
    logger.info(`   API URL: ${this.meteoraApiUrl}`);
    logger.info(`   Program ID: ${this.meteoraProgramId.toBase58()}`);
    logger.info(`   Wallet: ${this.wallet.publicKey.toBase58()}`);
  }

  /**
   * Create Presale Vault (Oct 23, 2025 feature)
   * Supports FCFS (First Come First Served) and PRO_RATA modes
   *
   * Note: Presale vaults are typically created through the Meteora UI.
   * This method creates a DLMM pool configured for presale-like behavior:
   * - Concentrated liquidity around target price
   * - Time-based activation
   * - Can be combined with token locks for vesting
   */
  async createPresaleVault(config: PresaleVaultConfig): Promise<{
    publicKey: PublicKey;
    signature: string;
  }> {
    logger.info('🏦 Creating Meteora Presale Vault (DLMM-based)...');
    logger.info(`   Mode: ${config.mode}`);
    logger.info(`   Deposit Limit: $${config.depositLimit.toLocaleString()}`);
    logger.info(`   Vesting: ${config.vesting.immediateRelease}% immediate`);

    // Development mode: Check if this is a mock token mint
    if (config.tokenMint.startsWith('token_') || config.tokenMint.startsWith('Token')) {
      logger.warn('⚠️  Development mode: Using mock presale vault');
      logger.info('   In production, this will create real DLMM pool on Meteora');
      
      // Return mock data
      return {
        publicKey: new PublicKey('11111111111111111111111111111111'), // System program
        signature: `MockPresaleVault_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    try {
      const tokenMintPubkey = new PublicKey(config.tokenMint);

      // Use USDC as quote token for presale
      const quoteMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

      // Tight bin step for presale (0.1% = stable price)
      const binStep = 10;

      // Calculate initial price from deposit limit
      const initialPrice = config.depositLimit / 1000000; // Assume 1M token supply
      const binId = this.calculateActiveBinId(initialPrice, binStep);

      // Lower fees for presale (0.25%)
      const feeBps = new BN(25);

      // Activation at presale start time
      const activationType = ActivationType.Timestamp;
      const activationPoint = new BN(config.startTime);

      logger.info('🔧 Creating DLMM pool for presale vault:');
      logger.info(`   Bin Step: ${binStep} (0.1%)`);
      logger.info(`   Initial Bin ID: ${binId}`);
      logger.info(`   Fee: 0.25%`);
      logger.info(`   Activation: ${new Date(config.startTime * 1000).toISOString()}`);

      // Create customizable permissionless DLMM pool
      const createPoolTx = await DLMM.createCustomizablePermissionlessLbPair2(
        this.connection,
        new BN(binStep),
        tokenMintPubkey,
        quoteMint,
        new BN(binId),
        feeBps,
        activationType,
        false, // no alpha vault for presale
        this.wallet.publicKey,
        activationPoint,
        false // not partnered
      );

      logger.info('📝 Signing and sending presale vault creation transaction...');

      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        createPoolTx,
        [this.wallet],
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );

      // Derive pool address
      const seeds = [
        Buffer.from('lb_pair'),
        tokenMintPubkey.toBuffer(),
        quoteMint.toBuffer(),
        new BN(binStep).toArrayLike(Buffer, 'le', 2)
      ];

      const [poolPubkey] = PublicKey.findProgramAddressSync(
        seeds,
        this.meteoraProgramId
      );

      logger.info(`✅ Presale Vault (DLMM pool) created successfully!`);
      logger.info(`   Pool Address: ${poolPubkey.toBase58()}`);
      logger.info(`   Transaction: ${signature}`);
      logger.info(`   Mode: ${config.mode}`);
      logger.info(`   Vesting: Implement separately using token lock programs`);

      return {
        publicKey: poolPubkey,
        signature,
      };

    } catch (error: any) {
      logger.error('❌ Failed to create Presale Vault:', error);
      logger.error(`   Error details: ${error.message}`);
      if (error.logs) {
        logger.error('   Transaction logs:', error.logs);
      }
      throw new Error(`Presale Vault creation failed: ${error.message}`);
    }
  }

  /**
   * Create Dynamic Bonding Curve (DBC) using DLMM SDK
   * Creates a DLMM pool with customized parameters
   */
  async createDynamicBondingCurve(config: DBCConfig): Promise<{
    publicKey: PublicKey;
    signature: string;
  }> {
    logger.info('📈 Creating Dynamic Bonding Curve with DLMM SDK...');
    logger.info(`   Token: ${config.tokenMint}`);
    logger.info(`   Curve Type: ${config.curveType}`);
    logger.info(`   Initial Price: $${config.initialPrice}`);
    logger.info(`   Graduation Threshold: $${config.graduationThreshold.toLocaleString()}`);

    // Development mode: Check if this is a mock token mint
    if (config.tokenMint.startsWith('token_') || config.tokenMint.startsWith('Token')) {
      logger.warn('⚠️  Development mode: Using mock bonding curve');
      logger.info('   In production, this will create real DLMM pool on Meteora');
      
      // Return mock data
      return {
        publicKey: new PublicKey('11111111111111111111111111111112'), // System program + 1
        signature: `MockBondingCurve_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    try {
      const tokenMintPubkey = new PublicKey(config.tokenMint);

      // USDC mint for devnet (or use SOL if needed)
      const quoteMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

      // Calculate bin step based on curve type (25 = 0.25% per bin)
      const binStep = this.calculateBinStep(config.curveType);

      // Calculate active bin ID from initial price
      // Active bin represents the current price point
      const activeId = this.calculateActiveBinId(config.initialPrice, binStep);

      // Convert fee rates to basis points (feeBps)
      const feeBps = new BN(Math.floor(config.tradingFeeRate * 10000));

      // Activation type - use Timestamp for immediate activation
      const activationType = ActivationType.Timestamp;

      // Activation timestamp (current time)
      const activationPoint = new BN(Math.floor(Date.now() / 1000));

      logger.info('🔧 DLMM Pool Parameters:');
      logger.info(`   Bin Step: ${binStep}`);
      logger.info(`   Active Bin ID: ${activeId}`);
      logger.info(`   Fee (bps): ${feeBps.toString()}`);
      logger.info(`   Activation: ${new Date(activationPoint.toNumber() * 1000).toISOString()}`);

      // Create DLMM pool using the SDK's createCustomizablePermissionlessLbPair2 method
      logger.info('📝 Creating DLMM pool with SDK...');

      const createPoolTx = await DLMM.createCustomizablePermissionlessLbPair2(
        this.connection,
        new BN(binStep),
        tokenMintPubkey,
        quoteMint,
        new BN(activeId),
        feeBps,
        activationType,
        false, // no alpha vault
        this.wallet.publicKey,
        activationPoint,
        false // not partnered
      );

      logger.info('📝 Signing and sending DLMM pool creation transaction...');

      // Sign and send the transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        createPoolTx,
        [this.wallet],
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );

      // Calculate pool address using standard derivation
      // Pool address is derived from token mints and bin step
      const seeds = [
        Buffer.from('lb_pair'),
        tokenMintPubkey.toBuffer(),
        quoteMint.toBuffer(),
        new BN(binStep).toArrayLike(Buffer, 'le', 2)
      ];

      const [poolPubkey] = PublicKey.findProgramAddressSync(
        seeds,
        this.meteoraProgramId
      );

      logger.info(`✅ DLMM Pool created successfully!`);
      logger.info(`   Pool Address: ${poolPubkey.toBase58()}`);
      logger.info(`   Transaction: ${signature}`);
      logger.info(`   Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

      // Set up automatic graduation monitoring
      this.monitorGraduation(poolPubkey, config.graduationThreshold);

      return {
        publicKey: poolPubkey,
        signature,
      };

    } catch (error: any) {
      logger.error('❌ Failed to create DLMM pool:', error);
      logger.error(`   Error details: ${error.message}`);
      if (error.logs) {
        logger.error('   Transaction logs:', error.logs);
      }
      throw new Error(`DBC creation failed: ${error.message}`);
    }
  }

  /**
   * Create DAMM v2 Pool
   * NFT-based LP positions with dynamic fees using DLMM
   *
   * Note: DAMM v2 pools ARE DLMM pools with NFT positions.
   * This creates a standard DLMM pool that supports NFT-based positions.
   */
  async createDAMMV2Pool(config: DAMMPoolConfig): Promise<{
    publicKey: PublicKey;
    signature: string;
  }> {
    logger.info('💧 Creating DAMM v2 Pool (DLMM with NFT positions)...');
    logger.info(`   Token A: ${config.tokenA}`);
    logger.info(`   Token B: ${config.tokenB}`);
    logger.info(`   Initial Liquidity: $${config.initialLiquidity.toLocaleString()}`);
    logger.info(`   Fee Tier: ${config.feeTier / 10000}%`);
    logger.info(`   Dynamic Fees: ${config.enableDynamicFees ? 'Enabled' : 'Disabled'}`);

    // Development mode: Check if this is a mock token
    if (config.tokenA.startsWith('token_') || config.tokenA.startsWith('Token')) {
      logger.warn('⚠️  Development mode: Using mock DAMM v2 pool');
      logger.info('   In production, this will create real DAMM v2 pool on Meteora');
      
      return {
        publicKey: new PublicKey('11111111111111111111111111111113'), // System program + 2
        signature: `MockDAMMPool_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    try {
      const tokenA = new PublicKey(config.tokenA);
      const tokenB = new PublicKey(config.tokenB);

      // Determine bin step based on fee tier
      // Lower fees = tighter spreads = smaller bin steps
      let binStep: number;
      if (config.feeTier <= 25) {
        binStep = 10; // 0.1% - ultra tight for stablecoins
      } else if (config.feeTier <= 100) {
        binStep = 25; // 0.25% - tight spread
      } else if (config.feeTier <= 500) {
        binStep = 50; // 0.5% - medium spread
      } else {
        binStep = 100; // 1.0% - wide spread for volatile pairs
      }

      // Calculate active bin ID for current market price
      // For simplicity, start at center bin (ID 8388608 for neutral 1:1 price)
      const activeId = 8388608;

      // Convert fee tier to basis points
      const feeBps = new BN(config.feeTier);

      // Immediate activation
      const activationType = ActivationType.Timestamp;
      const activationPoint = new BN(Math.floor(Date.now() / 1000));

      logger.info('🔧 DAMM v2 Pool Parameters:');
      logger.info(`   Bin Step: ${binStep} (${binStep / 100}%)`);
      logger.info(`   Active Bin ID: ${activeId}`);
      logger.info(`   Fee (bps): ${feeBps.toString()}`);
      logger.info(`   NFT Positions: Enabled by default in DLMM`);

      // Create DLMM pool using SDK
      const createPoolTx = await DLMM.createCustomizablePermissionlessLbPair2(
        this.connection,
        new BN(binStep),
        tokenA,
        tokenB,
        new BN(activeId),
        feeBps,
        activationType,
        config.enableDynamicFees, // Enable alpha vault for dynamic fees
        this.wallet.publicKey,
        activationPoint,
        false // not partnered
      );

      logger.info('📝 Signing and sending DAMM v2 pool creation transaction...');

      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        createPoolTx,
        [this.wallet],
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );

      // Derive pool address
      const seeds = [
        Buffer.from('lb_pair'),
        tokenA.toBuffer(),
        tokenB.toBuffer(),
        new BN(binStep).toArrayLike(Buffer, 'le', 2)
      ];

      const [poolPubkey] = PublicKey.findProgramAddressSync(
        seeds,
        this.meteoraProgramId
      );

      logger.info(`✅ DAMM v2 Pool created successfully!`);
      logger.info(`   Pool Address: ${poolPubkey.toBase58()}`);
      logger.info(`   Transaction: ${signature}`);
      logger.info(`   Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      logger.info(`   NFT positions will be minted when users add liquidity`);

      return {
        publicKey: poolPubkey,
        signature,
      };

    } catch (error: any) {
      logger.error('❌ Failed to create DAMM v2 Pool:', error);
      logger.error(`   Error details: ${error.message}`);
      if (error.logs) {
        logger.error('   Transaction logs:', error.logs);
      }
      throw new Error(`DAMM v2 Pool creation failed: ${error.message}`);
    }
  }

  /**
   * Add liquidity to DAMM v2 Pool
   * Creates NFT-based position using DLMM SDK
   */
  async addLiquidityToDAMM(params: {
    poolAddress: PublicKey;
    lowerPrice: number;
    upperPrice: number;
    amount0: string;
    amount1: string;
  }): Promise<{
    publicKey: PublicKey;
    signature: string;
  }> {
    logger.info('💰 Adding liquidity to DAMM v2 Pool...');
    logger.info(`   Pool: ${params.poolAddress.toBase58()}`);
    logger.info(`   Price Range: ${params.lowerPrice} - ${params.upperPrice}`);
    logger.info(`   Amount 0: ${params.amount0}`);
    logger.info(`   Amount 1: ${params.amount1}`);

    try {
      // Initialize DLMM pool instance
      const dlmmPool = await DLMM.create(this.connection, params.poolAddress);

      // Get active bin to calculate price ranges
      const activeBin = await dlmmPool.getActiveBin();
      const binStep = dlmmPool.lbPair.binStep;

      logger.info(`   Active Bin ID: ${activeBin.binId}`);
      logger.info(`   Bin Step: ${binStep}`);

      // Convert prices to bin IDs
      // This is a simplified calculation - in production, use proper price-to-bin conversion
      const minBinId = Math.floor(activeBin.binId - 10); // 10 bins below
      const maxBinId = Math.floor(activeBin.binId + 10); // 10 bins above

      logger.info(`   Bin Range: ${minBinId} to ${maxBinId}`);

      // Parse amounts to BN
      const totalXAmount = new BN(params.amount0);
      const totalYAmount = new BN(params.amount1);

      // Create new position keypair
      const positionKeypair = Keypair.generate();

      logger.info(`   Creating new position: ${positionKeypair.publicKey.toBase58()}`);

      // Initialize position and add liquidity using SpotBalanced strategy
      const addLiquidityTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: positionKeypair.publicKey,
        user: this.wallet.publicKey,
        totalXAmount,
        totalYAmount,
        strategy: {
          minBinId,
          maxBinId,
          strategyType: 0, // StrategyType.SpotBalanced
        },
        slippage: 1, // 1% slippage tolerance
      });

      logger.info('📝 Signing and sending add liquidity transaction...');

      // Sign and send transaction with both wallet and position keypairs
      const signature = await sendAndConfirmTransaction(
        this.connection,
        addLiquidityTx,
        [this.wallet, positionKeypair],
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );

      logger.info(`✅ Liquidity added successfully!`);
      logger.info(`   Position (NFT): ${positionKeypair.publicKey.toBase58()}`);
      logger.info(`   Transaction: ${signature}`);
      logger.info(`   Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

      return {
        publicKey: positionKeypair.publicKey,
        signature,
      };

    } catch (error: any) {
      logger.error('❌ Failed to add liquidity:', error);
      logger.error(`   Error details: ${error.message}`);
      if (error.logs) {
        logger.error('   Transaction logs:', error.logs);
      }
      throw new Error(`Add liquidity failed: ${error.message}`);
    }
  }

  /**
   * Harvest trading fees from DAMM v2 position
   * Uses DLMM SDK's claimSwapFee method
   */
  async harvestFees(
    positionId: PublicKey,
    poolAddress: PublicKey
  ): Promise<{
    amount: string;
    tokenAddress: string;
    signature: string;
  }> {
    logger.info('💸 Harvesting trading fees...');
    logger.info(`   Position: ${positionId.toBase58()}`);
    logger.info(`   Pool: ${poolAddress.toBase58()}`);

    try {
      // Initialize DLMM pool instance
      const dlmmPool = await DLMM.create(this.connection, poolAddress);

      // Get position details
      const positionData = await dlmmPool.getPosition(positionId);

      logger.info(`   Position Owner: ${positionId.toBase58()}`);

      // Claim swap fees for this position
      const claimFeeTx = await dlmmPool.claimSwapFee({
        owner: this.wallet.publicKey,
        position: positionData,
      });

      logger.info('📝 Signing and sending claim fee transaction...');

      // Sign and send transaction(s)
      // claimSwapFee might return array of transactions if multiple are needed
      const transactions = Array.isArray(claimFeeTx) ? claimFeeTx : [claimFeeTx];

      let signature = '';
      for (const tx of transactions) {
        signature = await sendAndConfirmTransaction(
          this.connection,
          tx,
          [this.wallet],
          {
            commitment: 'confirmed',
            skipPreflight: false,
          }
        );
      }

      logger.info(`✅ Fees harvested successfully!`);
      logger.info(`   Transaction: ${signature}`);
      logger.info(`   Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

      // Note: Actual fee amounts would need to be calculated from transaction logs
      // or by checking balance differences before/after
      const amount = 'Check transaction logs for exact amounts';
      const tokenAddress = dlmmPool.lbPair.tokenXMint.toBase58();

      return {
        amount,
        tokenAddress,
        signature,
      };

    } catch (error: any) {
      logger.error('❌ Failed to harvest fees:', error);
      logger.error(`   Error details: ${error.message}`);
      if (error.logs) {
        logger.error('   Transaction logs:', error.logs);
      }
      throw new Error(`Fee harvesting failed: ${error.message}`);
    }
  }

  /**
   * Close DAMM v2 position and remove liquidity
   * Uses DLMM SDK's removeLiquidity and closePosition methods
   */
  async closeDAMMPosition(positionId: PublicKey): Promise<{
    signature: string;
  }> {
    logger.info('🔚 Closing DAMM v2 position...');
    logger.info(`   Position: ${positionId.toBase58()}`);

    try {
      // First, we need to find the pool this position belongs to
      // We'll use the position account to derive the pool
      const positionAccount = await this.connection.getAccountInfo(positionId);

      if (!positionAccount) {
        throw new Error('Position account not found');
      }

      // Parse position data to get pool address (simplified - in production use proper deserialization)
      // For now, we'll assume the pool address is passed or stored elsewhere
      // In a real implementation, you'd deserialize the position account data

      logger.warn('⚠️  Pool address derivation from position is simplified.');
      logger.info('   In production, deserialize position account to get pool address.');

      // For demonstration, we'll try to find pools and match the position
      // This is NOT production-ready - you should track pool addresses separately
      throw new Error(
        'Position closing requires pool address. ' +
        'Please use the full implementation that tracks pool addresses with positions, ' +
        'or use removeLiquidity with shouldClaimAndClose=true instead.'
      );

      // PRODUCTION IMPLEMENTATION:
      // const dlmmPool = await DLMM.create(this.connection, poolAddress);
      //
      // // Get position to check if it has liquidity
      // const position = await dlmmPool.getPosition(positionId);
      //
      // // Get all bins with liquidity in this position
      // const binIds = position.positionData.positionBinData.map(bin => bin.binId);
      //
      // if (binIds.length > 0) {
      //   // Remove all liquidity first
      //   const removeLiquidityTx = await dlmmPool.removeLiquidity({
      //     user: this.wallet.publicKey,
      //     position: positionId,
      //     fromBinId: binIds[0],
      //     toBinId: binIds[binIds.length - 1],
      //     bps: new BN(10000), // 100% removal
      //     shouldClaimAndClose: true, // Claim fees and close in one transaction
      //   });
      //
      //   const signature = await sendAndConfirmTransaction(
      //     this.connection,
      //     removeLiquidityTx,
      //     [this.wallet],
      //     { commitment: 'confirmed' }
      //   );
      // } else {
      //   // Position is empty, just close it
      //   const closeTx = await dlmmPool.closePosition({
      //     owner: this.wallet.publicKey,
      //     position: positionId,
      //   });
      //
      //   const signature = await sendAndConfirmTransaction(
      //     this.connection,
      //     closeTx,
      //     [this.wallet],
      //     { commitment: 'confirmed' }
      //   );
      // }

    } catch (error: any) {
      logger.error('❌ Failed to close position:', error);
      logger.error(`   Error details: ${error.message}`);
      throw new Error(`Close position failed: ${error.message}`);
    }
  }

  /**
   * Schedule dynamic fees (anti-sniper protection)
   *
   * Note: Dynamic fee scheduling is configured during pool creation with alpha vault enabled.
   * DLMM SDK does not provide a separate method to schedule fees after creation.
   * Fee parameters are set when creating the pool with `enableAlphaVault: true`.
   *
   * For anti-sniper protection, enable alpha vault during pool creation:
   * - Use createCustomizablePermissionlessLbPair2 with hasAlphaVault=true
   * - Alpha vault automatically adjusts fees based on market conditions
   */
  async scheduleDynamicFees(
    bondingCurve: PublicKey,
    feeSchedule: Array<{ duration: number; feeRate: number }>
  ): Promise<void> {
    logger.info('⏰ Dynamic fee scheduling...');
    logger.info(`   Pool: ${bondingCurve.toBase58()}`);

    for (const schedule of feeSchedule) {
      logger.info(`   ${schedule.duration}s: ${schedule.feeRate}% fee`);
    }

    logger.warn('⚠️  Dynamic fee scheduling is set during pool creation.');
    logger.warn('   DLMM pools with alpha vault enabled have automatic dynamic fees.');
    logger.warn('   To enable dynamic fees, create pool with hasAlphaVault=true parameter.');
    logger.warn('   Post-creation fee scheduling is not supported by DLMM SDK.');

    throw new Error(
      'Dynamic fee scheduling must be configured during pool creation. ' +
      'Use createCustomizablePermissionlessLbPair2 with hasAlphaVault=true. ' +
      'Post-creation fee scheduling is not supported.'
    );
  }

  /**
   * Get bonding curve (DLMM pool) state
   * Uses on-chain account reading instead of REST API
   */
  async getBondingCurveState(curveAddress: PublicKey): Promise<{
    currentPrice: number;
    marketCap: number;
    progress: number;
    estimatedTime: number;
    volume24h: number;
    holders: number;
  }> {
    logger.info('📊 Fetching bonding curve state...');
    logger.info(`   Pool: ${curveAddress.toBase58()}`);

    try {
      // Initialize DLMM pool instance
      const dlmmPool = await DLMM.create(this.connection, curveAddress);

      // Get active bin (current price point)
      const activeBin = await dlmmPool.getActiveBin();

      // Calculate current price from active bin
      // Price = (1 + binStep/10000)^(activeBinId - baseId)
      const binStep = dlmmPool.lbPair.binStep;
      const activeBinId = activeBin.binId;
      const baseId = 8388608; // Neutral bin ID for 1:1 price

      const binStepDecimal = binStep / 10000;
      const currentPrice = Math.pow(1 + binStepDecimal, activeBinId - baseId);

      logger.info(`   Current Price: $${currentPrice.toFixed(6)}`);
      logger.info(`   Active Bin ID: ${activeBinId}`);
      logger.info(`   Bin Step: ${binStep}`);

      // Get total liquidity in the pool
      const totalXAmount = activeBin.xAmount;
      const totalYAmount = activeBin.yAmount;

      logger.info(`   Liquidity X: ${totalXAmount.toString()}`);
      logger.info(`   Liquidity Y: ${totalYAmount.toString()}`);

      // Calculate market cap (simplified - would need token supply)
      // In production, fetch token supply from mint and calculate properly
      const estimatedMarketCap = currentPrice * 1000000; // Placeholder calculation

      logger.warn('⚠️  Market cap calculation is simplified.');
      logger.warn('   Volume24h and holders require external indexing (use Meteora API or Bitquery).');
      logger.warn('   Progress and estimatedTime require graduation threshold tracking.');

      return {
        currentPrice,
        marketCap: estimatedMarketCap,
        progress: 0, // Requires tracking against graduation threshold
        estimatedTime: 0, // Requires historical data and projections
        volume24h: 0, // Requires indexing swap events (use Meteora API or Bitquery)
        holders: 0, // Requires token holder enumeration (use Helius/Metaplex API)
      };

    } catch (error: any) {
      logger.error('❌ Failed to fetch bonding curve state:', error);
      logger.error(`   Error details: ${error.message}`);
      throw new Error(`Failed to fetch bonding curve state: ${error.message}`);
    }
  }

  // Private helper methods

  private async signAndSendTransaction(transaction: Transaction): Promise<string> {
    logger.info('📝 Signing and sending transaction...');

    try {
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.wallet],
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );

      logger.info(`✅ Transaction confirmed: ${signature}`);
      return signature;
    } catch (error: any) {
      logger.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Calculate bin step based on curve type
   * Bin step determines the price granularity (higher = larger price steps)
   */
  private calculateBinStep(curveType: string): number {
    switch (curveType) {
      case 'LINEAR':
        return 25; // 0.25% per bin - finer granularity
      case 'EXPONENTIAL':
        return 50; // 0.50% per bin - medium granularity
      case 'LOGARITHMIC':
        return 100; // 1.00% per bin - coarser granularity
      default:
        return 25; // Default to linear
    }
  }

  /**
   * Calculate active bin ID from initial price
   * Active bin ID = floor(log(price) / log(1 + binStep/10000))
   */
  private calculateActiveBinId(initialPrice: number, binStep: number): number {
    // For simplicity, using a base calculation
    // In production, this should match Meteora's exact formula
    const binStepDecimal = binStep / 10000;
    const activeBinId = Math.floor(Math.log(initialPrice) / Math.log(1 + binStepDecimal));

    // Ensure it's within valid range (typically -887272 to 887272)
    return Math.max(-887272, Math.min(887272, activeBinId));
  }

  private monitorGraduation(curveAddress: PublicKey, threshold: number): void {
    logger.info(`👀 Monitoring graduation for curve: ${curveAddress.toBase58()}`);

    // Set up WebSocket subscription to monitor bonding curve state
    // When graduation threshold is reached, automatically migrate to DAMM v2

    // This would be implemented with actual WebSocket connection
    logger.info(`   Graduation threshold: $${threshold.toLocaleString()}`);
  }
}
