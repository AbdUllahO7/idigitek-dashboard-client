import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/src/lib/api-client';
import { Language } from '@/src/api/types';

// Base language hook
export function useLanguages() {
  const queryClient = useQueryClient();
  const endpoint = '/languages';

  // Query keys
  const languagesKey = ['languages'];
  const languageKey = (id: string) => [...languagesKey, id];

  // Get all languages
  const useGetAll = () => {
    return useQuery({
      queryKey: languagesKey,
      queryFn: async () => {
        const { data } = await apiClient.get(endpoint);
        return data;
      },
    });
  };

  // Get a single language by ID
  const useGetById = (id: string) => {
    return useQuery({
      queryKey: languageKey(id),
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}`);
        return data;
      },
      enabled: !!id,
    });
  };

  // Create a new language
  const useCreate = () => {
    return useMutation({
      mutationFn: async (createDto: Omit<Language, '_id'>) => {
        const { data } = await apiClient.post(endpoint, createDto);
        return data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: languagesKey });
        if (data._id) {
          queryClient.setQueryData(languageKey(data._id), data);
        }
      },
    });
  };

  // Update a language
  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<Language> }) => {
        const { data: responseData } = await apiClient.put(`${endpoint}/${id}`, data);
        return responseData;
      },
      onSuccess: (data, { id }) => {
        queryClient.setQueryData(languageKey(id), data);
        queryClient.invalidateQueries({ queryKey: languagesKey });
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
        queryClient.setQueryData(languageKey(id), data);
        queryClient.invalidateQueries({ queryKey: languagesKey });
      },
    });
  };

  // Delete a language
  const useDelete = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await apiClient.delete(`${endpoint}/${id}`);
      },
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: languageKey(id) });
        queryClient.invalidateQueries({ queryKey: languagesKey });
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