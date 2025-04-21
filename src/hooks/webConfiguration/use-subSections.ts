import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/src/lib/api-client';
import { SubSection } from '@/src/api/types';

// Base subsection hook
export function useSubSections() {
  const queryClient = useQueryClient();
  const endpoint = '/subsections';

  // Query keys
  const subsectionsKey = ['subsections'];
  const subsectionKey = (id: string) => [...subsectionsKey, id];
  const subsectionBySlugKey = (slug: string) => [...subsectionsKey, 'slug', slug];

  // Get all subsections
  const useGetAll = (includeContentCount: boolean = false) => {
    return useQuery({
      queryKey: subsectionsKey,
      queryFn: async () => {
        const { data } = await apiClient.get(endpoint, {
          params: { includeContentCount }
        });
        return data;
      },
    });
  };

  // Get a single subsection by ID
  const useGetById = (id: string, includeContent: boolean = false) => {
    return useQuery({
      queryKey: subsectionKey(id),
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}`, {
          params: { includeContent }
        });
        return data;
      },
      enabled: !!id,
    });
  };

  // Get a single subsection by slug
  const useGetBySlug = (slug: string, includeContent: boolean = false) => {
    return useQuery({
      queryKey: subsectionBySlugKey(slug),
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/slug/${slug}`, {
          params: { includeContent }
        });
        return data;
      },
      enabled: !!slug,
    });
  };

  // Create a new subsection
  const useCreate = () => {
    return useMutation({
      mutationFn: async (createDto: Omit<SubSection, '_id'>) => {
        const { data } = await apiClient.post(endpoint, createDto);
        return data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: subsectionsKey });
        if (data._id) {
          queryClient.setQueryData(subsectionKey(data._id), data);
        }
        if (data.slug) {
          queryClient.setQueryData(subsectionBySlugKey(data.slug), data);
        }
      },
    });
  };

  // Update a subsection
  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<SubSection> }) => {
        const { data: responseData } = await apiClient.put(`${endpoint}/${id}`, data);
        return responseData;
      },
      onSuccess: (data, { id }) => {
        queryClient.setQueryData(subsectionKey(id), data);
        if (data.slug) {
          queryClient.setQueryData(subsectionBySlugKey(data.slug), data);
        }
        queryClient.invalidateQueries({ queryKey: subsectionsKey });
      },
    });
  };

  // Delete a subsection
  const useDelete = (hardDelete: boolean = false) => {
    return useMutation({
      mutationFn: async (id: string) => {
        await apiClient.delete(`${endpoint}/${id}`, {
          params: { hardDelete }
        });
      },
      onSuccess: (_, id) => {
        const cachedData = queryClient.getQueryData(subsectionKey(id)) as SubSection | undefined;
        
        queryClient.removeQueries({ queryKey: subsectionKey(id) });
        if (cachedData?.slug) {
          queryClient.removeQueries({ queryKey: subsectionBySlugKey(cachedData.slug) });
        }
        queryClient.invalidateQueries({ queryKey: subsectionsKey });
      },
    });
  };

  // Update order of multiple subsections
  const useUpdateOrder = () => {
    return useMutation({
      mutationFn: async (subsections: { id: string; order: number }[]) => {
        const { data } = await apiClient.put(`${endpoint}/order`, { subsections });
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: subsectionsKey });
      },
    });
  };

  // Return all hooks
  return {
    useGetAll,
    useGetById,
    useGetBySlug,
    useCreate,
    useUpdate,
    useDelete,
    useUpdateOrder,
  };
}