"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Button } from "@/src/components/ui/button"
import { Loader2, Save, Trash2, Plus } from "lucide-react"
import { toast } from "@/src/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ImageUpload } from "@/src/lib/ImageUploader"
import {  MultilingualSectionData, LanguageConfig } from "@/src/app/types/MultilingualSectionTypes"
import { SectionConfig } from "@/src/app/dashboard/services/components/SectionConfig"
import { useLanguages } from "@/src/hooks/webConfiguration/use-language"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import apiClient from '@/src/lib/api-client'
import { SubSection } from "@/src/app/types/SubSection"
import { ContentElement } from "@/src/app/types/ContentElement"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"


// Helper to check if a string is a valid MongoDB ObjectId
function isValidObjectId(id: unknown): boolean {
  return Boolean(id) && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

// Helper to extract ID from various response formats
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

// Helper function to get the first non-empty value from any language
function getFirstNonEmptyValue(sectionData: MultilingualSectionData | null, fieldId: string): string | null {
  if (!sectionData || !sectionData[fieldId]) return null;
  
  const fieldData = sectionData[fieldId];
  if (typeof fieldData === 'string') return fieldData;
  
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

interface StyledGenericSectionIntegrationProps {
  config: SectionConfig;
  onSectionChange?: (data: MultilingualSectionData) => void;
  ref?: any;
}

export const StyledGenericSectionIntegration = forwardRef<any, StyledGenericSectionIntegrationProps>(
  ({ config, onSectionChange }, ref) => {
    const [isLoading, setIsLoading] = useState(false);
    const [sectionData, setSectionData] = useState<MultilingualSectionData | null>(null);
    const [isDataProcessed, setIsDataProcessed] = useState(false);
    const [forceRefresh, setForceRefresh] = useState(0);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [imageUploadInProgress, setImageUploadInProgress] = useState(false);
    const [imageElementsMap, setImageElementsMap] = useState<Record<string, string>>({});
    
    // Get languages from API
    const { 
      useGetAll: useGetAllLanguages
    } = useLanguages();

    const { 
      data: languagesData, 
      isLoading: isLoadingLanguages,
    } = useGetAllLanguages();

    // Filter active languages from API data
    const activeLanguages = languagesData?.data?.filter((lang: any) => lang.isActive) || [];
    
    // Convert activeLanguages to an array of language codes and configs
    const languageCodes = activeLanguages.map((lang: { languageID: any }) => lang.languageID);
    const languageConfigs: LanguageConfig[] = activeLanguages.map((lang: any) => ({
      id: lang.languageID,
      label: lang.language
    }));

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
    
    // Get mutations
    const createSubSection = useCreateSubSection();
    const createContentElement = useCreateContentElement();

    // Function to handle image upload to Cloudinary
    const uploadImageToCloudinary = async (elementId: string, imageFile: File): Promise<string> => {
      setImageUploadInProgress(true);
      try {
        // Create a FormData object
        const formData = new FormData();
        formData.append('image', imageFile);
        
        // Send the image to the server
        const response = await apiClient.post(`/content-elements/${elementId}/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Image upload response:', response);
        
        // Return the image URL from the response
        if (response?.data?.data?.defaultContent) {
          return response.data.data.defaultContent;
        }
        
        throw new Error('Image URL not found in response');
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Image Upload Failed",
          description: "Failed to upload image to server. Please try again.",
          variant: "destructive"
        });
        throw error;
      } finally {
        setImageUploadInProgress(false);
      }
    };

    // Create a dynamic Zod schema based on the fields and languages
    const createSchema = () => {
      const schemaShape: Record<string, any> = {};
      
      // Add global fields (not language-specific, like images)
      const globalFields = config.fields.filter(field => field.type === 'image');
      globalFields.forEach(field => {
        if (field.required) {
          schemaShape[field.id] = z.string().min(1, { message: `${field.label} is required` });
        } else {
          schemaShape[field.id] = z.string().optional();
        }
      });
      
      // Add language-specific fields
      languageCodes.forEach((langCode: string) => {
        const langFields: Record<string, any> = {};
        
        // Add text/textarea fields for each language
        const textFields = config.fields.filter(field => field.type !== 'image');
        textFields.forEach(field => {
          if (field.required) {
            // Check if this is a benefits-like array field
            if (config.name === "Benefits") {
              langFields[field.id] = z.array(
                z.object({
                  icon: z.string().min(1, { message: "Icon is required" }),
                  title: z.string().min(1, { message: "Title is required" }),
                  description: z.string().min(1, { message: "Description is required" })
                })
              ).min(1, { message: "At least one benefit is required" });
            } else {
              langFields[field.id] = z.string().min(1, { message: `${field.label} is required` });
            }
          } else {
            langFields[field.id] = z.string().optional();
          }
        });
        
        schemaShape[langCode] = z.object(langFields);
      });
      
      return z.object(schemaShape);
    };
    
    // Create default values based on the fields and languages
    const createDefaultValues = () => {
      const defaultValues: Record<string, any> = {};
      
      // Add global fields
      const globalFields = config.fields.filter(field => field.type === 'image');
      globalFields.forEach(field => {
        defaultValues[field.id] = "";
      });
      
      // Add language-specific fields
      languageCodes.forEach((langCode: string) => {
        const langValues: Record<string, any> = {};
        
        // Add text/textarea fields for each language
        const textFields = config.fields.filter(field => field.type !== 'image');
        textFields.forEach(field => {
          if (config.name === "Benefits") {
            // Use default values from config if available, otherwise create one empty benefit
            langValues[field.id] = config.defaultValues?.benefits || [
              {
                icon: "Clock",
                title: "",
                description: ""
              }
            ];
          } else {
            langValues[field.id] = "";
          }
        });
        
        defaultValues[langCode] = langValues;
      });
      
      return defaultValues;
    };

    // Create the form
    const formSchema = createSchema();
    const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: createDefaultValues(),
    });
    
    // Handle image change from ImageUpload component
    const handleImageChange = async (fieldId: string, file: File) => {
      // Check if we have the element ID for this field
      const elementId = imageElementsMap[fieldId];
      if (!elementId) {
        // If no element ID, just update the form value with the file
        // It will be handled during form submission
        return;
      }
      
      try {
        // Upload the image to Cloudinary
        const imageUrl = await uploadImageToCloudinary(elementId, file);
        
        // Update the form value with the image URL
        form.setValue(fieldId, imageUrl);
        setHasUnsavedChanges(true);
        
        toast({
          title: "Image Uploaded",
          description: "Image has been uploaded successfully.",
        });
      } catch (error) {
        console.error('Error handling image change:', error);
      }
    };

    // Expose form data to parent component via ref
    useImperativeHandle(ref, () => ({
      getFormData: async () => {
        const isValid = await form.trigger();
        if (!isValid) {
          throw new Error(`${config.name} form has validation errors`);
        }
        
        // Convert form values to the MultilingualSectionData format
        const formValues = form.getValues();
        const formattedData = formatFormValuesToSectionData(formValues);
        
        // Save data to the API
        await handleSectionChange(formattedData);
        
        return formattedData;
      },
      form: form,
      hasUnsavedChanges,
      resetUnsavedChanges: () => setHasUnsavedChanges(false),
    }));

    // Format form values to the MultilingualSectionData structure
    const formatFormValuesToSectionData = (formValues: any): MultilingualSectionData => {
      const result: MultilingualSectionData = {
        id: sectionData?.id || ""
      };
      
      // Add global fields (not language-specific)
      const globalFields = config.fields.filter(field => field.type === 'image');
      globalFields.forEach(field => {
        result[field.id] = formValues[field.id] || "";
      });
      
      // Add language-specific fields structured by field ID
      const textFields = config.fields.filter(field => field.type !== 'image');
      textFields.forEach(field => {
        const fieldObj: Record<string, string> = {};
        
        languageCodes.forEach((langCode: string) => {
          fieldObj[langCode] = formValues[langCode]?.[field.id] || "";
        });
        
        result[field.id] = fieldObj;
      });
      
      return result;
    };

    // Format section data to form values format
    const formatSectionDataToFormValues = (data: MultilingualSectionData): any => {
      if (!data) return createDefaultValues();
      
      const result: Record<string, any> = {};
      
      // Process global fields (like images)
      const globalFields = config.fields.filter(field => field.type === 'image');
      globalFields.forEach(field => {
        result[field.id] = data[field.id] || "";
      });
      
      // Process language-specific fields
      languageCodes.forEach((langCode: string) => {
        const langValues: Record<string, string> = {};
        
        // Process text/textarea fields
        const textFields = config.fields.filter(field => field.type !== 'image');
        textFields.forEach(field => {
          const fieldData = data[field.id];
          if (typeof fieldData !== 'string' && fieldData) {
            const fieldRecord = fieldData as Record<string, string>;
            langValues[field.id] = fieldRecord[langCode] || "";
          } else {
            langValues[field.id] = "";
          }
        });
        
        result[langCode] = langValues;
      });
      
      return result;
    };

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
        
        // Create a map of field IDs to their corresponding content element IDs
        const newImageElementsMap: Record<string, string> = {};
        
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
          
          // Handle image fields differently (they're not language-specific)
          const field = config.fields.find(f => f.id === fieldId);
          if (field && field.type === 'image') {
            initialSectionData[fieldId] = element.defaultContent || "";
            // Store the element ID for image uploads
            newImageElementsMap[fieldId] = element._id;
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
        
        // Update the image elements map
        setImageElementsMap(newImageElementsMap);
        
        setSectionData(initialSectionData);
        setIsDataProcessed(true);
        
        // Reset the form with the new data
        const formValues = formatSectionDataToFormValues(initialSectionData);
        form.reset(formValues);
        
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
      forceRefresh,
      form
    ]);
    
    // Reset processed flag when dependencies change
    useEffect(() => {
      if (completeSectionData || languagesData) {
        setIsDataProcessed(false);
      }
    }, [completeSectionData, languagesData]);
    
    // Update parent component with form data on change
    useEffect(() => {
      const subscription = form.watch((value) => {
        setHasUnsavedChanges(true);
      });
      
      return () => subscription.unsubscribe();
    }, [form]);

    // Handle creating new section when there's no existing one
    const handleCreateNewSection = async (newSectionData: MultilingualSectionData) => {
      try {
        setIsLoading(true);
       
        // 1. Create SubSection first
        const createSubSectionData: Omit<SubSection, "_id"> = {
          name: config.subSectionName,
          description: config.description,
          slug: config.slug,
          isActive: true,
          order: subSectionsData?.data?.length || 0,
          parentSections: [] as string[],
          languages: [] as string[],
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
        const newImageElementsMap: Record<string, string> = {};
        
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
          
          // Find the field for this element
          let fieldId: string | null = null;
          for (const [key, value] of Object.entries(config.elementsMapping)) {
            if (value === elementName) {
              fieldId = key;
              break;
            }
          }
          
          if (!fieldId) continue;
          
          // Determine element type based on field type
          const field = config.fields.find(f => f.id === fieldId);
          let elementType: "link" | "text" | "video" | "image" | "paragraph" | "heading" | "list" | "custom" = "text"; // Default
          
          if (field) {
            if (field.type === "textarea") {
              elementType = "paragraph";
            } else if (field.type === "text" && (field.label.toLowerCase().includes("title") || 
                      field.label.toLowerCase().includes("heading"))) {
              elementType = "heading";
            } else if (field.type === "image") {
              elementType = "image";
            }
          }
          
          // Create content element with parent ID
          const contentElementData: Omit<ContentElement, "_id"> = {
            name: elementName,
            type: elementType,
            defaultContent: defaultContents[elementName] || `Default ${elementName}`,
            parent: subSectionId,
            isActive: true,
            order: i,
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
            
            // If this is an image field, store the element ID in the map
            if (field && field.type === 'image') {
              newImageElementsMap[fieldId] = elementId;
              
              // If we have an image URL, upload it
              const imageUrl = newSectionData[fieldId] as string;
              if (imageUrl && imageUrl.startsWith('data:')) {
                // This is a base64 encoded image, upload it
                try {
                  // Convert data URL to File
                  const dataUrlParts = imageUrl.split(',');
                  const mimeMatch = dataUrlParts[0].match(/:(.*?);/);
                  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
                  const byteString = atob(dataUrlParts[1]);
                  const arrayBuffer = new ArrayBuffer(byteString.length);
                  const intArray = new Uint8Array(arrayBuffer);
                  
                  for (let i = 0; i < byteString.length; i++) {
                    intArray[i] = byteString.charCodeAt(i);
                  }
                  
                  const blob = new Blob([arrayBuffer], { type: mime });
                  const fileName = `${fieldId}-${Date.now()}.${mime.split('/')[1]}`;
                  const file = new File([blob], fileName, { type: mime });
                  
                  // Upload to Cloudinary
                  const uploadedUrl = await uploadImageToCloudinary(elementId, file);
                  
                  // Update element with the uploaded URL
                  await apiClient.put(`/content-elements/${elementId}`, {
                    defaultContent: uploadedUrl
                  });
                  
                  console.log(`Updated image element ${elementId} with Cloudinary URL: ${uploadedUrl}`);
                } catch (uploadError) {
                  console.error(`Error uploading image for element ${elementId}:`, uploadError);
                }
              }
            }
            
            console.log(`Added element with ID ${elementId} to createdElements array`);
            createdElements.push(elementWithId);
          } catch (elementError) {
            console.error(`Error creating ${elementName} element:`, elementError);
            // Continue with other elements
          }
        }
        
        // Update the image elements map
        setImageElementsMap(newImageElementsMap);
        
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
            
            // Find field for this element
            let fieldId: string | null = null;
            for (const [key, value] of Object.entries(config.elementsMapping)) {
              if (value === element.name) {
                fieldId = key;
                break;
              }
            }
            
            if (!fieldId) continue;
            
            // Check if it's an image field (not language-specific)
            const field = config.fields.find(f => f.id === fieldId);
            if (field && field.type === 'image') {
              continue; // Skip translations for image fields
            }
            
            for (const lang of activeLanguages) {
              // Get the raw MongoDB ID for the language
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
                
                // Use direct API call
                const result = await apiClient.post('/translations', translationData);
                console.log("Translation created:", result);
              } catch (error) {
                console.error("Error creating translation:", error);
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
        
        toast({
          title: `${config.name} Created`,
          description: `${config.name} section has been created successfully.`,
        });
        
        // Reset the unsaved changes flag
        setHasUnsavedChanges(false);
        
        return createdSectionData;
      } catch (error) {
        console.error(`Error creating ${config.name} section:`, error);
        
        toast({
          title: "Error",
          description: `Failed to create ${config.name} section. Please try again.`,
          variant: "destructive",
        });
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    };
    
    // Handle section change (create or update)
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
          
          // Check if it's an image field (not language-specific)
          const field = config.fields.find(f => f.id === fieldId);
          if (field && field.type === 'image') {
            // Get the image URL from the form data
            const imageUrl = newSectionData[fieldId] as string;
            
            // If the image URL is different from what we have and it's a file/data URL
            if (imageUrl && imageUrl !== element.defaultContent && 
                ((typeof imageUrl === 'string' && imageUrl.startsWith('data:')) || 
                  (typeof imageUrl === 'object' && (imageUrl as any) instanceof File))) {
              try {
                let file: File;
                
                // Convert data URL to File if needed
                if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
                  const dataUrlParts = imageUrl.split(',');
                  const mimeMatch = dataUrlParts[0].match(/:(.*?);/);
                  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
                  const byteString = atob(dataUrlParts[1]);
                  const arrayBuffer = new ArrayBuffer(byteString.length);
                  const intArray = new Uint8Array(arrayBuffer);
                  
                  for (let i = 0; i < byteString.length; i++) {
                    intArray[i] = byteString.charCodeAt(i);
                  }
                  
                  const blob = new Blob([arrayBuffer], { type: mime });
                  const fileName = `${fieldId}-${Date.now()}.${mime.split('/')[1]}`;
                  file = new File([blob], fileName, { type: mime });
                } else if (typeof imageUrl === 'object' && (imageUrl as any) instanceof File) {
                  file = imageUrl as File;
                } else {
                  // If it's already a URL (not a new upload), just update the element
                  await apiClient.put(`/content-elements/${element._id}`, {
                    defaultContent: imageUrl,
                    isActive: true
                  });
                  console.log(`Updated image element ${element._id} with URL: ${imageUrl}`);
                  continue;
                }
                
                // Upload the file to Cloudinary
                const uploadedUrl = await uploadImageToCloudinary(element._id, file);
                
                // Update the element with the Cloudinary URL
                await apiClient.put(`/content-elements/${element._id}`, {
                  defaultContent: uploadedUrl,
                  isActive: true
                });
                
                console.log(`Updated image element ${element._id} with Cloudinary URL: ${uploadedUrl}`);
              } catch (error) {
                console.error(`Error updating image element:`, error);
              }
            } else if (imageUrl && imageUrl !== element.defaultContent) {
              // This is just a URL string (not a data URL or File), update directly
              try {
                await apiClient.put(`/content-elements/${element._id}`, {
                  defaultContent: imageUrl,
                  isActive: true
                });
                console.log(`Updated image element ${element._id} with URL: ${imageUrl}`);
              } catch (error) {
                console.error(`Error updating image element:`, error);
              }
            }
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
        
        toast({
          title: `${config.name} Updated`,
          description: `${config.name} section has been updated successfully.`,
        });
        
        // Reset the unsaved changes flag
        setHasUnsavedChanges(false);
        
        return newSectionData;
      } catch (error) {
        console.error(`Error updating ${config.name} section:`, error);
        
        toast({
          title: "Error",
          description: `Failed to update ${config.name} section. Please try again.`,
          variant: "destructive",
        });
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    };
    
    // Show loading state
    if (isLoadingLanguages || isLoadingSubSections || isLoadingSectionData || isLoading) {
      return (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading {config.name.toLowerCase()} section...</span>
        </div>
      );
    }
    
    // Check if active languages are available
    if (activeLanguages.length === 0) {
      return (
        <Card className="w-full shadow-md">
          <CardHeader>
            <CardTitle>{config.name} Section</CardTitle>
            <CardDescription>
              No active languages found. Please activate at least one language in settings.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    // Define onSubmit using form.handleSubmit()
const onSubmit = form.handleSubmit(async (formData) => {
    try {
      // Convert form values to the MultilingualSectionData format
      const formattedData = formatFormValuesToSectionData(formData);
      
      // Save data to the API
      await handleSectionChange(formattedData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Form Submission Error",
        description: "There was an error submitting the form. Please try again.",
        variant: "destructive"
      });
    }
  });
    
    return (
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}>
            {/* Global fields (like images) that apply to all languages */}
            {config.fields.filter(field => field.type === 'image').length > 0 && (
              <div className="mb-6">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>{config.name} Global Settings</CardTitle>
                    <CardDescription>
                      These settings apply to all languages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {config.fields
                      .filter(field => field.type === 'image')
                      .map(field => (
                        <FormField
                          key={field.id}
                          control={form.control}
                          name={field.id}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel>{field.label}</FormLabel>
                              <FormControl>
                                <ImageUpload 
                                  value={formField.value} 
                                  onChange={(value) => {
                                    // Handle different types of values
                                    if (typeof value === 'object' && (value as any) instanceof File) {
                                      // For File objects, first update the form value
                                      formField.onChange(value as File);
                                      
                                      // Then try to upload to Cloudinary if we have an element ID
                                      const elementId = imageElementsMap[field.id];
                                      if (elementId) {
                                        uploadImageToCloudinary(elementId, value)
                                          .then(imageUrl => {
                                            formField.onChange(imageUrl);
                                            toast({
                                              title: "Image Uploaded",
                                              description: "Image has been uploaded to Cloudinary successfully.",
                                            });
                                          })
                                          .catch(error => {
                                            console.error("Error uploading to Cloudinary:", error);
                                          });
                                      }
                                    } else {
                                      // For string values (URLs), just update the form value
                                      formField.onChange(value);
                                    }
                                    
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>{field.description}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Language-specific fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {languageCodes.map((langCode: string) => {
                const language = languageConfigs.find(l => l.id === langCode);
                
                return (
                  <Card key={langCode} className="w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
                          {langCode}
                        </span>
                        {config.name} Section
                      </CardTitle>
                      <CardDescription>
                        Manage {config.name.toLowerCase()} content for {language?.label || langCode.toUpperCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {config.fields
                        .filter(field => field.type !== 'image')
                        .map(field => {
                          const fieldPath = `${langCode}.${field.id}`;
                          
                          return (
                            <FormField
                              key={fieldPath}
                              control={form.control}
                              name={fieldPath as any}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>{field.label}</FormLabel>
                                  <FormControl>
                                    {config.name === "Benefits" ? (
                                      <div className="space-y-4">
                                        {formField.value?.map((benefit: any, index: number) => (
                                          <Card key={index} className="border border-muted">
                                            <CardHeader className="p-4 flex flex-row items-center justify-between">
                                              <CardTitle className="text-base">Benefit {index + 1}</CardTitle>
                                              <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => {
                                                  const newValue = [...formField.value];
                                                  newValue.splice(index, 1);
                                                  formField.onChange(newValue);
                                                  setHasUnsavedChanges(true);
                                                }}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-4">
                                              <FormField
                                                control={form.control}
                                                name={`${fieldPath}.${index}.icon`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Icon</FormLabel>
                                                    <FormControl>
                                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                          <SelectTrigger>
                                                            <SelectValue placeholder="Select an icon" />
                                                          </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                          {config.fields.find(f => f.id === 'icon')?.options?.map((icon: string) => (
                                                            <SelectItem key={icon} value={icon}>
                                                              {icon}
                                                            </SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                      </Select>
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={form.control}
                                                name={`${fieldPath}.${index}.title`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Title</FormLabel>
                                                    <FormControl>
                                                      <Input placeholder="Enter title" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={form.control}
                                                name={`${fieldPath}.${index}.description`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                      <Textarea placeholder="Enter description" className="min-h-[80px]" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </CardContent>
                                          </Card>
                                        ))}
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newValue = [...(formField.value || [])];
                                            newValue.push({
                                              icon: "Clock",
                                              title: "",
                                              description: ""
                                            });
                                            formField.onChange(newValue);
                                            setHasUnsavedChanges(true);
                                          }}
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          Add Benefit
                                        </Button>
                                      </div>
                                    ) : field.type === 'textarea' ? (
                                      <Textarea
                                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                        className="min-h-[100px]"
                                        {...formField}
                                      />
                                    ) : (
                                      <Input
                                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                        {...formField}
                                      />
                                    )}
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          );
                        })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Save button */}
            <div className="flex justify-end mt-6">
              <Button 
                type="submit" 
                disabled={!hasUnsavedChanges || isLoading || imageUploadInProgress} 
                className="flex items-center"
              >
                {isLoading || imageUploadInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {imageUploadInProgress ? "Uploading image..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save {config.name} Content
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }
);

StyledGenericSectionIntegration.displayName = "StyledGenericSectionIntegration";

export default StyledGenericSectionIntegration;