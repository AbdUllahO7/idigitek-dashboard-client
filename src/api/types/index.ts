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
    createdAt: string;
    updatedAt: string;
    translations?: ContentTranslation[]; // Optional field when translations are included
  }
  
  export interface ContentTranslation {
    _id: string;
    content: string;
    language: string | Language;
    contentElement: string | ContentElement;
    isActive: boolean;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface SubSection {
    _id: string;
    name: string;
    description?: string;
    slug: string;
    isActive: boolean;
    order: number;
    parentSections: string[] | any[];
    languages: string[] | Language[];
    metadata?: any;
    createdAt: string;
    updatedAt: string;
    contentElements?: ContentElement[]; // Optional field when content is included
    contentCount?: number; // Optional field when content count is requested
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