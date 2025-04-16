// src/hooks/webConfiguration/use-sectioın.ts
import { createCrudHooks } from "@/src/api/createCrudHooks";

// Define TypeScript interface for Section
export interface Section {
  _id?: string;
  section_name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
  subSections?: string[];
  createdAt?: string;
  updatedAt?: string;
  image?: string;
}

// Create DTO type for creating a new section
export interface CreateSectionDto {
  section_name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
  subSections?: string[];
  image?: string;
}

// Create DTO type for updating a section
export interface UpdateSectionDto {
  section_name?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
  subSections?: string[];
  image?: string;
}

// Create a custom hook with typed CRUD operations for sections
export const useSections = () => {
  const sectionHooks = createCrudHooks<Section, CreateSectionDto, UpdateSectionDto>('sections');
  
  return {
    // Get all sections with proper typing
    useGetAll: (options?: any) => sectionHooks.useGetAll(options),
    
    // Get a single section by ID
    useGetById: (id: string, options?: any) => sectionHooks.useGetById(id, options),
    
    // Create a new section
    useCreate: (options?: any) => sectionHooks.useCreate(options),
    
    // Update an existing section
    useUpdate: (options?: any) => sectionHooks.useUpdate(options),
    
    // Delete a section
    useDelete: (options?: any) => sectionHooks.useDelete(options),
  };
};