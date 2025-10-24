import { apiClient } from './client';
import { Token, TokenDetails, APIError } from './types';

/**
 * Get all tokens with optional filters
 */
export async function getTokens(params?: {
  category?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}): Promise<Token[]> {
  try {
    const response = await apiClient.get<Token[]>('/api/tokens', { params });
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch tokens',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Get token details by address
 */
export async function getTokenDetails(tokenAddress: string): Promise<TokenDetails> {
  try {
    const response = await apiClient.get<TokenDetails>(`/api/tokens/${tokenAddress}`);
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch token details',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Get trending tokens
 */
export async function getTrendingTokens(limit: number = 10): Promise<Token[]> {
  try {
    const response = await apiClient.get<Token[]>('/api/tokens/trending', {
      params: { limit },
    });
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch trending tokens',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Search tokens by name or symbol
 */
export async function searchTokens(query: string): Promise<Token[]> {
  try {
    const response = await apiClient.get<Token[]>('/api/tokens/search', {
      params: { q: query },
    });
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to search tokens',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}
