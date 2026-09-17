import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types/api';
import { TokenResponse } from '../types/auth';

const API_BASE_URL = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('iys_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('iys_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('iys_access_token');
        localStorage.removeItem('iys_refresh_token');
        localStorage.removeItem('iys_user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<ApiResponse<TokenResponse>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        if (data.success && data.data.accessToken) {
          localStorage.setItem('iys_access_token', data.data.accessToken);
          if (data.data.refreshToken) {
            localStorage.setItem('iys_refresh_token', data.data.refreshToken);
          }
          processQueue(null);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh token invalid');
        }
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError);
        localStorage.removeItem('iys_access_token');
        localStorage.removeItem('iys_refresh_token');
        localStorage.removeItem('iys_user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
