import { apiClient } from './client';
import { PlatformStats, APIError } from './types';

/**
 * Get platform statistics
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const response = await apiClient.get<PlatformStats>('/api/stats/platform');
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch platform stats',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(walletAddress: string): Promise<any> {
  try {
    const response = await apiClient.get(`/api/stats/user/${walletAddress}`);
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch user stats',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}
