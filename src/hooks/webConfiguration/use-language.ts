// src/hooks/webConfiguration/use-language.ts
import { createCrudHooks } from "@/src/api/createCrudHooks";

// Define TypeScript interface for Language
export interface Language {
  _id?: string;
  language: string;
  languageID: string;
  subSections?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Create DTO type for creating a new language
export interface CreateLanguageDto {
  language: string;
  languageID: string;
  subSections?: string[];
}

// Create DTO type for updating a language
export interface UpdateLanguageDto {
  language?: string;
  languageID?: string;
  subSections?: string[];
}

// Create a custom hook with typed CRUD operations for languages
export const useLanguages = () => {
  const languageHooks = createCrudHooks<Language, CreateLanguageDto, UpdateLanguageDto>('languages');
  
  return {
    // Get all languages with proper typing
    useGetAll: (options?: any) => languageHooks.useGetAll(options),
    
    // Get a single language by ID
    useGetById: (id: string, options?: any) => languageHooks.useGetById(id, options),
    
    // Create a new language
    useCreate: (options?: any) => languageHooks.useCreate(options),
    
    // Update an existing language
    useUpdate: (options?: any) => languageHooks.useUpdate(options),
    
    // Delete a language
    useDelete: (options?: any) => languageHooks.useDelete(options),
  };
};