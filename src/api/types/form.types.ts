/**
 * Form related type definitions
 */

import { UseFormReturn } from "react-hook-form";
import { Language } from "./language.types";
import { ElementDefinition } from "./content.types";


export interface SectionFormState {
  isLoadingData: boolean;
  dataLoaded: boolean;
  hasUnsavedChanges: boolean;
  existingSubSectionId: string | null;
  contentElements: any[];
  imageFile: File | null;
}

export interface UseSectionFormProps<T> {
  form: UseFormReturn<T>;
  slug?: string;
  languageIds: readonly string[];
  activeLanguages: Language[];
  sectionName: string;
  sectionDescription: string;
  elementDefinitions: ElementDefinition[];
  onDataChange?: (data: any) => void;
}

