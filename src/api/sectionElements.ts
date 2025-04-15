import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCrudHooks } from "./createCrudHooks";
import { CreateSectionElementDto, SectionElement, UpdateSectionElementDto } from "./types/sectionElementsTypes";
import apiClient from "../lib/api-client";

// Create and export the section element API hooks
export const sectionElementApi = createCrudHooks<SectionElement, CreateSectionElementDto, UpdateSectionElementDto>('elements');

// Define the section element relation type
export interface SectionElementRelation {
  _id?: string;
  element: string;
  parentType: 'section' | 'subsection';
  parent: string;
  order: number;
  isActive: boolean;
  config?: any;
  createdAt?: string;
  updatedAt?: string;
}

// Add an element to a section or subsection
export const useAddElementToParent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      elementId, 
      parentId, 
      parentType, 
      order, 
      config 
    }: { 
      elementId: string; 
      parentId: string; 
      parentType: 'section' | 'subsection';
      order?: number;
      config?: any;
    }) => {
      const { data } = await apiClient.post(`/elements/relation`, {
        element: elementId,
        parent: parentId,
        parentType,
        order,
        config
      });
      return data;
    },
    onSuccess: (_, { parentId, parentType }) => {
      // Invalidate the related queries
      queryClient.invalidateQueries({ queryKey: ['elements', 'by' + parentType, parentId] });
    }
  });
};

// Get elements by parent (section or subsection)
export const useGetElementsByParent = (parentId: string, parentType: 'section' | 'subsection') => {
  return useQuery({
    queryKey: ['elements', 'by' + parentType, parentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/elements/relation/${parentType}/${parentId}`);
      return data;
    },
    enabled: !!parentId && !!parentType,
  });
};

// Update element relation (order, config, etc.)
export const useUpdateElementRelation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      relationId, 
      data 
    }: { 
      relationId: string; 
      data: Partial<SectionElementRelation>
    }) => {
      const { data: responseData } = await apiClient.put(`/elements/relation/${relationId}`, data);
      return responseData;
    },
    onSuccess: (data) => {
      // Invalidate the related queries
      if (data.parentType && data.parent) {
        queryClient.invalidateQueries({ 
          queryKey: ['elements', 'by' + data.parentType, data.parent] 
        });
      }
    }
  });
};

// Remove element from parent
export const useRemoveElementFromParent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (relationId: string) => {
      await apiClient.delete(`/elements/relation/${relationId}`);
    },
    onSuccess: (_, __, context: any) => {
      // If we have context with parent info, invalidate those queries
      if (context?.parentId && context?.parentType) {
        queryClient.invalidateQueries({ 
          queryKey: ['elements', 'by' + context.parentType, context.parentId] 
        });
      }
    }
  });
};

// Upload image for element
export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const { data } = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return data.imageUrl;
    }
  });
};