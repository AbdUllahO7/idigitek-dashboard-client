"use client"

import { useState, useEffect } from "react";
import { useLanguages } from "@/src/hooks/webConfiguration/use-language";
import { Loader2 } from "lucide-react";
import MultilingualSectionComponent from "@/src/components/dashboard/MultilingualSectionComponent";
import apiClient from '@/src/lib/api-client';
import { FieldConfig, LanguageConfig, MultilingualSectionData } from "@/src/app/types/MultilingualSectionTypes";
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections";
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements";
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions";

// Define types for better TypeScript support
interface LanguageData {
  _id: string;
  languageID: string;
  language: string;
  isActive: boolean;
}

interface TranslationData {
  _id: string;
  content: string;
  language: string | LanguageData | { _id: string; languageID: string };
  contentElement: string | { _id: string };
}

// Interface for section configuration
interface SectionConfig {
  name: string;             // Section name used for display
  slug: string;             // Section slug used in API calls
  subSectionName: string;   // Name of the subsection entity
  description: string;      // Description of the subsection
  fields: FieldConfig[];    // Fields configuration
  elementsMapping: Record<string, string>; // Mapping of field IDs to element names
}

// Define props interface
interface GenericSectionIntegrationProps {
  onSectionChange?: (data: MultilingualSectionData) => void;
  config: SectionConfig;    // Configuration for this specific section
  sectionTitle?: string;    // Optional override for section title
  sectionDescription?: string; // Optional override for section description
  addButtonLabel?: string;  // Optional override for add button label
  editButtonLabel?: string; // Optional override for edit button label
  saveButtonLabel?: string; // Optional override for save button label
  noDataMessage?: string;   // Optional override for no data message
}

// Helper function to get the first non-empty value from any language
function getFirstNonEmptyValue(sectionData: MultilingualSectionData | null, fieldId: string): string | null {
  if (!sectionData || !sectionData[fieldId]) return null;
  
  const fieldData = sectionData[fieldId];
  if (typeof fieldData === 'string') return null;
  
  // Convert to Record to fix TypeScript error
  const fieldRecord = fieldData as Record<string, string>;
  const values = Object.values(fieldRecord);
  
  for (const value of values) {
    if (value && value.trim() !== "") {
      return value;
    }
  }
  
  return null;
}

// Helper function to check if a string is a valid MongoDB ObjectId
function isValidObjectId(id: unknown): boolean {
  return Boolean(id) && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

// Helper function to extract ID from various response formats
function extractId(response: any): string | null {
  if (!response) return null;
  
  if (response._id) return response._id;
  if (response.data?._id) return response.data._id;
  if (response.id) return response.id;
  if (response.data?.id) return response.data.id;
  
  // Try to extract from JSON stringification if response is complex
  try {
    const stringified = JSON.stringify(response);
    const idMatch = stringified.match(/"_id":"([^"]+)"/i) || stringified.match(/"id":"([^"]+)"/i);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
  } catch (e) {
    console.error("Error parsing response:", e);
  }
  
  return null;
}

function GenericSectionIntegration({ 
  onSectionChange,
  config,
  sectionTitle,
  sectionDescription,
  addButtonLabel,
  editButtonLabel,
  saveButtonLabel,
  noDataMessage
}: GenericSectionIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sectionData, setSectionData] = useState<MultilingualSectionData | null>(null);
  const [isDataProcessed, setIsDataProcessed] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0); 
  
  // Get hooks for API calls
  const { 
    useGetAll: useGetAllSubSections,
    useCreate: useCreateSubSection,
    useGetCompleteBySlug
  } = useSubSections();
  
  const {
    useGetBySubsection: useGetContentElementsBySubsection,
    useCreate: useCreateContentElement
  } = useContentElements();
  
  const {
    useGetByElement: useGetTranslationsByElement,
    useCreate: useCreateTranslation,
    useBulkUpsert: useBulkUpsertTranslations
  } = useContentTranslations();

  const { 
    useGetAll: useGetAllLanguages 
  } = useLanguages();
  
  // Query data with refetch capabilities
  const getAllSubSectionsQuery = useGetAllSubSections();
  const { data: subSectionsData, isLoading: isLoadingSubSections, refetch: refetchSubSections } = getAllSubSectionsQuery;
  
  // Find the section in all subsections to check if it exists
  const sectionSubsection = subSectionsData?.data?.find(
    (subsection: any) => subsection.name === config.subSectionName
  );
  
  // Get complete section data with elements and translations
  const getCompleteSectionQuery = useGetCompleteBySlug(
    config.slug, 
    Boolean(sectionSubsection)
  );
  const { 
    data: completeSectionData, 
    isLoading: isLoadingSectionData,
    refetch: refetchSectionData
  } = getCompleteSectionQuery;
  
  const { data: languagesData, isLoading: isLoadingLanguages } = useGetAllLanguages();
  
  // Get mutations
  const createSubSection = useCreateSubSection();
  const createContentElement = useCreateContentElement();

  // Log the content elements for debugging
  useEffect(() => {
    if (completeSectionData?.data?.contentElements) {
      console.log(`${config.name} Content Elements:`, completeSectionData.data.contentElements);
    }
  }, [completeSectionData, config.name]);

  // Build section data when complete service data loads
  useEffect(() => {
    // Skip if we've already processed this data or dependencies are loading
    if (isDataProcessed || isLoading || 
        !completeSectionData?.data || 
        !languagesData?.data || 
        isLoadingLanguages || 
        isLoadingSectionData) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get active languages
      const activeLanguages = languagesData?.data?.filter((lang: any) => lang.isActive) || [];
      if (activeLanguages.length === 0) {
        setIsLoading(false);
        setIsDataProcessed(true);
        return;
      }
      
      // Get content elements from complete data
      const contentElements = completeSectionData.data.contentElements || [];
      
      // Initialize section data
      const initialSectionData: MultilingualSectionData = {
        id: completeSectionData.data._id
      };
      
      // Initialize fields
      config.fields.forEach(field => {
        initialSectionData[field.id] = {};
      });
      
      // Map content elements to section data
      for (const element of contentElements) {
        // Find which field this element maps to
        let fieldId: string | null = null;
        
        // Check for exact name match first
        for (const [key, value] of Object.entries(config.elementsMapping)) {
          if (value === element.name) {
            fieldId = key;
            break;
          }
        }
        
        // If no match found, check for case-insensitive match
        if (!fieldId) {
          for (const [key, value] of Object.entries(config.elementsMapping)) {
            if (value.toLowerCase() === element.name.toLowerCase()) {
              fieldId = key;
              break;
            }
          }
        }
        
        if (!fieldId) {
          console.log(`Could not find field mapping for element: ${element.name}`);
          continue;
        }
        
        // Get translations for this element
        const translations = element.translations || [];
        
        // Add translations to section data
        for (const lang of activeLanguages) {
          if (!lang.languageID) continue;
          
          const translation = translations.find((t: any) => {
            if (typeof t.language === 'string') {
              return t.language === lang.languageID || t.language === lang._id;
            } else if (t.language && typeof t.language === 'object') {
              return (
                t.language.languageID === lang.languageID || 
                t.language._id === lang._id
              );
            }
            return false;
          });
          
          if (!initialSectionData[fieldId] || typeof initialSectionData[fieldId] === 'string') {
            initialSectionData[fieldId] = {};
          }
          
          const fieldObj = initialSectionData[fieldId] as Record<string, string>;
          fieldObj[lang.languageID] = translation?.content || element.defaultContent || "";
        }
      }
      
      setSectionData(initialSectionData);
      setIsDataProcessed(true);
      
      // Notify parent component
      if (onSectionChange) {
        onSectionChange(initialSectionData);
      }
    } catch (error) {
      console.error(`Error building ${config.name} section data:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [
    completeSectionData, 
    languagesData, 
    isLoading, 
    isLoadingLanguages, 
    isLoadingSectionData,
    isDataProcessed,
    onSectionChange,
    config.fields,
    config.elementsMapping,
    config.name,
    forceRefresh // Add forceRefresh to trigger rebuild when needed
  ]);
  
  // Reset processed flag when dependencies change
  useEffect(() => {
    if (completeSectionData || languagesData) {
      setIsDataProcessed(false);
    }
  }, [completeSectionData, languagesData]);
  
  // Debug function to directly test translation creation
  const testCreateTranslation = async (elementId: string, languageId: string, content: string): Promise<boolean> => {
    console.log("languageId", languageId);
    try {
      console.log(`TEST: Creating direct translation for element ${elementId}, language ${languageId}`);
      const result = await apiClient.post('/translations', {
        contentElement: elementId,
        language: languageId,
        content: content || "Test content",
        isActive: true
      });
      console.log("TEST: Direct translation create result:", result);
      return true;
    } catch (error) {
      console.error("TEST: Error in direct translation creation:", error);
      return false;
    }
  };
  
  // Handle creating new section when there's no existing one
  const handleCreateNewSection = async (newSectionData: MultilingualSectionData) => {
    try {
      setIsLoading(true);
     
      // 1. Create SubSection first
      const createSubSectionData = {
        name: config.subSectionName,
        description: config.description,
        slug: config.slug,
        isActive: true,
        order: subSectionsData?.data?.length || 0,
        parentSections: [] as string[],
        languages: [] as string[],
        metadata: {} // Optional metadata
      };
      
      console.log(`Creating ${config.name} SubSection with data:`, createSubSectionData);
      
      // Pass this object directly to the mutation
      const response = await createSubSection.mutateAsync(createSubSectionData);
      
      console.log(`${config.name} SubSection creation response:`, response);
      
      // Extract ID from response
      const subSectionId = extractId(response);
      
      // Make sure we have a valid ID
      if (!subSectionId || !isValidObjectId(subSectionId)) {
        console.error("No valid ID found in response:", response);
        throw new Error(`Failed to create ${config.name} SubSection - no valid ID returned`);
      }
      
      console.log(`Created ${config.name} SubSection with ID:`, subSectionId);
      
      // Wait a bit to ensure the subsection is properly created in the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. Create content elements for this subsection
      const createdElements = [];
      
      // Get element types from the elements mapping
      const elementTypes = Object.values(config.elementsMapping);
      
      // Create a map for default content
      const defaultContents: Record<string, string> = {};
      
      // Get user-entered data for default content for each field
      for (const [fieldId, elementName] of Object.entries(config.elementsMapping)) {
        const defaultValue = getFirstNonEmptyValue(newSectionData, fieldId) || 
                            `Default ${elementName} content`;
        defaultContents[elementName] = defaultValue;
      }
      
      console.log(`Creating content elements for ${config.name} with user data:`, defaultContents);
      console.log(`Creating content elements for subSectionId:`, subSectionId);
      
      for (let i = 0; i < elementTypes.length; i++) {
        const elementName = elementTypes[i];
        
        // Determine element type based on name or custom logic
        let elementType = "text"; // Default
        if (elementName.toLowerCase().includes("description") || 
            elementName.toLowerCase().includes("content")) {
          elementType = "paragraph";
        } else if (elementName.toLowerCase().includes("title") || 
                  elementName.toLowerCase().includes("heading")) {
          elementType = "heading";
        }
        
        // Create content element with parent ID
        const contentElementData = {
          name: elementName,
          type: elementType,
          defaultContent: defaultContents[elementName] || `Default ${elementName}`,
          parent: subSectionId,
          isActive: true,
          order: i,
          metadata: {} // Optional metadata
        };
        
        console.log(`Creating ${elementName} element:`, contentElementData);
        
        try {
          const contentElementResponse = await createContentElement.mutateAsync(contentElementData);
          console.log(`Created ${elementName} element:`, contentElementResponse);
          
          // Extract ID from response
          const elementId = extractId(contentElementResponse);
          
          if (!elementId) {
            console.error(`No ID found in ${elementName} element response:`, contentElementResponse);
            continue;
          }
          
          // Create a structured element object with the ID
          const elementWithId = {
            ...contentElementData,
            _id: elementId,
            name: elementName
          };
          
          console.log(`Added element with ID ${elementId} to createdElements array`);
          createdElements.push(elementWithId);
        } catch (elementError) {
          console.error(`Error creating ${elementName} element:`, elementError);
          // Continue with other elements
        }
      }
      
      if (createdElements.length === 0) {
        throw new Error(`Failed to create any content elements for ${config.name}`);
      }
      
      // 3. Create translations for all elements
      const activeLanguages = languagesData?.data?.filter((lang: any) => lang.isActive) || [];
      
      if (activeLanguages.length > 0 && createdElements.length > 0) {
        console.log(`Creating translations for ${config.name} elements...`);
        
        // Try direct API calls for translations
        for (const element of createdElements) {
          // Get the element ID
          const elementId = element._id;
          
          for (const lang of activeLanguages) {
            // Get the raw language ID (MongoDB ObjectId)
            const languageId = lang._id;
            
            console.log(`Element ID: ${elementId}, Language ID: ${languageId}`);
            
            // Skip if IDs are not valid
            if (!isValidObjectId(elementId)) {
              console.error(`Invalid element ID: ${elementId}`);
              continue;
            }
            
            if (!isValidObjectId(languageId)) {
              console.error(`Invalid language ID: ${languageId}`);
              continue;
            }
            
            // Find field for this element
            let fieldId: string | null = null;
            for (const [key, value] of Object.entries(config.elementsMapping)) {
              if (value === element.name) {
                fieldId = key;
                break;
              }
            }
            
            if (!fieldId) continue;
            
            // Get content from form data or use default
            let content = "";
            
            // Try to get the language-specific content first
            const fieldData = newSectionData[fieldId];
            if (typeof fieldData !== 'string' && fieldData && lang.languageID) {
              const fieldRecord = fieldData as Record<string, string>;
              content = fieldRecord[lang.languageID] || "";
            }
            
            // If no content found, use defaults
            if (!content) {
              content = defaultContents[element.name] || "";
            }
            
            // Create translation through direct API call
            try {
              const translationData = {
                contentElement: elementId,
                language: languageId, // Use the raw MongoDB ID
                content: content || `Default ${element.name} content`,
                isActive: true
              };
              
              console.log("Creating translation with data:", translationData);
              
              // Use direct API call to avoid any issues with mutation
              const result = await apiClient.post('/translations', translationData);
              console.log("Translation created:", result);
            } catch (error) {
              console.error("Error creating translation:", error);
              // Try using the creation test function
              await testCreateTranslation(elementId, languageId, content);
            }
          }
        }
      }
      
      // After creation is complete, manually refetch the data
      console.log(`Refetching data after ${config.name} creation...`);
      
      // Trigger refetch of subsections to get the new subsection
      if (refetchSubSections) {
        await refetchSubSections();
      }
      
      // Wait a bit for the server to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trigger refetch of section data to get the complete section
      if (refetchSectionData) {
        await refetchSectionData();
      }
      
      // Force a re-processing of the data by incrementing the forceRefresh counter
      setForceRefresh(prev => prev + 1);
      
      // Set the new section data
      const createdSectionData: MultilingualSectionData = {
        ...newSectionData,
        id: subSectionId
      };
      
      setSectionData(createdSectionData);
      setIsDataProcessed(false); // Set to false to force rebuild
      
      // Notify parent component
      if (onSectionChange) {
        onSectionChange(createdSectionData);
      }
    } catch (error) {
      console.error(`Error creating ${config.name} section:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle multilingual section change
  const handleSectionChangeWrapper = (newSectionData: MultilingualSectionData | null) => {
    if (newSectionData) {
      // This is an async function, but the MultilingualSectionComponent expects a sync function
      // So we just fire and forget
      handleSectionChange(newSectionData).catch(error => {
        console.error(`Error in ${config.name} section change:`, error);
      });
    }
  };
  
  // The actual implementation that does the work
  const handleSectionChange = async (newSectionData: MultilingualSectionData) => {
    console.log(`handleSectionChange for ${config.name}`, newSectionData);
    
    // If there's no existing section subsection, create one
    if (!completeSectionData?.data) {
      return handleCreateNewSection(newSectionData);
    }
    
    try {
      setIsLoading(true);
      
      // Get active languages
      const activeLanguages = languagesData?.data?.filter((lang: any) => lang.isActive) || [];
      
      // Get content elements from complete data
      const contentElements = completeSectionData.data.contentElements || [];
      
      // Update individual translations directly
      console.log(`Updating ${config.name} translations individually`);
      
      for (const element of contentElements) {
        // Find which field this element maps to
        let fieldId: string | null = null;
        
        // Check for exact name match first
        for (const [key, value] of Object.entries(config.elementsMapping)) {
          if (value === element.name) {
            fieldId = key;
            break;
          }
        }
        
        // If no match found, check for case-insensitive match
        if (!fieldId) {
          for (const [key, value] of Object.entries(config.elementsMapping)) {
            if (value.toLowerCase() === element.name.toLowerCase()) {
              fieldId = key;
              break;
            }
          }
        }
        
        if (!fieldId) {
          console.log(`Could not find field mapping for element: ${element.name}`);
          continue;
        }
        
        // Get existing translations for this element
        const existingTranslations = element.translations || [];
        
        for (const lang of activeLanguages) {
          // Get the raw MongoDB ID for the language
          const languageId = lang._id;
          
          // Validate language ID
          if (!languageId || !isValidObjectId(languageId)) {
            console.error(`Invalid language ID: ${languageId} for language: ${lang.language}`);
            continue;
          }
          
          // Get new content for this language
          const fieldData = newSectionData[fieldId];
          let newContent = "";
          if (typeof fieldData !== 'string' && fieldData && lang.languageID) {
            const fieldRecord = fieldData as Record<string, string>;
            newContent = fieldRecord[lang.languageID] || "";
          }
          
          // Find existing translation
          const existingTranslation = existingTranslations.find((t: any) => {
            if (typeof t.language === 'string') {
              return t.language === lang.languageID || t.language === languageId;
            } else if (t.language && typeof t.language === 'object') {
              const langObj = t.language as any;
              return (
                langObj.languageID === lang.languageID || 
                langObj._id === lang._id
              );
            }
            return false;
          });
          
          try {
            if (existingTranslation) {
              // Update existing translation
              await apiClient.put(`/translations/${existingTranslation._id}`, {
                content: newContent,
                isActive: true
              });
              console.log(`Updated translation ${existingTranslation._id}`);
            } else {
              // Create new translation
              const translationData = {
                contentElement: element._id,
                language: languageId, // Use the raw MongoDB ID
                content: newContent || `Default ${element.name} content`,
                isActive: true
              };
              
              console.log("Creating translation with data:", translationData);
              
              // Use direct API call
              const result = await apiClient.post('/translations', translationData);
              console.log("Translation created:", result);
            }
          } catch (translationError) {
            console.error(`Error updating/creating translation:`, translationError);
            // Try test function if direct call fails
            if (!existingTranslation) {
              await testCreateTranslation(element._id, languageId, newContent);
            }
          }
        }
      }
      
      // After updates are done, refetch section data
      console.log(`Refetching ${config.name} data after updates...`);
      if (refetchSectionData) {
        await refetchSectionData();
      }
      
      // Force a re-processing of the data
      setForceRefresh(prev => prev + 1);
      
      setSectionData(newSectionData);
      setIsDataProcessed(false); // Force rebuild
      
      // Notify parent component
      if (onSectionChange) {
        onSectionChange(newSectionData);
      }
    } catch (error) {
      console.error(`Error updating ${config.name} section:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Convert language data to the format expected by MultilingualSectionComponent
  const languages: LanguageConfig[] = languagesData?.data
    ?.filter((lang: any) => lang.isActive)
    ?.map((lang: any) => ({
      id: lang.languageID,
      label: lang.language
    })) || [];
  
  if (isLoadingSubSections || isLoadingLanguages || isLoadingSectionData || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <span className="ml-2 text-muted-foreground">Loading {config.name.toLowerCase()} section data...</span>
      </div>
    );
  }
  
  // Use provided values or generate defaults from config
  const displayTitle = sectionTitle || `${config.name} Section Content`;
  const displayDescription = sectionDescription || `Manage your ${config.name.toLowerCase()} section content in multiple languages.`;
  const displayAddButton = addButtonLabel || `Add ${config.name} Section`;
  const displayEditButton = editButtonLabel || `Edit ${config.name} Section`;
  const displaySaveButton = saveButtonLabel || `Save ${config.name} Section`;
  const displayNoDataMessage = noDataMessage || `No ${config.name.toLowerCase()} section found. Click '${displayAddButton}' to create one.`;
  
  return (
    <MultilingualSectionComponent
      sectionTitle={displayTitle}
      sectionDescription={displayDescription}
      fields={config.fields}
      languages={languages}
      sectionData={sectionData}
      onSectionChange={handleSectionChangeWrapper}
      addButtonLabel={displayAddButton}
      editButtonLabel={displayEditButton}
      saveButtonLabel={displaySaveButton}
      sectionName={config.name}
      noDataMessage={displayNoDataMessage}
    />
  );
}

export default GenericSectionIntegration;