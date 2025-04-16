import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/src/lib/api-client';
import { Section } from '@/src/api/types/sectionsTypes';

// Base section hook
export function useSections() {
  const queryClient = useQueryClient();
  const endpoint = '/sections';

  // Query keys
  const sectionsKey = ['sections'];
  const sectionKey = (id: string) => [...sectionsKey, id];

  // Get all sections
  const useGetAll = () => {
    return useQuery({
      queryKey: sectionsKey,
      queryFn: async () => {
        const { data } = await apiClient.get(endpoint);
        return data;
      },
    });
  };

  // Get a single section by ID
  const useGetById = (id: string) => {
    return useQuery({
      queryKey: sectionKey(id),
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}`);
        return data;
      },
      enabled: !!id,
    });
  };

  // Create a new section
  const useCreate = () => {
    return useMutation({
      mutationFn: async (createDto: Omit<Section, '_id'>) => {
        const { data } = await apiClient.post(endpoint, createDto);
        return data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: sectionsKey });
        if (data._id) {
          queryClient.setQueryData(sectionKey(data._id), data);
        }
      },
    });
  };

  // Update a section
  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<Section> }) => {
        const { data: responseData } = await apiClient.put(`${endpoint}/${id}`, data);
        return responseData;
      },
      onSuccess: (data, { id }) => {
        queryClient.setQueryData(sectionKey(id), data);
        queryClient.invalidateQueries({ queryKey: sectionsKey });
      },
    });
  };

  // Toggle active status
  const useToggleActive = () => {
    return useMutation({
      mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
        const { data: responseData } = await apiClient.patch(`${endpoint}/${id}/status`, { isActive });
        return responseData;
      },
      onSuccess: (data, { id }) => {
        queryClient.setQueryData(sectionKey(id), data);
        queryClient.invalidateQueries({ queryKey: sectionsKey });
      },
    });
  };

  // Delete a section
  const useDelete = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await apiClient.delete(`${endpoint}/${id}`);
      },
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: sectionKey(id) });
        queryClient.invalidateQueries({ queryKey: sectionsKey });
      },
    });
  };

  // Return all hooks
  return {
    useGetAll,
    useGetById,
    useCreate,
    useUpdate,
    useToggleActive,
    useDelete,
  };
}