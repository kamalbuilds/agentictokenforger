import { apiClient } from './client';
import { RiskAnalysis, APIError } from './types';

/**
 * Get risk analysis for a token
 */
export async function getRiskAnalysis(tokenAddress: string): Promise<RiskAnalysis> {
  try {
    const response = await apiClient.get<RiskAnalysis>(`/api/risk/${tokenAddress}`);
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch risk analysis',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Request risk analysis for a token
 */
export async function requestRiskAnalysis(
  tokenAddress: string
): Promise<{ jobId: string }> {
  try {
    const response = await apiClient.post(`/api/risk/${tokenAddress}/analyze`);
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to request risk analysis',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Get risk alerts for wallet
 */
export async function getRiskAlerts(walletAddress: string): Promise<any[]> {
  try {
    const response = await apiClient.get(`/api/risk/alerts/${walletAddress}`);
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch risk alerts',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}
