export interface Language {
  _id: string;
  languageID: string;
}

export interface ContentElement {
  _id: string;
  name: string;
  type: string;
  parent: string;
  isActive: boolean;
  order: number;
  defaultContent: string;
  imageUrl?: string;
  translations?: Translation[];
  key?: string;
}

export interface Translation {
  content: string;
  language: string;
  contentElement: string;
  isActive: boolean;
  _id?: string;
}

export interface SubSectionData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  isMain: boolean;
  order: number;
  sectionItem: string;
  languages: string[];
  elements?: ContentElement[];
  contentElements?: ContentElement[];
}

export interface FormLanguageValues {
    title: string;
    description: string;
    backLinkText: string;
}

export interface FormValues {
    backgroundImage: string;
    [key: string]: string | FormLanguageValues;
}

export interface InitialData {
    description?: string;
    image?: string;
}

// Component props interface
export interface HeroFormProps {
    languageIds: string[];
    activeLanguages: Language[];
    onDataChange?: (data: any) => void;
    slug?: string;
    ParentSectionId?: string;
    initialData?: InitialData;
}