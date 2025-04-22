// src/hooks/service/service-section-config.ts
import { FieldConfig } from "@/src/app/types/MultilingualSectionTypes";

// Define service section configuration
export const serviceSectionConfig = {
    name: "Service",
    slug: "services",
    subSectionName: "ServiceSubSection",
    description: "Service section for managing service information",
    
    // Define fields with proper typing
    fields: [
        { id: "sectionBadge", label: "Section Badge", type: "text", required: true },
        { id: "sectionTitle", label: "Section Title", type: "text", required: true },
        { id: "sectionDescription", label: "Section Description", type: "textarea", required: true },
        { id: "serviceDetails", label: "Service Details", type: "badge", required: true },
    ] as FieldConfig[],
  
  // Define element mapping
    elementsMapping: {
        "sectionBadge": "Badge",
        "sectionTitle": "Title", 
        "sectionDescription": "Description",
        "serviceDetails": "ServiceDetails"
    }
};