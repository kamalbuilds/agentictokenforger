import { apiClient } from './client';
import { Portfolio, Transaction, APIError } from './types';

/**
 * Get user portfolio by wallet address
 */
export async function getPortfolio(walletAddress: string): Promise<Portfolio> {
  try {
    const response = await apiClient.get<Portfolio>(`/api/portfolio/${walletAddress}`);
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch portfolio',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Get transaction history for wallet
 */
export async function getTransactions(
  walletAddress: string,
  params?: {
    limit?: number;
    offset?: number;
    type?: 'buy' | 'sell' | 'transfer';
  }
): Promise<Transaction[]> {
  try {
    const response = await apiClient.get<Transaction[]>(
      `/api/portfolio/${walletAddress}/transactions`,
      { params }
    );
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch transactions',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Refresh portfolio data
 */
export async function refreshPortfolio(walletAddress: string): Promise<Portfolio> {
  try {
    const response = await apiClient.post<Portfolio>(
      `/api/portfolio/${walletAddress}/refresh`
    );
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to refresh portfolio',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}
