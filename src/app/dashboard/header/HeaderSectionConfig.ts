// src/hooks/service/service-section-config.ts

import { FieldConfig } from "@/src/api/types/hooks/MultilingualSection.types";

// Translation keys for header section
export const headerSectionTranslations = {
  en: {
    sectionName: "Header Section Basic",
    sectionDescription: "Header section for managing Header information",
    sectionBadgeLabel: "Name of Section (Header)"
  },
  ar: {
    sectionName: "قسم الرأس الأساسي",
    sectionDescription: "قسم الرأس لإدارة معلومات الرأس", 
    sectionBadgeLabel: "اسم القسم (الرأس)"
  }
};

// Function to get translated header section config
export const getHeaderSectionConfig = (language: string = 'en') => {
  const translations = headerSectionTranslations[language as keyof typeof headerSectionTranslations] || headerSectionTranslations.en;
  
  return {
    name: translations.sectionName,
    slug: "Header-main",
    subSectionName: translations.sectionName,
    description: translations.sectionDescription,
    isMain: true,
    type: 'Header',
    // Define fields with translated labels
    fields: [
      { 
        id: "sectionBadge", 
        label: translations.sectionBadgeLabel, 
        type: "text", 
        required: true 
      },
    ] as FieldConfig[],
    // Define element mapping
    elementsMapping: {}
  };
};

// Default export for backward compatibility
export const headerSectionConfig = getHeaderSectionConfig();