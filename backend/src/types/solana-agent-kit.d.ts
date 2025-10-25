/**
 * Type definitions for Solana Agent Kit
 * Stub implementation until actual package is available
 */

declare module '@sendaifun/solana-agent-kit' {
  export class SolanaAgentKit {
    constructor(config: {
      rpcUrl: string;
      privateKey: string;
    });

    deployToken(
      name: string,
      symbol: string,
      decimals: number,
      totalSupply: number
    ): Promise<{
      mint: string;
      signature: string;
    }>;

    transfer(params: any): Promise<any>;
    swap(params: any): Promise<any>;
    stake(params: any): Promise<any>;
  }
}
