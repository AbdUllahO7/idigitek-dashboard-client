export interface SectionElement {
    _id?: string;
    name: string;
    type: 'text' | 'image' | 'icon' | 'gallery' | 'video' | 'link' | 'custom';
    text?: string;
    image?: string;
    icon?: string[];
    images?: string[];
    url?: string;
    customData?: any;
    isActive: boolean;
    order: number;
    createdAt?: string;
    updatedAt?: string;
  }
  
  // Create DTO type for creating a new section element
  export interface CreateSectionElementDto {
    name: string;
    type: 'text' | 'image' | 'icon' | 'gallery' | 'video' | 'link' | 'custom';
    text?: string;
    image?: string;
    icon?: string[];
    images?: string[];
    url?: string;
    customData?: any;
    isActive?: boolean;
    order?: number;
  }
  
  // Create DTO type for updating a section element
  export interface UpdateSectionElementDto {
    name?: string;
    type?: 'text' | 'image' | 'icon' | 'gallery' | 'video' | 'link' | 'custom';
    text?: string;
    image?: string;
    icon?: string[];
    images?: string[];
    url?: string;
    customData?: any;
    isActive?: boolean;
    order?: number;
  }
  