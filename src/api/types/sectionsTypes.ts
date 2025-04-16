export interface Section {
    _id?: string;
    section_name: string;
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
    section_name: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    subSections?: string[];
    image?: string

  }
  
  // Create DTO type for updating a section
  export interface UpdateSectionDto {
    section_name?: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    subSections?: string[];
    image?: string
  }