// Define the Language type based on your mongoose model
export interface Language {
    _id?: string;
    language: string;
    languageID : string,
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