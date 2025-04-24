import { FieldConfig } from "@/src/app/types/MultilingualSectionTypes";

// Base interface for section configurations
export interface SectionConfig {
  name: string;             // Section name used for display
  slug: string;             // Section slug used in API calls
  subSectionName: string;   // Name of the subsection entity
  description: string;      // Description of the subsection
  fields: FieldConfig[];    // Fields configuration
  elementsMapping: Record<string, string>; // Mapping of field IDs to element names
  defaultValues?: {
    benefits?: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
}

// Hero section configuration
export const heroSectionConfig: SectionConfig = {
  name: "Hero",
  slug: "hero-section",
  subSectionName: "Hero Section",
  description: "The main hero section displayed at the top of the page",
  fields: [
    {
      id: "title",
      label: "Title",
      type: "text",
      placeholder: "Enter title",
      required: true,
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
      required: true,
    },
    {
      id: "backLinkText",
      label: "Button Text",
      type: "text",
      placeholder: "Get Started",
      required: true,
    },
    {
      id: "backgroundImage",
      label: "Background Image",
      type: "image",
      required: true
    }
  ],
  elementsMapping: {
    "title": "HeroTitle",
    "description": "HeroDescription",
    "backLinkText": "HeroButtonText",
    "backgroundImage": "HeroBackgroundImage"
  }
};

// Benefits section configuration
export const benefitsSectionConfig: SectionConfig = {
  name: "Benefits",
  slug: "benefits-section",
  subSectionName: "Benefits Section",
  description: "The benefits section highlighting key features and advantages",
  fields: [
    {
      id: "icon",
      label: "Icon",
      type: "select",
      placeholder: "Select an icon",
      required: true,
      options: [
        "Clock",
        "MessageSquare",
        "LineChart",
        "Headphones",
        "Car",
        "MonitorSmartphone",
        "Settings",
        "CreditCard"
      ]
    },
    {
      id: "title",
      label: "Title",
      type: "text",
      placeholder: "Enter title",
      required: true
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
      required: true
    }
  ],
  elementsMapping: {
    "icon": "BenefitIcon",
    "title": "BenefitTitle",
    "description": "BenefitDescription"
  },
  defaultValues: {
    benefits: [
      {
        icon: "Clock",
        title: "",
        description: ""
      }
    ]
  }
};

// Features section configuration
export const featuresSectionConfig: SectionConfig = {
  name: "Features",
  slug: "features-section",
  subSectionName: "Features Section",
  description: "The features section highlighting product capabilities",
  fields: [
    {
      id: "sectionTitle",
      label: "Section Title",
      type: "text",
      placeholder: "Enter section title",
      required: true,
    },
    {
      id: "sectionDescription",
      label: "Section Description",
      type: "textarea",
      placeholder: "Enter section description",
      required: true,
    },
    // Add more fields as needed for features
  ],
  elementsMapping: {
    "sectionTitle": "FeaturesSectionTitle",
    "sectionDescription": "FeaturesSectionDescription",
  }
};

// Process steps section configuration
export const processStepsSectionConfig: SectionConfig = {
  name: "Process",
  slug: "process-steps-section",
  subSectionName: "Process Steps Section",
  description: "The process steps section explaining how the service works",
  fields: [
    {
      id: "sectionTitle",
      label: "Section Title",
      type: "text",
      placeholder: "Enter section title",
      required: true,
    },
    {
      id: "sectionDescription",
      label: "Section Description",
      type: "textarea",
      placeholder: "Enter section description",
      required: true,
    },
    // Add more fields as needed for process steps
  ],
  elementsMapping: {
    "sectionTitle": "ProcessStepsSectionTitle",
    "sectionDescription": "ProcessStepsSectionDescription",
  }
};

// FAQ section configuration
export const faqSectionConfig: SectionConfig = {
  name: "FAQ",
  slug: "faq-section",
  subSectionName: "FAQ Section",
  description: "The frequently asked questions section",
  fields: [
    {
      id: "sectionTitle",
      label: "Section Title",
      type: "text",
      placeholder: "Enter section title",
      required: true,
    },
    {
      id: "sectionDescription",
      label: "Section Description",
      type: "textarea",
      placeholder: "Enter section description",
      required: true,
    },
    // Add more fields as needed for FAQ
  ],
  elementsMapping: {
    "sectionTitle": "FAQSectionTitle",
    "sectionDescription": "FAQSectionDescription",
  }
};

// Export all section configurations
export const sectionConfigs = {
  hero: heroSectionConfig,
  benefits: benefitsSectionConfig,
  features: featuresSectionConfig,
  processSteps: processStepsSectionConfig,
  faq: faqSectionConfig
};