import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { UserStatus, AssignRoleRequest } from '../types/user';

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await userApi.getMe();
      return res.data;
    },
  });
};

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await userApi.getAllRoles();
      return res.data;
    },
  });
};

export const useUsersByCentre = (centreId?: string, status?: UserStatus, page: number = 0, size: number = 50) => {
  return useQuery({
    queryKey: ['users', centreId, status, page, size],
    queryFn: async () => {
      const res = await userApi.getUsersByCentre(centreId, status, page, size);
      return res.data;
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignRoleRequest }) =>
      userApi.assignRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useRevokeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleId, centreId }: { id: string; roleId: string; centreId: string }) =>
      userApi.revokeRole(id, roleId, centreId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
