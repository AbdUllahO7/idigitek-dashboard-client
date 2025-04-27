// Type definitions for frontend API integration

export interface ContentElement {
  _id: string;
  name: string;
  type: 'text' | 'heading' | 'paragraph' | 'list' | 'image' | 'video' | 'link' | 'custom';
  defaultContent?: string;
  isActive: boolean;
  metadata?: any;
  order: number;
  parent: string;
  createdAt?: string;  // Make optional
  updatedAt?: string;  // Make optional
  translations?: ContentTranslation[];
}
  
  export interface ContentTranslation {
    _id: string;
    content: string;
    language: string | Language;
    contentElement: string | ContentElement;
    isActive: boolean;
    metadata?: any;
    createdAt?: string;  // Make optional
    updatedAt?: string;  // Make optional
  }
  
  export interface SubSection {
    _id: string;
    name: string;
    description?: string;
    slug: string;
    isActive: boolean;
    order: number;
    sectionItem: string;
    languages: string[] | Language[];
    metadata?: any;
    createdAt?: string;  // Make optional
    updatedAt?: string;  // Make optional
    contentElements?: ContentElement[];
    contentCount?: number;
  }
  
  export interface Language {
    _id: string;
    language: string;
    languageID: string;
    isActive: boolean;
    subSections: string[] | SubSection[];
    createdAt: string;
    updatedAt: string;
  }
  
  // You can extend these with more specific types as needed
  export type ContentElementType = ContentElement['type'];
  
  export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
    requestId?: string;
  }