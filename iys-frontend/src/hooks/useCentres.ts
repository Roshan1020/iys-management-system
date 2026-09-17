import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { centreApi } from '../api/centreApi';
import { CreateCentreRequest, UpdateCentreRequest } from '../types/centre';

export const useCentres = (activeOnly: boolean = false, page: number = 0, size: number = 50) => {
  return useQuery({
    queryKey: ['centres', activeOnly, page, size],
    queryFn: async () => {
      const res = await centreApi.getAllCentres(activeOnly, page, size);
      return res.data;
    },
  });
};

export const useCentre = (id?: string) => {
  return useQuery({
    queryKey: ['centre', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await centreApi.getCentreById(id);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateCentre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCentreRequest) => centreApi.createCentre(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centres'] });
    },
  });
};

export const useUpdateCentre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCentreRequest }) =>
      centreApi.updateCentre(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centres'] });
    },
  });
};
