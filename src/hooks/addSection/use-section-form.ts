import { useState, useEffect, useRef } from "react"
import { UseFormReturn } from "react-hook-form"
import { toast } from "@/src/hooks/use-toast"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import apiClient from "@/src/lib/api-client"
import { ContentTranslation, SubSection, Language } from "@/src/api/types"

interface ElementDefinition {
  type: 'image' | 'text' | 'file' | 'link' | 'array';
  key: string;
  name: string;
  description?: string;
  isArray?: boolean;
}

interface UseSectionFormProps<T> {
  form: UseFormReturn<T>
  slug?: string
  languageIds: readonly string[]
  activeLanguages: Language[]
  sectionName: string
  sectionDescription: string
  elementDefinitions: ElementDefinition[]
  onDataChange?: (data: any) => void
}

interface SectionFormState {
  isLoadingData: boolean
  dataLoaded: boolean
  hasUnsavedChanges: boolean
  existingSubSectionId: string | null
  contentElements: any[]
  imageFile: File | null
}

export function useSectionForm<T>({
  form,
  slug,
  languageIds,
  activeLanguages,
  sectionName,
  sectionDescription,
  elementDefinitions,
  onDataChange
}: UseSectionFormProps<T>) {
  // State
  const [state, setState] = useState<SectionFormState>({
    isLoadingData: !slug,
    dataLoaded: !slug,
    hasUnsavedChanges: false,
    existingSubSectionId: null,
    contentElements: [],
    imageFile: null
  });

  // Create a function to update individual state properties
  const updateState = (newState: Partial<SectionFormState>) => {
    setState(prevState => ({ ...prevState, ...newState }));
  };

  // Get default language code for form values
  const defaultLangCode = activeLanguages.length > 0 ? activeLanguages[0].languageID : 'en';

  // API hooks
  const { useCreate: useCreateSubSection, useGetCompleteBySlug } = useSubSections();
  const { useCreate: useCreateContentElement } = useContentElements();
  const { useBulkUpsert: useBulkUpsertTranslations } = useContentTranslations();

  const createSubSection = useCreateSubSection();
  const createContentElement = useCreateContentElement();
  const bulkUpsertTranslations = useBulkUpsertTranslations();

  // Query for complete subsection data by slug if provided
  const { data: completeSubsectionData, isLoading: isLoadingSubsection, refetch } = 
    useGetCompleteBySlug(slug || '', false, true, { enabled: !!slug });

  const onDataChangeRef = useRef(onDataChange);
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  // Element name to key mapping
  const elementNameToKeyMap = elementDefinitions.reduce((acc, el) => {
    acc[el.name] = el.key;
    return acc;
  }, {} as Record<string, string>);

  // Element key to name mapping
  const elementKeyToNameMap = elementDefinitions.reduce((acc, el) => {
    acc[el.key] = el.name;
    return acc;
  }, {} as Record<string, string>);

  // Mappings for languages
  const getLangCodeToIdMap = () => {
    return activeLanguages.reduce((acc: Record<string, string>, lang) => {
      acc[lang.languageID] = lang._id;
      return acc;
    }, {});
  };

  const getLangIdToCodeMap = () => {
    return activeLanguages.reduce((acc: Record<string, string>, lang) => {
      acc[lang._id] = lang.languageID;
      return acc;
    }, {});
  };

  // Function to process and load data into the form
  const processAndLoadData = async (subsectionData: any) => {
    if (!subsectionData) return;

    try {
      updateState({ existingSubSectionId: subsectionData._id });

      if (subsectionData.contentElements && subsectionData.contentElements.length > 0) {
        updateState({ contentElements: subsectionData.contentElements });

        // Process elements based on their type
        const elementsMap = new Map();
        subsectionData.contentElements.forEach((el: any) => {
          elementsMap.set(el.name, el);
        });
  
        // Handle element-specific logic (like image fields)
        for (const el of elementDefinitions) {
          const element = elementsMap.get(el.name);
          if (!element) continue;
  
          if (el.type === 'image' && element.imageUrl) {
            form.setValue(el.key, element.imageUrl);
          }
          
          // Special handling for array types
          if ((el.type === 'array' || el.isArray)) {
            // Get language code mapping
            const langIdToCodeMap = getLangIdToCodeMap();
            
            // Group array items by language
            const itemsByLanguage: Record<string, any[]> = {};
            
            // Initialize empty arrays for all languages to ensure form has values
            languageIds.forEach(langId => {
              const langCode = langIdToCodeMap[langId] || langId;
              itemsByLanguage[langCode] = [];
              
              // Add default empty item for each language
              if (el.key === 'benefits') {
                itemsByLanguage[langCode].push({
                  icon: "Clock",
                  title: "",
                  description: ""
                });
              }
            });
            
            // Try to fetch array items if element already exists
            // This might fail if the endpoint isn't ready yet, but we'll still have defaults
            if (element._id) {
              try {
                // First try to access array items directly from the element if available
                if (element.arrayItems && Array.isArray(element.arrayItems)) {
                  element.arrayItems.forEach((item: any) => {
                    const langId = item.language?._id || item.language;
                    const langCode = langIdToCodeMap[langId] || langId;
                    
                    if (!itemsByLanguage[langCode]) {
                      itemsByLanguage[langCode] = [];
                    }
                    
                    // Parse the content if it's a JSON string
                    let parsedContent;
                    try {
                      if (typeof item.content === 'string') {
                        parsedContent = JSON.parse(item.content);
                      } else {
                        parsedContent = item.content;
                      }
                    } catch (e) {
                      parsedContent = item.content; // Use as is if not valid JSON
                    }
                    
                    // Replace default empty item if this is the first item
                    if (itemsByLanguage[langCode].length === 1 && 
                        itemsByLanguage[langCode][0].title === "" && 
                        itemsByLanguage[langCode][0].description === "") {
                      itemsByLanguage[langCode] = [parsedContent];
                    } else {
                      itemsByLanguage[langCode].push(parsedContent);
                    }
                  });
                } else {
                  // If arrayItems isn't available directly, try the API endpoint
                  try {
                    const arrayItemsResponse = await apiClient.get(`/content-elements/${element._id}/array-items`);
                    const arrayItems = arrayItemsResponse.data?.data || [];
                    
                    if (Array.isArray(arrayItems) && arrayItems.length > 0) {
                      // Clear defaults since we have real data
                      languageIds.forEach(langId => {
                        const langCode = langIdToCodeMap[langId] || langId;
                        itemsByLanguage[langCode] = [];
                      });
                      
                      arrayItems.forEach((item: any) => {
                        const langId = item.language?._id || item.language;
                        const langCode = langIdToCodeMap[langId] || langId;
                        
                        if (!itemsByLanguage[langCode]) {
                          itemsByLanguage[langCode] = [];
                        }
                        
                        // Parse the content if it's a JSON string
                        let parsedContent;
                        try {
                          if (typeof item.content === 'string') {
                            parsedContent = JSON.parse(item.content);
                          } else {
                            parsedContent = item.content;
                          }
                        } catch (e) {
                          parsedContent = item.content; // Use as is if not valid JSON
                        }
                        
                        itemsByLanguage[langCode].push(parsedContent);
                      });
                    }
                  } catch (error) {
                    console.error("Failed to fetch array items from API:", error);
                    // We'll use the defaults initialized above
                  }
                }
              } catch (error) {
                console.error("Failed to process array items:", error);
                // We'll use the defaults initialized above
              }
            }
            
            // Set form values for each language
            Object.entries(itemsByLanguage).forEach(([langCode, items]) => {
              form.setValue(langCode, items);
            });
          }
        }

        // Create a mapping of languages for easier access
        const langIdToCodeMap = getLangIdToCodeMap();

        // Initialize form values for each language
        const languageValues: Record<string, Record<string, string>> = {};

        // Initialize all languages with empty values
        languageIds.forEach(langId => {
          const langCode = langIdToCodeMap[langId] || langId;
          languageValues[langCode] = elementDefinitions
            .filter(el => el.type === 'text')
            .reduce((acc, el) => {
              acc[el.key] = '';
              return acc;
            }, {} as Record<string, string>);
        });

        // Process text elements and their translations
        const textElements = subsectionData.contentElements.filter((el: any) => el.type === 'text');
        textElements.forEach((element: any) => {
          const key = elementNameToKeyMap[element.name];
          if (!key) return;

          // First set default content for all languages
          const defaultContent = element.defaultContent || '';
          if (defaultContent) {
            Object.keys(languageValues).forEach(langCode => {
              languageValues[langCode][key] = defaultContent;
            });
          }
          
          // Then process each translation
          if (element.translations && element.translations.length > 0) {
            element.translations.forEach((translation: any) => {
              // Get the language code from the language object or ID
              let langCode;
              if (translation.language && translation.language._id) {
                // Handle nested language object
                langCode = langIdToCodeMap[translation.language._id];
              } else if (translation.language) {
                // Handle language ID directly
                langCode = langIdToCodeMap[translation.language];
              }
              
              if (langCode && languageValues[langCode] && translation.content) {
                languageValues[langCode][key] = translation.content;
              }
            });
          }
        });

        // Set text values in form
        Object.entries(languageValues).forEach(([langCode, values]) => {
          form.setValue(langCode as any, values as any);
        });
      }
      
      updateState({ dataLoaded: true, hasUnsavedChanges: false });
    } catch (error) {
      console.error(`Error processing ${sectionName} data:`, error);
      toast({
        title: `Error loading ${sectionName} data`,
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      updateState({ isLoadingData: false });
    }
  };

  // Effect to populate form with existing data from complete subsection
  useEffect(() => {
    // Skip this effect entirely if no slug is provided
    if (!slug) return;
    
    if (state.dataLoaded || isLoadingSubsection || !completeSubsectionData?.data) return;
  
    updateState({ isLoadingData: true });
    processAndLoadData(completeSubsectionData.data);
  }, [completeSubsectionData, isLoadingSubsection, state.dataLoaded, slug]);

  // Track form changes
  useEffect(() => {
    if (state.isLoadingData || !state.dataLoaded) return;

    const subscription = form.watch((value) => {
      updateState({ hasUnsavedChanges: true });
      if (onDataChangeRef.current) {
        onDataChangeRef.current(value);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, state.isLoadingData, state.dataLoaded]);

  // Save function
  const handleSave = async () => {
    if (!(await form.trigger())) return;

    updateState({ isLoadingData: true });
    try {
      // Get current form values before any processing
      const allFormValues = form.getValues();
      console.log("Form values at save:", allFormValues);
      
      let sectionId = state.existingSubSectionId;
      
      // Create or update logic here
      if (!state.existingSubSectionId) {
        // Create new subsection
        const subsectionData: Omit<SubSection, "_id"> = {
          name: sectionName,
          slug: slug || `${sectionName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          description: sectionDescription,
          isActive: true,
          order: 0,
          parentSections: [],
          languages: languageIds as string[],
        };

        const newSubSection = await createSubSection.mutateAsync(subsectionData);
        sectionId = newSubSection.data._id;
      }

      if (!sectionId) {
        throw new Error(`Failed to create or retrieve ${sectionName} ID`);
      }

      // Get mappings
      const langIdToCodeMap = getLangIdToCodeMap();
      const langCodeToIdMap = getLangCodeToIdMap();

      if (state.existingSubSectionId && state.contentElements.length > 0) {
        // Update existing elements
        
        // Handle image elements
        const imageElements = state.contentElements.filter(e => e.type === 'image');
        for (const imgElement of imageElements) {
          if (state.imageFile) {
            const formData = new FormData();
            formData.append('image', state.imageFile);
            await apiClient.post(`/content-elements/${imgElement._id}/image`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }
        }

        // Handle array elements
        const arrayElements = state.contentElements.filter(e => 
          e.type === 'array' || elementDefinitions.find(def => def.name === e.name && (def.type === 'array' || def.isArray))
        );

        for (const arrayElement of arrayElements) {
          // For each language, update the array items
          for (const langId of languageIds) {
            const langCode = langIdToCodeMap[langId] || langId;
            
            // Get array data for this language
            const langValues = allFormValues[langCode];
            
            if (Array.isArray(langValues)) {
              // For benefits: stringify the array items as they contain objects
              const arrayItemsData = langValues.map((item, index) => ({
                contentElement: arrayElement._id,
                language: langId,
                content: JSON.stringify(item), // Convert objects to strings for storage
                order: index,
                isActive: true
              }));
              
              // Try to call API to update array items for this language
              try {
                await apiClient.post(`/content-elements/${arrayElement._id}/array-items`, {
                  items: arrayItemsData,
                  language: langId
                });
              } catch (error) {
                console.error(`Error saving array items for language ${langCode}:`, error);
                
                // Fallback: try without language parameter if that's how the API is implemented
                try {
                  await apiClient.post(`/content-elements/${arrayElement._id}/array-items`, {
                    items: arrayItemsData
                  });
                } catch (fallbackError) {
                  console.error(`Fallback also failed:`, fallbackError);
                  throw new Error(`Failed to save array items for ${langCode}: ${error.message}`);
                }
              }
            }
          }
        }

        // For text elements, update the translations
        const textElements = state.contentElements.filter(e => e.type === 'text');
        const translations: Omit<ContentTranslation, "_id">[] = [];

        // Process form values and create translations
        for (const langId of languageIds) {
          const langCode = langIdToCodeMap[langId] || langId;
          const langValues = allFormValues[langCode];
          
          // Skip if not an object (array items are handled separately)
          if (!langValues || typeof langValues !== 'object' || Array.isArray(langValues)) continue;
          
          textElements.forEach(element => {
            const key = elementNameToKeyMap[element.name];
            if (!key || !(key in langValues)) return;
            
            translations.push({
              content: langValues[key],
              language: langId,
              contentElement: element._id,
              isActive: true,
            });
          });
        }

        if (translations.length > 0) {
          await bulkUpsertTranslations.mutateAsync(translations);
        }
      } else {
        // Create new elements
        const createdElements = [];

        // Create all elements first
        for (const [index, el] of elementDefinitions.entries()) {
          let defaultContent = "";
          let elementType = el.type;
          
          if (el.type === 'image') {
            defaultContent = 'image-placeholder';
          } else if (el.type === 'text' && allFormValues[defaultLangCode]) {
            // For text elements, use the value from the default language
            const langValues = allFormValues[defaultLangCode];
            defaultContent = langValues && typeof langValues === 'object' && el.key in langValues
              ? langValues[el.key]
              : '';
          } else if (el.type === 'array' || el.isArray) {
            // For array type, no default content is needed
            elementType = 'array';
          }

          const elementData = {
            name: el.name,
            type: elementType,
            parent: sectionId,
            isActive: true,
            order: index,
            defaultContent: defaultContent,
          };
          
          const newElement = await createContentElement.mutateAsync(elementData);
          createdElements.push({ ...newElement.data, key: el.key, type: elementType });
        }

        // Upload image if needed (for image elements)
        const imageElements = createdElements.filter(e => e.type === 'image');
        for (const imgElement of imageElements) {
          if (state.imageFile) {
            const formData = new FormData();
            formData.append('image', state.imageFile);
            try {
              await apiClient.post(`/content-elements/${imgElement._id}/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
            } catch (error) {
              console.error("Failed to upload image:", error);
            }
          }
        }

        // Create array items for array elements
        const arrayElements = createdElements.filter(e => e.type === 'array');
        for (const arrayElement of arrayElements) {
          for (const langId of languageIds) {
            const langCode = langIdToCodeMap[langId] || langId;
            const langValues = allFormValues[langCode];
            
            if (Array.isArray(langValues)) {
              // For benefits: stringify the object data
              const arrayItemsData = langValues.map((item, index) => ({
                contentElement: arrayElement._id,
                language: langId,
                content: JSON.stringify(item), // Store objects as JSON strings
                order: index,
                isActive: true
              }));
              
              // Try to call API to create array items for this language
              try {
                await apiClient.post(`/content-elements/${arrayElement._id}/array-items`, {
                  items: arrayItemsData,
                  language: langId
                });
              } catch (error) {
                console.error(`Error creating array items for language ${langCode}:`, error);
                
                // Fallback: try without language parameter if that's how the API is implemented
                try {
                  await apiClient.post(`/content-elements/${arrayElement._id}/array-items`, {
                    items: arrayItemsData
                  });
                } catch (fallbackError) {
                  console.error(`Fallback also failed:`, fallbackError);
                  // Log but don't throw to allow other languages to process
                  console.error(`Unable to save array items for ${langCode}: ${error.message}`);
                }
              }
            }
          }
        }

        // Create translations for all text elements
        const textElements = createdElements.filter(e => e.type === 'text');
        const translations: Omit<ContentTranslation, "_id">[] = [];
        
        // Process each language in the form values
        for (const langId of languageIds) {
          const langCode = langIdToCodeMap[langId] || langId;
          const langValues = allFormValues[langCode];
          
          // Skip if not an object (array items are handled separately)
          if (!langValues || typeof langValues !== 'object' || Array.isArray(langValues)) continue;
          
          // For each text element, create a translation
          for (const element of textElements) {
            if (!(element.key in langValues)) continue;
            
            const content = langValues[element.key];
            translations.push({
              content: content,
              language: langId,
              contentElement: element._id,
              isActive: true,
            });
          }
        }

        if (translations.length > 0) {
          try {
            await bulkUpsertTranslations.mutateAsync(translations);
          } catch (error) {
            console.error("Failed to create translations:", error);
          }
        }
      }

      toast({ 
        title: state.existingSubSectionId 
          ? `${sectionName} updated successfully!`
          : `${sectionName} created successfully!`
      });

      // Refresh data immediately after save
      if (slug) {
        const result = await refetch();
        if (result.data?.data) {
          // Reset form with the new data
          updateState({ dataLoaded: false });
          processAndLoadData(result.data.data);
        }
      }
      
      updateState({ 
        hasUnsavedChanges: false,
        imageFile: null
      });
    } catch (error) {
      console.error("Operation failed:", error);
      toast({
        title: state.existingSubSectionId ? `Error updating ${sectionName}` : `Error creating ${sectionName}`,
        variant: "destructive",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      updateState({ isLoadingData: false });
    }
  };

  // Method to set the image file
  const setImageFile = (file: File | null) => {
    updateState({ imageFile: file });
  };

  return {
    state,
    defaultLangCode,
    handleSave,
    setImageFile,
    isLoadingSubsection,
    createSubSection,
  };
}