import { apiClient } from './client';
import {
  TokenParams,
  LaunchResponse,
  LaunchStatus,
  AIRecommendation,
  APIError,
} from './types';

/**
 * Create a new token launch
 */
export async function createTokenLaunch(
  params: TokenParams,
  walletAddress: string
): Promise<LaunchResponse> {
  try {
    const response = await apiClient.post<LaunchResponse>('/api/launch/create', {
      ...params,
      walletAddress,
    });
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to create token launch',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Get launch status by job ID
 */
export async function getLaunchStatus(jobId: string): Promise<LaunchStatus> {
  try {
    const response = await apiClient.get<LaunchStatus>(`/api/launch/${jobId}/status`);
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to fetch launch status',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Get AI recommendations for token launch
 */
export async function getAIRecommendations(
  params: Partial<TokenParams>
): Promise<AIRecommendation> {
  try {
    const response = await apiClient.post<AIRecommendation>(
      '/api/launch/ai-recommendations',
      params
    );
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to get AI recommendations',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}

/**
 * Cancel a pending launch
 */
export async function cancelLaunch(jobId: string): Promise<{ success: boolean }> {
  try {
    const response = await apiClient.post(`/api/launch/${jobId}/cancel`);
    return response.data;
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to cancel launch',
      code: error.response?.status,
      details: error.response?.data,
    } as APIError;
  }
}
