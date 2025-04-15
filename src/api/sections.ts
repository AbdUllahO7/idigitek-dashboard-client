// Import needed for custom hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';import { createCrudHooks } from './createCrudHooks';
import { CreateSectionDto, Section, UpdateSectionDto } from './types/sectionsTypes';

// Create and export the section API hooks
export const sectionApi = createCrudHooks<Section, CreateSectionDto, UpdateSectionDto>('sections');

// Additional custom hooks specific to sections
export const useGetActiveSections = () => {
  return sectionApi.useGetAll({
    queryKey: ['sections', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sections?isActive=true');
      return data;
    }
  });
};

// Import needed for custom hook

// Hook to add a subsection to a section
export const useAddSubSectionToSection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sectionId, subSectionId }: { sectionId: string; subSectionId: string }) => {
      const { data } = await apiClient.post(`/sections/${sectionId}/subsections`, { subSectionId });
      return data;
    },
    onSuccess: (_, { sectionId }) => {
      // Invalidate the section to refetch it
      queryClient.invalidateQueries({ queryKey: ['sections', sectionId] });
      // Also invalidate the list of sections
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    }
  });
};


