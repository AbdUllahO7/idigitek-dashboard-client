// src/hooks/service/team-section-config.ts

import { FieldConfig } from "@/src/api/types/hooks/MultilingualSection.types";

// Translation keys for team section
export const teamSectionTranslations = {
  en: {
    sectionName: "Team Section Basic",
    sectionDescription: "Team section for managing team member information",
    sectionBadgeLabel: "Section Badge",
    sectionTitleLabel: "Section Title",
    sectionDescriptionLabel: "Section Description",
    type: "Team",
    badgeElement: "Badge",
    titleElement: "Title",
    descriptionElement: "Description"
  },
  ar: {
    sectionName: "قسم الفريق الأساسي",
    sectionDescription: "قسم الفريق لإدارة معلومات أعضاء الفريق",
    sectionBadgeLabel: "شارة القسم",
    sectionTitleLabel: "عنوان القسم",
    sectionDescriptionLabel: "وصف القسم",
    type: "فريق",
    badgeElement: "الشارة",
    titleElement: "العنوان",
    descriptionElement: "الوصف"
  },
  tr: {
    sectionName: "Temel Takım Bölümü",
    sectionDescription: "Takım üyesi bilgilerini yönetmek için takım bölümü",
    sectionBadgeLabel: "Bölüm Rozeti",
    sectionTitleLabel: "Bölüm Başlığı",
    sectionDescriptionLabel: "Bölüm Açıklaması",
    type: "Takım",
    badgeElement: "Rozet",
    titleElement: "Başlık",
    descriptionElement: "Açıklama"
  }
};

// Function to get translated team section config
export const getTeamSectionConfig = (language: string = 'en') => {
    const translations = teamSectionTranslations[language as keyof typeof teamSectionTranslations] || teamSectionTranslations.en;
    
    return {
        name: translations.sectionName,
        slug: "Team-main",
        subSectionName: translations.sectionName,
        description: translations.sectionDescription,
        isMain: true,
        type: translations.type,
        // Define fields with translated labels
        fields: [
        { 
            id: "sectionBadge", 
            label: translations.sectionBadgeLabel, 
            type: "text", 
            required: true 
        },
        { 
            id: "sectionTitle", 
            label: translations.sectionTitleLabel, 
            type: "text", 
            required: true 
        },
        { 
            id: "sectionDescription", 
            label: translations.sectionDescriptionLabel, 
            type: "textarea", 
            required: false 
        },
        ] as FieldConfig[],
        // Define element mapping with translated values
        elementsMapping: {
        "sectionBadge": translations.badgeElement,
        "sectionTitle": translations.titleElement, 
        "sectionDescription": translations.descriptionElement,
        }
    };
};

// Default export for backward compatibility
export const teamSectionConfig = getTeamSectionConfig();