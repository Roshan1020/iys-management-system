import { apiClient } from './client';
import { ApiResponse, PageResponse } from '../types/api';
import {
  DevoteeResponse,
  DevoteeSummaryResponse,
  CreateDevoteeRequest,
  UpdateDevoteeRequest,
  ProfileType,
  StudentProfileRequest,
  ProfessionalProfileRequest,
  AlumniProfileRequest,
} from '../types/devotee';

export const devoteeApi = {
  getDevotees: async (params: {
    centreId?: string;
    profileType?: ProfileType;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<DevoteeSummaryResponse>>> => {
    const { data } = await apiClient.get<ApiResponse<PageResponse<DevoteeSummaryResponse>>>('/devotees', {
      params: {
        centreId: params.centreId || undefined,
        profileType: params.profileType,
        search: params.search,
        page: params.page ?? 0,
        size: params.size ?? 12,
      },
    });
    return data;
  },

  getDevoteeById: async (id: string): Promise<ApiResponse<DevoteeResponse>> => {
    const { data } = await apiClient.get<ApiResponse<DevoteeResponse>>(`/devotees/${id}`);
    return data;
  },

  createDevotee: async (payload: CreateDevoteeRequest): Promise<ApiResponse<DevoteeResponse>> => {
    const { data } = await apiClient.post<ApiResponse<DevoteeResponse>>('/devotees', payload);
    return data;
  },

  updateDevotee: async (id: string, payload: UpdateDevoteeRequest): Promise<ApiResponse<DevoteeResponse>> => {
    const { data } = await apiClient.put<ApiResponse<DevoteeResponse>>(`/devotees/${id}`, payload);
    return data;
  },

  deleteDevotee: async (id: string): Promise<void> => {
    await apiClient.delete(`/devotees/${id}`);
  },

  upsertStudentProfile: async (id: string, payload: StudentProfileRequest): Promise<ApiResponse<DevoteeResponse>> => {
    const { data } = await apiClient.put<ApiResponse<DevoteeResponse>>(`/devotees/${id}/student-profile`, payload);
    return data;
  },

  upsertProfessionalProfile: async (
    id: string,
    payload: ProfessionalProfileRequest
  ): Promise<ApiResponse<DevoteeResponse>> => {
    const { data } = await apiClient.put<ApiResponse<DevoteeResponse>>(`/devotees/${id}/professional-profile`, payload);
    return data;
  },

  upsertAlumniProfile: async (id: string, payload: AlumniProfileRequest): Promise<ApiResponse<DevoteeResponse>> => {
    const { data } = await apiClient.put<ApiResponse<DevoteeResponse>>(`/devotees/${id}/alumni-profile`, payload);
    return data;
  },
};
