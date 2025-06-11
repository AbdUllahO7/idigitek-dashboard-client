import { FieldConfig } from "@/src/api/types/hooks/MultilingualSection.types";

// Translation keys for clientComments section
export const clientCommentsSectionTranslations = {
    en: {
        sectionName: "Chose Us Section Basic",
        sectionDescription: "Chose Us section for managing industry information",
        subSectionName: "Basic",
        sectionBadgeLabel: "Section Badge",
        sectionTitleLabel: "Section Title",
        sectionDescriptionLabel: "Section Description",
        industryDetailsLabel: "Client Comments Details",
        type: "ClientComments",
        badgeElement: "Badge",
        titleElement: "Title",
        descriptionElement: "Description",
        industryDetailsElement: "ClientCommentsDetails",
    },
    ar: {
        sectionName: "قسم اخترنا الأساسي",
        sectionDescription: "قسم اخترنا لإدارة معلومات الصناعة",
        subSectionName: "أساسي",
        sectionBadgeLabel: "شارة القسم",
        sectionTitleLabel: "عنوان القسم",
        sectionDescriptionLabel: "وصف القسم",
        industryDetailsLabel: "تفاصيل تعليقات العملاء",
        type: "تعليقات العملاء",
        badgeElement: "شارة",
        titleElement: "عنوان",
        descriptionElement: "وصف",
        industryDetailsElement: "تفاصيل تعليقات العملاء",
    },
    tr: {
        sectionName: "Bizi Seçin Temel Bölümü",
        sectionDescription: "Endüstri bilgilerini yönetmek için Bizi Seçin bölümü",
        subSectionName: "Temel",
        sectionBadgeLabel: "Bölüm Rozeti",
        sectionTitleLabel: "Bölüm Başlığı",
        sectionDescriptionLabel: "Bölüm Açıklaması",
        industryDetailsLabel: "Müşteri Yorumları Detayları",
        type: "Müşteri Yorumları",
        badgeElement: "Rozet",
        titleElement: "Başlık",
        descriptionElement: "Açıklama",
        industryDetailsElement: "MüşteriYorumlarıDetayları",
    },
};

// Function to get translated clientComments section config
export const getClientCommentsSectionConfig = (language: string = 'en') => {
    const translations = clientCommentsSectionTranslations[language as keyof typeof clientCommentsSectionTranslations] || clientCommentsSectionTranslations.en;

    return {
        name: translations.sectionName,
        slug: "Choose-main",
        subSectionName: translations.subSectionName,
        description: translations.sectionDescription,
        isMain: true,
        type: translations.type,
        // Define fields with translated labels
        fields: [
        {
            id: "sectionBadge",
            label: translations.sectionBadgeLabel,
            type: "text",
            required: true,
        },
        {
            id: "sectionTitle",
            label: translations.sectionTitleLabel,
            type: "text",
            required: true,
        },
        {
            id: "sectionDescription",
            label: translations.sectionDescriptionLabel,
            type: "textarea",
            required: false,
        },
        ] as FieldConfig[],
        // Define element mapping with translated values
        elementsMapping: {
        sectionBadge: translations.badgeElement,
        sectionTitle: translations.titleElement,
        sectionDescription: translations.descriptionElement,
        industryDetails: translations.industryDetailsElement,
        },
    };
};

// Default export for backward compatibility
export const clientCommentsSectionConfig = getClientCommentsSectionConfig();
