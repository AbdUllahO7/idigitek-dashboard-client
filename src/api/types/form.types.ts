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
export interface FormRef {
  getFormData: () => Promise<any>
  hasUnsavedChanges: boolean
  resetUnsavedChanges?: () => void
  saveData?: () => Promise<boolean>
}


// Define context type
export interface FormContextType {
  formData: FormData
  updateFormData: (section: string, data: any) => void
  hasUnsavedChanges: boolean
  checkUnsavedChanges: () => void
  saveAllData: () => Promise<void>
  activeLanguages: Language[]
  languageCodes: string[]
  languageIds: string[] 
  isSubmitting: boolean
  progress: number
  serviceData: any
  formRefs: {
    [key: string]: React.MutableRefObject<FormRef | null>
  }
  showLeaveConfirmation: boolean
  setShowLeaveConfirmation: (show: boolean) => void
  navigateBack: () => void
}



// Define form data type (adjust as needed)
export interface FormData {
  [key: string]: any
}