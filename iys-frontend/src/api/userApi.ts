import { apiClient } from './client';
import { ApiResponse, PageResponse } from '../types/api';
import { UserResponse, UserStatus, AssignRoleRequest, RoleResponse } from '../types/user';

export const userApi = {
  getMe: async (): Promise<ApiResponse<UserResponse>> => {
    const { data } = await apiClient.get<ApiResponse<UserResponse>>('/users/me');
    return data;
  },

  getAllRoles: async (): Promise<ApiResponse<RoleResponse[]>> => {
    const { data } = await apiClient.get<ApiResponse<RoleResponse[]>>('/users/roles');
    return data;
  },

  getUserById: async (id: string): Promise<ApiResponse<UserResponse>> => {
    const { data } = await apiClient.get<ApiResponse<UserResponse>>(`/users/${id}`);
    return data;
  },

  getUsersByCentre: async (
    centreId?: string,
    status?: UserStatus,
    page: number = 0,
    size: number = 50
  ): Promise<ApiResponse<PageResponse<UserResponse>>> => {
    const { data } = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>('/users', {
      params: { centreId, status, page, size },
    });
    return data;
  },

  updateUserStatus: async (id: string, status: UserStatus): Promise<ApiResponse<string>> => {
    const { data } = await apiClient.put<ApiResponse<string>>(`/users/${id}/status`, { status });
    return data;
  },

  assignRole: async (id: string, payload: AssignRoleRequest): Promise<ApiResponse<UserResponse>> => {
    const { data } = await apiClient.post<ApiResponse<UserResponse>>(`/users/${id}/roles`, payload);
    return data;
  },

  revokeRole: async (id: string, roleId: string, centreId: string): Promise<ApiResponse<UserResponse>> => {
    const { data } = await apiClient.delete<ApiResponse<UserResponse>>(`/users/${id}/roles/${roleId}`, {
      params: { centreId },
    });
    return data;
  },
};
