export interface SubSection {
    _id?: string;
    name: string;
    description?: string;
    isActive: boolean;
    order: number;
    parentSections: string[];
    languages: string[];
    createdAt?: string;
    updatedAt?: string;
  }
  
  // Create DTO type for creating a new subsection
  export interface CreateSubSectionDto {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    parentSections?: string[];
    languages?: string[];
  }
  
  // Create DTO type for updating a subsection
  export interface UpdateSubSectionDto {
    name?: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    parentSections?: string[];
    languages?: string[];
  }