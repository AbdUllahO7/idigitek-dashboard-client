export interface SubSection {
  _id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  order: number;
  parentSections: string[];
  languages: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
} 