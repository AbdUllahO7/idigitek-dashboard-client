// Define the field configuration types
export type FieldType = "text" | "textarea" | "badge"

export interface FieldConfig {
  id: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
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
  
  // Data configuration
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