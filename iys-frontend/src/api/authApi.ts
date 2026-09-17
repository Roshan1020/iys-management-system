import { apiClient } from './client';
import { ApiResponse } from '../types/api';
import { LoginRequest, RegisterRequest, TokenResponse, ChangePasswordRequest } from '../types/auth';

export const authApi = {
  login: async (payload: LoginRequest): Promise<ApiResponse<TokenResponse>> => {
    const { data } = await apiClient.post<ApiResponse<TokenResponse>>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<ApiResponse<TokenResponse>> => {
    const { data } = await apiClient.post<ApiResponse<TokenResponse>>('/auth/register', payload);
    return data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<TokenResponse>> => {
    const { data } = await apiClient.post<ApiResponse<TokenResponse>>('/auth/refresh', { refreshToken });
    return data;
  },

  logout: async (): Promise<ApiResponse<string>> => {
    const token = localStorage.getItem('iys_access_token');
    const { data } = await apiClient.post<ApiResponse<string>>(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<ApiResponse<string>> => {
    const { data } = await apiClient.post<ApiResponse<string>>('/auth/change-password', payload);
    return data;
  },
};
