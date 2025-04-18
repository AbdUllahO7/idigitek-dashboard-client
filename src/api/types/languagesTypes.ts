
// Define the Language type based on your mongoose model
export interface Language {
    _id?: string;
    language: string;
    languageID : string,
    isActive :boolean,
    subSections: string[];
    createdAt?: string;
    updatedAt?: string;
  }
  
  // Create DTO type for creating a new language
  export interface CreateLanguageDto {
    language: string;
    languageID : string;
    subSections?: string[];
  }
  
  // Create DTO type for updating a language
  export interface UpdateLanguageDto {
    language?: string;
    languageID?: string;
    subSections?: string[];
  }

  export interface Section extends Resource {
    name: string;
    description?: string;
    order?: number;
    image?: string;
  }

  export interface Resource {
        _id?: string;
        isActive?: boolean;
        subSections?: string[] | any[];
        createdAt?: string;
        updatedAt?: string;
    }
    
    // Language specific interface
    export interface Language extends Resource {
        language: string;
        languageID: string;
    }
