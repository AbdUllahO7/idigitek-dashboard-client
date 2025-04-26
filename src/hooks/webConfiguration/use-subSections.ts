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
  const subsectionSlugKey = (slug: string) => [...subsectionsKey, 'slug', slug];

  // Get all subsections
  const useGetAll = (activeOnly = true, limit = 100, skip = 0, includeContentCount = false) => {
    return useQuery({
      queryKey: [...subsectionsKey, { activeOnly, limit, skip, includeContentCount }],
      queryFn: async () => {
        const { data } = await apiClient.get(endpoint, {
          params: { activeOnly, limit, skip, includeContentCount }
        });
        return data;
      }
    });
  };

  // Get a single subsection by ID
   const useGetById = (id: string, populateParents = true, includeContent = false) => {
    return useQuery({
      queryKey: [...subsectionKey(id), { populateParents, includeContent }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}`, {
          params: { populate: populateParents, includeContent }
        });
        return data;
      },
      enabled: !!id
    });
  };

  // Get subsection by slug
  const useGetBySlug = (slug: string, populateParents = true, includeContent = false) => {
    return useQuery({
      queryKey: [...subsectionSlugKey(slug), { populateParents, includeContent }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/slug/${slug}`, {
          params: { populate: populateParents, includeContent }
        });
        return data;
      },
      enabled: !!slug
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
          queryClient.setQueryData(subsectionSlugKey(data.slug), data);
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
          queryClient.setQueryData(subsectionSlugKey(data.slug), data);
        }
        queryClient.invalidateQueries({ queryKey: subsectionsKey });
      },
    });
  };

  // Delete a subsection
  const useDelete = (hardDelete: boolean = true) => {
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
          queryClient.removeQueries({ queryKey: subsectionSlugKey(cachedData.slug) });
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

  // Get complete subsection by ID (with all elements and translations)
  const useGetCompleteById = (id: string, populateParents = true) => {
    return useQuery({
      queryKey: [...subsectionKey(id), 'complete', { populateParents }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}/complete`, {
          params: { populate: populateParents }
        });
        return data;
      },
      enabled: !!id
    });
  };

  // Get complete subsection by slug (with all elements and translations)
  const useGetCompleteBySlug = (slug: string, populateParents = true, p0: boolean, p1: { enabled: boolean; }) => {
    return useQuery({
      queryKey: [...subsectionSlugKey(slug), 'complete', { populateParents }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/slug/${slug}/complete`, {
          params: { populate: populateParents }
        });
        console.log("useGetCompleteBySlug" , data)
        return data;
      },
      enabled: !!slug && slug !== ""
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
    useGetCompleteById,
    useGetCompleteBySlug
  };
}