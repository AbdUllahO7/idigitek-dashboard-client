export interface Section {
    _id?: string;
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    subSections?: string[];
    createdAt?: string;
    updatedAt?: string;
    image?: string
  }
  
  // Create DTO type for creating a new section
  export interface CreateSectionDto {
    name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    subSections?: string[];
    image?: string

  }
  
  // Create DTO type for updating a section
  export interface UpdateSectionDto {
    name?: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    subSections?: string[];
    image?: string
  }