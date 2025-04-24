import { SubSection } from "@/src/api/types"

// Define the field configuration types
export type FieldType = "text" | "textarea" | "badge" | "image" | "video" | "audio" | "link" | "select" | "checkbox" | "radio" | "date" | "number" | "email" | "password"

export interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: string[];
}

// Define the language configuration
export interface LanguageConfig {
  id: string
  label: string
}

// Define the multilingual section data type
export interface MultilingualSectionData {
  id: string
  [fieldId: string]: any
}

export interface MultilingualSectionProps {
  // Component configuration
  sectionTitle: string
  sectionDescription?: string

  sectionName?:string
  fields: FieldConfig[]
  languages: LanguageConfig[]
  
  // Data state
  sectionData: MultilingualSectionData | null
  onSectionChange: (section: MultilingualSectionData | null) => void
  
  // Optional UI customization
  addButtonLabel?: string
  editButtonLabel?: string
  saveButtonLabel?: string
  cancelButtonLabel?: string
  noDataMessage?: string
}



