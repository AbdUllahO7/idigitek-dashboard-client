// src/api/languages.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCrudHooks } from "./createCrudHooks";
import { CreateLanguageDto, Language, UpdateLanguageDto } from "./types/languagesTypes";
import apiClient from "../lib/api-client";




// Create and export the language API hooks
export const languageApi = createCrudHooks<Language, CreateLanguageDto, UpdateLanguageDto>('languages');

// Get languages by subsection ID
export const useGetLanguagesBySubSection = (subSectionId: string) => {
  return useQuery({
    queryKey: ['languages', 'bySubSection', subSectionId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/subsections/${subSectionId}/languages`);
      return data;
    },
    enabled: !!subSectionId,
  });
};

// Get active languages
export const useGetActiveLanguages = () => {
  return useQuery({
    queryKey: ['languages', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get('/languages?isActive=true');
      return data as Language[];
    }
  });
};

// Add a subsection to a language
export const useAddSubSectionToLanguage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ languageId, subSectionId }: { languageId: string; subSectionId: string }) => {
      const { data } = await apiClient.post(`/languages/${languageId}/subsections`, { subSectionId });
      return data;
    },
    onSuccess: (_, { languageId, subSectionId }) => {
      // Invalidate the language to refetch it
      queryClient.invalidateQueries({ queryKey: ['languages', languageId] });
      // Also invalidate the list of languages for this subsection
      queryClient.invalidateQueries({ queryKey: ['languages', 'bySubSection', subSectionId] });
      // Invalidate the general languages list
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    }
  });
};

// Remove a subsection from a language
export const useRemoveSubSectionFromLanguage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ languageId, subSectionId }: { languageId: string; subSectionId: string }) => {
      const { data } = await apiClient.delete(`/languages/${languageId}/subsections/${subSectionId}`);
      return data;
    },
    onSuccess: (_, { languageId, subSectionId }) => {
      // Invalidate the language to refetch it
      queryClient.invalidateQueries({ queryKey: ['languages', languageId] });
      // Also invalidate the list of languages for this subsection
      queryClient.invalidateQueries({ queryKey: ['languages', 'bySubSection', subSectionId] });
      // Invalidate the general languages list
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    }
  });
};

// Get languages with filtering options
export const useGetFilteredLanguages = (filters: {
  search?: string;
  hasSubSections?: boolean;
  sort?: 'asc' | 'desc';
}) => {
  // Build query params
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.hasSubSections !== undefined) params.append('hasSubSections', String(filters.hasSubSections));
  if (filters.sort) params.append('sort', filters.sort);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  return useQuery({
    queryKey: ['languages', 'filtered', filters],
    queryFn: async () => {
      const { data } = await apiClient.get(`/languages${queryString}`);
      return data as Language[];
    }
  });
};

// Bulk create languages
export const useBulkCreateLanguages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (languages: CreateLanguageDto[]) => {
      const { data } = await apiClient.post('/languages/bulk', { languages });
      return data;
    },
    onSuccess: () => {
      // Invalidate the languages list
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    }
  });
};

// Bulk delete languages
export const useBulkDeleteLanguages = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (languageIds: string[]) => {
      const { data } = await apiClient.delete('/languages/bulk', { 
        data: { ids: languageIds } 
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate the languages list
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    }
  });
};