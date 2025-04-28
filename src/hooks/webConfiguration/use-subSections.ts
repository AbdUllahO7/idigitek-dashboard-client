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
  const subsectionBySectionItemKey = (sectionItemId: string) => [...subsectionsKey, 'sectionItem', sectionItemId];

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
  const useGetById = (id: string, populateSectionItem = true, includeContent = false) => {
    return useQuery({
      queryKey: [...subsectionKey(id), { populateSectionItem, includeContent }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}`, {
          params: { populate: populateSectionItem, includeContent }
        });
        return data;
      },
      enabled: !!id
    });
  };

  // Get subsection by slug
  const useGetBySlug = (slug: string, populateSectionItem = true, includeContent = false) => {
    return useQuery({
      queryKey: [...subsectionSlugKey(slug), { populateSectionItem, includeContent }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/slug/${slug}`, {
          params: { populate: populateSectionItem, includeContent }
        });
        return data;
      },
      enabled: !!slug
    });
  };

  // Get subsections by section item ID
  const useGetBySectionItemId = (
    sectionItemId: string, 
    activeOnly = true, 
    limit = 100, 
    skip = 0, 
    includeContentCount = false
  ) => {
    return useQuery({
      queryKey: [...subsectionBySectionItemKey(sectionItemId), { activeOnly, limit, skip, includeContentCount }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/sectionItem/${sectionItemId}`, {
          params: { activeOnly, limit, skip, includeContentCount }
        });
        return data;
      },
      enabled: !!sectionItemId && sectionItemId !== "null"
    });
  };

  // Create a new subsection
  const useCreate = () => {
    return useMutation({
      mutationFn: async (createDto: Omit<SubSection, '_id'>) => {
        try {
          const { data } = await apiClient.post(endpoint, createDto);
          return data;
        } catch (error: any) {
          if (error.message?.includes('duplicate') || 
              error.message?.includes('E11000') || 
              error.message?.includes('already exists')) {
            const enhancedError = new Error(`A subsection with the slug "${createDto.slug}" already exists.`);
            throw enhancedError;
          }
          throw error;
        }
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: subsectionsKey });
        if (data._id) {
          queryClient.setQueryData(subsectionKey(data._id), data);
        }
        if (data.slug) {
          queryClient.setQueryData(subsectionSlugKey(data.slug), data);
        }
        if (data.sectionItem) {
          queryClient.invalidateQueries({ 
            queryKey: subsectionBySectionItemKey(typeof data.sectionItem === 'string' ? data.sectionItem : data.sectionItem._id) 
          });
        }
      },
    });
  };

  // Update a subsection
  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<SubSection> }) => {
        try {
          const { data: responseData } = await apiClient.put(`${endpoint}/${id}`, data);
          return responseData;
        } catch (error: any) {
          if (error.message?.includes('duplicate') || 
              error.message?.includes('E11000') || 
              error.message?.includes('already exists')) {
            const enhancedError = new Error(`A subsection with the slug "${data.slug}" already exists.`);
            throw enhancedError;
          }
          throw error;
        }
      },
      onSuccess: (data, { id }) => {
        queryClient.setQueryData(subsectionKey(id), data);
        if (data.slug) {
          queryClient.setQueryData(subsectionSlugKey(data.slug), data);
        }
        if (data.sectionItem) {
          queryClient.invalidateQueries({ 
            queryKey: subsectionBySectionItemKey(typeof data.sectionItem === 'string' ? data.sectionItem : data.sectionItem._id) 
          });
        }
        queryClient.invalidateQueries({ queryKey: subsectionsKey });
      },
    });
  };

  // Delete a subsection
  const useDelete = (hardDelete: boolean = false) => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { data } = await apiClient.delete(`${endpoint}/${id}`, {
          params: { hardDelete }
        });
        return data;
      },
      onSuccess: (_, id) => {
        const cachedData = queryClient.getQueryData(subsectionKey(id)) as SubSection | undefined;
        
        queryClient.removeQueries({ queryKey: subsectionKey(id) });
        if (cachedData?.slug) {
          queryClient.removeQueries({ queryKey: subsectionSlugKey(cachedData.slug) });
        }
        if (cachedData?.sectionItem) {
          queryClient.invalidateQueries({ 
            queryKey: subsectionBySectionItemKey(
              typeof cachedData.sectionItem === 'string' ? cachedData.sectionItem : cachedData.sectionItem._id
            ) 
          });
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
  const useGetCompleteById = (id: string, populateSectionItem = true) => {
    return useQuery({
      queryKey: [...subsectionKey(id), 'complete', { populateSectionItem }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/${id}/complete`, {
          params: { populate: populateSectionItem }
        });
        return data;
      },
      enabled: !!id
    });
  };

  // Get complete subsection by slug (with all elements and translations)
  const useGetCompleteBySlug = (slug: string, populateSectionItem = true) => {
    return useQuery({
      queryKey: [...subsectionSlugKey(slug), 'complete', { populateSectionItem }],
      queryFn: async () => {
        const { data } = await apiClient.get(`${endpoint}/slug/${slug}/complete`, {
          params: { populate: populateSectionItem }
        });
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
    useGetBySectionItemId,
    useCreate,
    useUpdate,
    useDelete,
    useUpdateOrder,
    useGetCompleteById,
    useGetCompleteBySlug
  };
}