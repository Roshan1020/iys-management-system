import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devoteeApi } from '../api/devoteeApi';
import {
  CreateDevoteeRequest,
  UpdateDevoteeRequest,
  ProfileType,
  StudentProfileRequest,
  ProfessionalProfileRequest,
  AlumniProfileRequest,
} from '../types/devotee';

export const useDevotees = (params: {
  centreId?: string;
  profileType?: ProfileType;
  search?: string;
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: ['devotees', params.centreId, params.profileType, params.search, params.page, params.size],
    queryFn: async () => {
      const res = await devoteeApi.getDevotees({
        centreId: params.centreId,
        profileType: params.profileType,
        search: params.search,
        page: params.page,
        size: params.size,
      });
      return res.data;
    },
  });
};

export const useDevotee = (id?: string) => {
  return useQuery({
    queryKey: ['devotee', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await devoteeApi.getDevoteeById(id);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateDevotee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevoteeRequest) => devoteeApi.createDevotee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devotees'] });
    },
  });
};

export const useUpdateDevotee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDevoteeRequest }) =>
      devoteeApi.updateDevotee(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devotees'] });
      queryClient.invalidateQueries({ queryKey: ['devotee', variables.id] });
    },
  });
};

export const useUpsertStudentProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StudentProfileRequest }) =>
      devoteeApi.upsertStudentProfile(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devotee', variables.id] });
    },
  });
};

export const useUpsertProfessionalProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProfessionalProfileRequest }) =>
      devoteeApi.upsertProfessionalProfile(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devotee', variables.id] });
    },
  });
};

export const useUpsertAlumniProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AlumniProfileRequest }) =>
      devoteeApi.upsertAlumniProfile(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devotee', variables.id] });
    },
  });
};
