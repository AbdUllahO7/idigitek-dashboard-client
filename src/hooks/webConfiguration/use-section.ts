import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/src/lib/api-client';
import { 
  Section, 
  SectionItem, 
  SubSection,
  CreateSectionRequest,
  UpdateSectionRequest,
  SectionResponse,
  SectionQueryParams,
  SupportedLanguage,
  MultilingualName,
  MultilingualDescription,
  SectionOrderUpdateRequest
} from '@/src/api/types/hooks/section.types';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { toast } from '../use-toast';
import { getMultilingualDescription, getMultilingualName } from '../Management/SectionManagement/MultilingualManagement';

// Base section hook
export function useSections() {
  const queryClient = useQueryClient();
  const endpoint = '/sections';
  const { user } = useAuth();
  const { language } = useLanguage();
  
  // Get a user-specific prefix for cache keys
  const getUserPrefix = () => {
    const userId = user?.id || user?.id;
    return userId ? `user-${userId}` : 'anonymous';
  };

  // Query keys
  const sectionsKey = ['sections', getUserPrefix()];
  const sectionKey = (id: string) => [...sectionsKey, id];
  const completeDataKey = (id: string) => [...sectionKey(id), 'complete'];
  const allCompleteDataKey = [...sectionsKey, 'allComplete'];
  const websiteSectionsKey = (websiteId: string) => [...sectionsKey, 'website', websiteId];
  const websiteSectionsCompleteKey = (websiteId: string) => [...websiteSectionsKey(websiteId), 'complete'];

  // 🎯 UPDATED: Helper function to get section name by current language using utility
  const getSectionNameByLanguage = (section: Section): string => {
    if (section.displayName) {
      return section.displayName; // Use server-provided display name
    }
    
    return getMultilingualName(section, language as SupportedLanguage);
  };

  // 🎯 UPDATED: Helper function to get section description by current language using utility
  const getSectionDescriptionByLanguage = (section: Section): string => {
    if (section.displayDescription) {
      return section.displayDescription; // Use server-provided display description
    }
    
    return getMultilingualDescription(section, language as SupportedLanguage);
  };

  // Get all sections (optionally with section items count)
  const useGetAll = (includeItemsCount = false, activeOnly = true) => {
    return useQuery({
      queryKey: [...sectionsKey, { includeItemsCount, activeOnly, language }],
      queryFn: async (): Promise<SectionResponse> => {
        try {
          const params: SectionQueryParams = { 
            includeItemsCount, 
            activeOnly,
            language: language as SupportedLanguage
          };
          
          const { data } = await apiClient.get(endpoint, { params });
          return data;
        } catch (error: any) {
          console.error("Error fetching sections:", error);
          throw error;
        }
      },
    });
  };

  // Get a single section by ID (optionally with section items)
  const useGetById = (id: string, includeItems = false) => {
    return useQuery({
      queryKey: [...sectionKey(id), { includeItems, language }],
      queryFn: async (): Promise<SectionResponse> => {
        try {
          const params: SectionQueryParams = { 
            includeItems,
            language: language as SupportedLanguage
          };
          
          const { data } = await apiClient.get(`${endpoint}/${id}`, { params });
          return data;
        } catch (error: any) {
          console.error(`Error fetching section ${id}:`, error);
          throw error;
        }
      },
      enabled: !!id,
    });
  };

  /**
   * 🎯 UPDATED: Get all sections for a specific website with language support
   */
  const useGetByWebsiteId = (
    websiteId: string,
    includeInactive = false,
    enabled = true
  ) => {
    return useQuery({
      queryKey: [...websiteSectionsKey(websiteId), { includeInactive, language }],
      queryFn: async (): Promise<SectionResponse> => {
        try {
          const params: SectionQueryParams = {
            includeInactive,
            language: language as SupportedLanguage,
            websiteId
          };
          
          const { data } = await apiClient.get(`${endpoint}/website/${websiteId}`, { params });
          return data;
        } catch (error: any) {
          console.error(`Error fetching sections for website ${websiteId}:`, error);
          throw error;
        }
      },
      enabled: !!websiteId && enabled,
      staleTime: 0, 
    });
  };

  // 🎯 UPDATED: Create a new section with multilingual support
  const useCreate = () => {
    return useMutation({
      mutationFn: async (createDto: CreateSectionRequest): Promise<Section> => {
        try {
          // Validation is handled by the utility functions and backend
          const { data } = await apiClient.post(endpoint, createDto);
          return data;
        } catch (error: any) {
          // Enhanced error handling for duplicate entries
          if (error.message?.includes('duplicate') || 
              error.message?.includes('E11000') || 
              error.message?.includes('already exists')) {
            const enhancedError = new Error(`A section with one of these names already exists.`);
            throw enhancedError;
          }
          
          throw error;
        }
      },
      onSuccess: (data) => {
        // Invalidate all section queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: sectionsKey });
        if (data._id) {
          queryClient.setQueryData(sectionKey(data._id), data);
        }
        // Also invalidate website-specific queries if the section has a WebSiteId
        if (data.WebSiteId) {
          queryClient.invalidateQueries({ 
            queryKey: websiteSectionsKey(data.WebSiteId.toString()) 
          });
          queryClient.invalidateQueries({ 
            queryKey: websiteSectionsCompleteKey(data.WebSiteId.toString()) 
          });
        }
      },
    });
  };

  // 🎯 UPDATED: Update a section with multilingual support
  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: UpdateSectionRequest }): Promise<Section> => {
        try {
          // Validation is handled by the utility functions and backend
          const { data: responseData } = await apiClient.put(`${endpoint}/${id}`, data);
          return responseData;
        } catch (error: any) {
          // Enhanced error handling for duplicate entries
          if (error.message?.includes('duplicate') || 
              error.message?.includes('E11000') || 
              error.message?.includes('already exists')) {
            const enhancedError = new Error(`A section with one of these names already exists.`);
            throw enhancedError;
          }
          
          throw error;
        }
      },
      onSuccess: (data, { id }) => {
        // Update cached data and invalidate queries
        queryClient.setQueryData(sectionKey(id), data);
        queryClient.invalidateQueries({ queryKey: sectionsKey });
        queryClient.invalidateQueries({ queryKey: completeDataKey(id) });
        queryClient.invalidateQueries({ queryKey: allCompleteDataKey });
        
        if (data.WebSiteId) {
          queryClient.invalidateQueries({ 
            queryKey: websiteSectionsKey(data.WebSiteId.toString()) 
          });
          queryClient.invalidateQueries({ 
            queryKey: websiteSectionsCompleteKey(data.WebSiteId.toString()) 
          });
        }
      },
    });
  };

  // Toggle active status (unchanged)
  const useToggleActive = () => {
    return useMutation({
      mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }): Promise<Section> => {
        try {
          const { data: responseData } = await apiClient.patch(`${endpoint}/${id}/status`, { isActive });
          return responseData;
        } catch (error: any) {
          console.error(`Error toggling section ${id} active status:`, error);
          throw error;
        }
      },
      onSuccess: (data, { id }) => {
        queryClient.setQueryData(sectionKey(id), data);
        queryClient.invalidateQueries({ queryKey: sectionsKey });
        queryClient.invalidateQueries({ queryKey: completeDataKey(id) });
        queryClient.invalidateQueries({ queryKey: allCompleteDataKey });
        
        if (data.WebSiteId) {
          queryClient.invalidateQueries({ 
            queryKey: websiteSectionsKey(data.WebSiteId.toString()) 
          });
          queryClient.invalidateQueries({ 
            queryKey: websiteSectionsCompleteKey(data.WebSiteId.toString()) 
          });
        }
      },
    });
  };

  // Delete a section (unchanged)
  const useDelete = (hardDelete: boolean = false) => {
    return useMutation({
      mutationFn: async (id: string): Promise<{ websiteId?: string }> => {
        try {
          const { data: section } = await apiClient.get(`${endpoint}/${id}`);
          const websiteId = section?.data?.WebSiteId;
          
          await apiClient.delete(`${endpoint}/${id}`, {
            params: { hardDelete }
          });
          
          return { websiteId };
        } catch (error) {
          console.error(`Error deleting section ${id}:`, error);
          throw error;
        }
      },
      onSuccess: ({ websiteId }, id) => {
        queryClient.removeQueries({ queryKey: sectionKey(id) });
        queryClient.removeQueries({ queryKey: completeDataKey(id) });
        queryClient.invalidateQueries({ queryKey: sectionsKey });
        queryClient.invalidateQueries({ queryKey: allCompleteDataKey });
        
        if (websiteId) {
          queryClient.invalidateQueries({ 
            queryKey: websiteSectionsKey(websiteId.toString()) 
          });
          queryClient.invalidateQueries({ 
            queryKey: websiteSectionsCompleteKey(websiteId.toString()) 
          });
        }
      },
    });
  };

  // 🎯 NEW: Update section order with proper typing
  const useUpdateOrder = () => {
    return useMutation({
      mutationFn: async (orderData: SectionOrderUpdateRequest): Promise<Section[]> => {
        try {
          const { data } = await apiClient.patch(`${endpoint}/order`, orderData);
          return data;
        } catch (error: any) {
          console.error('Error updating section order:', error);
          throw error;
        }
      },
      onSuccess: (updatedSections) => {
        // Invalidate all section queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: sectionsKey });
        queryClient.invalidateQueries({ queryKey: allCompleteDataKey });
        
        // Update individual section cache and invalidate website-specific queries
        updatedSections.forEach(section => {
          if (section._id) {
            queryClient.setQueryData(sectionKey(section._id), section);
          }
          if (section.WebSiteId) {
            queryClient.invalidateQueries({ 
              queryKey: websiteSectionsKey(section.WebSiteId.toString()) 
            });
            queryClient.invalidateQueries({ 
              queryKey: websiteSectionsCompleteKey(section.WebSiteId.toString()) 
            });
          }
        });
      },
    });
  };

  // Add a manual function to clear all section-related cache for a user
  const clearUserSectionsCache = () => {
    queryClient.invalidateQueries({ queryKey: sectionsKey });
  };

  // Return all hooks, including helper functions
  return {
    useGetAll,
    useGetById,
    useGetByWebsiteId,             
    useCreate,
    useUpdate,
    useToggleActive,
    useDelete,
    useUpdateOrder,
    clearUserSectionsCache,
    
    // Helper functions
    getSectionNameByLanguage,
    getSectionDescriptionByLanguage,
  };
}

// 🎯 NEW: Hook for section items (similar pattern)
export function useSectionItems() {
  const queryClient = useQueryClient();
  const endpoint = '/section-items';
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const getUserPrefix = () => {
    const userId = user?.id || user?.id;
    return userId ? `user-${userId}` : 'anonymous';
  };

  const sectionItemsKey = ['sectionItems', getUserPrefix()];
  const sectionItemKey = (id: string) => [...sectionItemsKey, id];

  // Helper functions for section items
  const getSectionItemNameByLanguage = (item: SectionItem): string => {
    if (item.displayName) {
      return item.displayName;
    }
    return getMultilingualName(item, language as SupportedLanguage);
  };

  const getSectionItemDescriptionByLanguage = (item: SectionItem): string => {
    if (item.displayDescription) {
      return item.displayDescription;
    }
    return getMultilingualDescription(item, language as SupportedLanguage);
  };

  return {
    getSectionItemNameByLanguage,
    getSectionItemDescriptionByLanguage,
    // Add more section item operations as needed
  };
}

// 🎯 NEW: Hook for subsections (similar pattern)
export function useSubSections() {
  const queryClient = useQueryClient();
  const endpoint = '/subsections';
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const getUserPrefix = () => {
    const userId = user?.id || user?.id;
    return userId ? `user-${userId}` : 'anonymous';
  };

  const subSectionsKey = ['subSections', getUserPrefix()];
  const subSectionKey = (id: string) => [...subSectionsKey, id];

  // Helper functions for subsections
  const getSubSectionNameByLanguage = (subsection: SubSection): string => {
    if (subsection.displayName) {
      return subsection.displayName;
    }
    return getMultilingualName(subsection, language as SupportedLanguage);
  };

  const getSubSectionDescriptionByLanguage = (subsection: SubSection): string => {
    if (subsection.displayDescription) {
      return subsection.displayDescription;
    }
    return getMultilingualDescription(subsection, language as SupportedLanguage);
  };

  return {
    getSubSectionNameByLanguage,
    getSubSectionDescriptionByLanguage,
    // Add more subsection operations as needed
  };
}