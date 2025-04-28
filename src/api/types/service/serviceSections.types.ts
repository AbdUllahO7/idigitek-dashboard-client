import { Language } from "../language.types";
import { MultilingualSectionData } from "../MultilingualSection.types";

export interface BenefitsFormProps {
    languageIds: readonly string[];
    activeLanguages: Language[];
    onDataChange?: (data: any) => void;
    slug?: string;
    ParentSectionId: string;
    initialData?: any;
  }
  
  export interface FaqFormProps {
    languageIds: readonly string[];
    activeLanguages: Language[];
    onDataChange?: (data: any) => void;
    slug?: string;
    ParentSectionId: string;
    initialData?: any;
  }
  
  export interface HeroFormProps {
    languageIds: readonly string[];
    activeLanguages: Language[];
    onDataChange?: (data: any) => void;
    slug?: string;
    ParentSectionId: string;
    initialData?: any;
  }
  
  export interface ProcessStepsFormProps {
    languageIds: readonly string[];
    activeLanguages: Language[];
    onDataChange?: (data: any) => void;
    slug?: string;
    ParentSectionId: string;
    initialData?: any;
  }
  
  export type FormData = {
    hero: MultilingualSectionData | Record<string, any>;
    benefits: Record<string, any>;
    features: Record<string, any>;
    processSteps: Record<string, any>;
    faq: Record<string, any>;
  }