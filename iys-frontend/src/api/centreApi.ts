import { apiClient } from './client';
import { ApiResponse, PageResponse } from '../types/api';
import { CentreResponse, CreateCentreRequest, UpdateCentreRequest } from '../types/centre';

export const centreApi = {
  getAllCentres: async (
    activeOnly: boolean = true,
    page: number = 0,
    size: number = 20
  ): Promise<ApiResponse<PageResponse<CentreResponse>>> => {
    const { data } = await apiClient.get<ApiResponse<PageResponse<CentreResponse>>>('/centres', {
      params: { activeOnly, page, size },
    });
    return data;
  },

  getCentreById: async (id: string): Promise<ApiResponse<CentreResponse>> => {
    const { data } = await apiClient.get<ApiResponse<CentreResponse>>(`/centres/${id}`);
    return data;
  },

  createCentre: async (payload: CreateCentreRequest): Promise<ApiResponse<CentreResponse>> => {
    const { data } = await apiClient.post<ApiResponse<CentreResponse>>('/centres', payload);
    return data;
  },

  updateCentre: async (id: string, payload: UpdateCentreRequest): Promise<ApiResponse<CentreResponse>> => {
    const { data } = await apiClient.put<ApiResponse<CentreResponse>>(`/centres/${id}`, payload);
    return data;
  },

  deleteCentre: async (id: string): Promise<void> => {
    await apiClient.delete(`/centres/${id}`);
  },
};
