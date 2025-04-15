// Import needed for the hook above
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCrudHooks } from './createCrudHooks';
import { CreateSubSectionDto, SubSection, UpdateSubSectionDto } from './types/subsectionsTypes';
import apiClient from '../lib/api-client';

// Create and export the subsection API hooks
export const subsectionApi = createCrudHooks<SubSection, CreateSubSectionDto, UpdateSubSectionDto>('subsections');

// Get subsections by parent section ID
export const useGetSubSectionsBySection = (sectionId: string) => {
  return useQuery({
    queryKey: ['subsections', 'bySection', sectionId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/sections/${sectionId}/subsections`);
      return data;
    },
    enabled: !!sectionId,
  });
};



// Add a language to a subsection
export const useAddLanguageToSubSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subSectionId, languageId }: { subSectionId: string; languageId: string }) => {
      const { data } = await apiClient.post(`/subsections/${subSectionId}/languages`, { languageId });
      return data;
    },
    onSuccess: (_, { subSectionId }) => {
      // Invalidate the subsection to refetch it
      queryClient.invalidateQueries({ queryKey: ['subsections', subSectionId] });
      // Also invalidate any related queries
      queryClient.invalidateQueries({ queryKey: ['subsections'] });
    }
  });
};

// Get active subsections
export const useGetActiveSubSections = () => {
  return subsectionApi.useGetAll({
    queryKey: ['subsections', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get('/subsections?isActive=true');
      return data;
    }
  });
};