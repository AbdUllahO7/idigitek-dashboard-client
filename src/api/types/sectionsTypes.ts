export interface Section {
  _id: string;
  name: string;
  description?: string;
  image?: string | null;
  isActive: boolean;
  order: number;
  sectionItems?: string[] | SectionItem[]; // Reference to section items
  createdAt?: string;
  updatedAt?: string;
}

export interface SectionItem {
  _id: string;
  name: string;
  description?: string;
  image?: string | null;
  isActive: boolean;
  order: number;
  isMain: boolean; // Indicates if this is the main section item
  section: string | Section; // Reference to parent section
  subsections?: string[] | any[]; // Reference to subsections
  subsectionCount?: number; // Count of subsections
  createdAt?: string;
  updatedAt?: string;
}

export interface SubSection {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  order: number;
  sectionItem: string | SectionItem; // Reference to parent section item
  languages?: string[] | any[];
  metadata?: any;
  contentCount?: number;
  contentElements?: any[];
  createdAt?: string;
  updatedAt?: string;
}