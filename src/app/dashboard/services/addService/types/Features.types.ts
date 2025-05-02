import { useForm } from "react-hook-form";
import { z } from "zod";
import { Language } from "./HeroFor.types";

export const createFeaturesSchema = (languageIds: string[], activeLanguages: Language[]) => {
  const schemaShape: Record<string, any> = {}

  const languageCodeMap = activeLanguages.reduce<Record<string, string>>((acc, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  languageIds.forEach((langId) => {
    const langCode = languageCodeMap[langId] || langId
    schemaShape[langCode] = z
      .array(
        z.object({
          id: z.string().min(1, { message: "ID is required" }),
          title: z.string().min(1, { message: "Title is required" }),
          content: z.object({
            heading: z.string().min(1, { message: "Heading is required" }),
            description: z.string().min(1, { message: "Description is required" }),
            features: z
              .array(z.string().min(1, { message: "Feature cannot be empty" }))
              .min(1, { message: "At least one feature is required" }),
            image: z.string().min(1, { message: "Image is required" }),
          }),
        }),
      )
      .min(1, { message: "At least one feature is required" })
  })

  return z.object(schemaShape)
}
export type FeaturesSchemaType = ReturnType<typeof createFeaturesSchema>

export interface FeatureContent {
    heading: string;
    description: string;
    features: string[];
    image: string;
  }
  
  export  interface Feature {
    id: string;
    title: string;
    content: FeatureContent;
  }
  
  export  interface ContentElement {
    _id: string;
    name: string;
    type: string;
    parent: string;
    isActive: boolean;
    order: number;
    defaultContent: string;
    imageUrl?: string;
    translations?: Translation[];
  }
  
  export  interface Translation {
    _id?: string;
    content: string;
    language: string | { _id: string };
    contentElement: string;
    isActive: boolean;
  }
  
  export  interface SubsectionData {
    _id: string;
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    order: number;
    sectionItem: string;
    languages: string[];
    elements?: ContentElement[];
    contentElements?: ContentElement[];
  }
  
  export  interface FeatureCountByLanguage {
    language: string;
    count: number;
  }
  
  export  interface FeaturesFormProps {
    languageIds: string[];
    activeLanguages: Language[];
    onDataChange?: (data: Record<string, Feature[]>) => void;
    slug?: string; // Optional slug to load existing data
    ParentSectionId: string; // Parent section ID for creating new sections
    initialData?: Record<string, any>; // Initial data for the form
  }
  
  export  interface FeaturesFormRef {
    getFormData: () => Promise<Record<string, Feature[]>>;
    getFeatureImages: () => Record<number, File | null>;
    form: ReturnType<typeof useForm<z.infer<FeaturesSchemaType>>>;
    hasUnsavedChanges: boolean;
    resetUnsavedChanges: () => void;
    existingSubSectionId: string | null;
    contentElements: ContentElement[];
  }