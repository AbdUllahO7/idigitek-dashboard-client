import { useTranslation } from "react-i18next"

// Hook to get process section config with translated labels
export const useProcessSectionConfig = () => {
  const { t } = useTranslation()
  
  return {
    name: "Process Section Basic",
    slug: "Process-main",
    subSectionName: "Process Section Basic",
    description: "Process section for managing service information",
    isMain: true,
    type: 'Process',
    // Define fields with translated labels
    fields: [
      { 
        id: "sectionBadge", 
        label: t('sectionFields.sectionBadge'), 
        type: "text", 
        required: true 
      },
      { 
        id: "sectionTitle", 
        label: t('sectionFields.sectionTitle'), 
        type: "text", 
        required: true 
      },
      { 
        id: "sectionDescription", 
        label: t('sectionFields.sectionDescription'), 
        type: "textarea", 
        required: false 
      },
    ],
    // Define element mapping
    elementsMapping: {
      "sectionBadge": "Badge",
      "sectionTitle": "Title", 
      "sectionDescription": "Description",
    }
  }
}

// Static config (fallback for when hooks can't be used)
export const processSectionConfig = {
  name: "Process Section Basic",
  slug: "Process-main",
  subSectionName: "Process Section Basic",
  description: "Process section for managing service information",
  isMain: true,
  type: 'Process',
  fields: [
    { id: "sectionBadge", label: "Section Badge", type: "text", required: true },
    { id: "sectionTitle", label: "Section Title", type: "text", required: true },
    { id: "sectionDescription", label: "Section Description", type: "textarea", required: false },
  ],
  elementsMapping: {
    "sectionBadge": "Badge",
    "sectionTitle": "Title", 
    "sectionDescription": "Description",
  }
};