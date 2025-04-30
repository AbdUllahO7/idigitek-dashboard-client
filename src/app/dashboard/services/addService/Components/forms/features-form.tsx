"use client"

import type React from "react"

import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/src/components/ui/button"
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
import { Plus, Trash2, X, Save, AlertTriangle, Upload, ImageIcon } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { Label } from "@/src/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import apiClient from "@/src/lib/api-client"
import type {  Language, Feature } from "@/src/api/types"
import { useToast } from "@/src/hooks/use-toast"

interface FeaturesFormProps {
  languageIds: readonly string[];
  activeLanguages: Language[];
  onDataChange?: (data: any) => void;
  slug?: string; // Optional slug to load existing data
  ParentSectionId: string; // Optional parent section ID for creating new sections
  initialData?: any; // Added missing initialData prop
}

// Define interfaces to improve type safety

// Create a dynamic schema based on available languages
const createFeaturesSchema = (languageIds: string[], activeLanguages: Language[]) => {
  const schemaShape: Record<string, any> = {}

  const languageCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  languageIds.forEach((langId) => {
    const langCode = languageCodeMap[langId] || langId
    schemaShape[langCode] = z
      .array(
        z.object({
          id: z.string().min(1, { message: "ID is required" }),
          title: z.string().min(1, { message: "Title is required" }),
          content: z.object({
            heading: z.string().min(1, { message: "Heading is required" }),
            description: z.string().min(1, { message: "Description is required" }),
            features: z
              .array(z.string().min(1, { message: "Feature cannot be empty" }))
              .min(1, { message: "At least one feature is required" }),
            image: z.string().min(1, { message: "Image is required" }),
          }),
        }),
      )
      .min(1, { message: "At least one feature is required" })
  })

  return z.object(schemaShape)
}

// Helper type to infer the schema type
type FeaturesSchemaType = ReturnType<typeof createFeaturesSchema>

// Create default values for the form
const createDefaultValues = (languageIds: string[], activeLanguages: Language[]) => {
  const defaultValues: Record<string, Feature[]> = {}

  const languageCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  languageIds.forEach((langId) => {
    const langCode = languageCodeMap[langId] || langId
    defaultValues[langCode] = [
      {
        id: "feature-1",
        title: "",
        content: {
          heading: "",
          description: "",
          features: [""],
          image: "",
        },
      },
    ]
  })

  return defaultValues
}


const FeaturesForm = forwardRef<any, FeaturesFormProps>(({ languageIds, activeLanguages, onDataChange, slug , ParentSectionId }, ref) => {
  const featuresSchema = createFeaturesSchema(languageIds as string[], activeLanguages)
  const [isLoadingData, setIsLoadingData] = useState(!slug)
  const [dataLoaded, setDataLoaded] = useState(!slug)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [featureCountMismatch, setFeatureCountMismatch] = useState(false)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [featureImages, setFeatureImages] = useState<Record<number, File | null>>({})
  const [existingSubSectionId, setExistingSubSectionId] = useState<string | null>(null)
  const [contentElements, setContentElements] = useState<any[]>([])
  const { toast } = useToast()

  // Get default language code for form values
  const defaultLangCode = activeLanguages.length > 0 ? activeLanguages[0].languageID : "en"

  const form = useForm<z.infer<FeaturesSchemaType>>({
    resolver: zodResolver(featuresSchema),
    defaultValues: createDefaultValues(languageIds as string[], activeLanguages),
  })

  // Expose form data to parent component
  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      const isValid = await form.trigger()
      if (!isValid) {
        throw new Error("Features form has validation errors")
      }
      return form.getValues()
    },
    getFeatureImages: () => featureImages,
    form: form,
    hasUnsavedChanges,
    resetUnsavedChanges: () => setHasUnsavedChanges(false),
    existingSubSectionId,
    contentElements,
  }))

  const onDataChangeRef = useRef(onDataChange)
  useEffect(() => {
    onDataChangeRef.current = onDataChange
  }, [onDataChange])

  // API hooks
  const { useCreate: useCreateSubSection, useGetCompleteBySlug } = useSubSections()
  const {
    useCreate: useCreateContentElement,
    useUpdate: useUpdateContentElement,
    useDelete: useDeleteContentElement,
  } = useContentElements()
  const { useBulkUpsert: useBulkUpsertTranslations } = useContentTranslations()

  const createSubSection = useCreateSubSection()
  const createContentElement = useCreateContentElement()
  const updateContentElement = useUpdateContentElement()
  const deleteContentElement = useDeleteContentElement()
  const bulkUpsertTranslations = useBulkUpsertTranslations()

  // Query for complete subsection data by slug if provided
  const {
    data: completeSubsectionData,
    isLoading: isLoadingSubsection,
    refetch,
  } = useGetCompleteBySlug(slug || "", false)

  // Check if all languages have the same number of features
  const validateFeatureCounts = () => {
    const values = form.getValues()
    const counts = Object.values(values).map((features) => features?.length || 0)

    // Check if all counts are the same
    const allEqual = counts.every((count) => count === counts[0])
    setFeatureCountMismatch(!allEqual)

    return allEqual
  }

  // Function to process and load data into the form

  const processAndLoadData = async (subsectionData: any) => {
    if (!subsectionData) return;
  
    try {
      console.log("Processing features subsection data:", subsectionData);
      setExistingSubSectionId(subsectionData._id);
  
      // Check if we have elements directly in the subsection data (API response structure)
      const elements = subsectionData.elements || subsectionData.contentElements || [];
      
      if (elements.length > 0) {
        // Store the content elements for later use
        setContentElements(elements);
  
        // Create a mapping of languages for easier access
        const langIdToCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
          acc[lang._id] = lang.languageID;
          return acc;
        }, {});
  
        // Group content elements by feature
        const featureGroups: Record<string, any[]> = {};
  
        elements.forEach((element: any) => {
          // Extract feature ID from element name (e.g., "Feature 1 - Heading" -> "1")
          const featureIdMatch = element.name.match(/Feature (\d+)/i);
          if (featureIdMatch) {
            const featureId = featureIdMatch[1];
            if (!featureGroups[featureId]) {
              featureGroups[featureId] = [];
            }
            featureGroups[featureId].push(element);
          }
        });
  
        console.log("Feature groups:", featureGroups);
  
        // Initialize form values for each language
        const languageValues: Record<string, Feature[]> = {};
  
        // Initialize all languages with empty feature arrays
        languageIds.forEach((langId) => {
          const langCode = langIdToCodeMap[langId] || langId;
          languageValues[langCode] = [];
        });
  
        // Process each feature group
        Object.entries(featureGroups).forEach(([featureId, elements]) => {
          // Find elements for this feature
          const headingElement = elements.find((el) => el.name.includes("Heading"));
          const descriptionElement = elements.find((el) => el.name.includes("Description"));
          const imageElement = elements.find((el) => el.name.includes("Image") && el.type === "image");
          const featureListElements = elements.filter((el) => el.name.includes("Feature Item"));
  
          // For each language, create a feature object
          languageIds.forEach((langId) => {
            const langCode = langIdToCodeMap[langId] || langId;
  
            // Helper function to get translation content for an element
            const getTranslationContent = (element: any, defaultValue = "") => {
              if (!element) return defaultValue;
  
              // First check for a translation in this language
              const translation = element.translations?.find((t: any) => {
                // Handle both nested and direct language references
                if (t.language && typeof t.language === 'object' && t.language._id) {
                  return t.language._id === langId;
                } else {
                  return t.language === langId;
                }
              });
  
              if (translation?.content) return translation.content;
  
              // Fall back to default content
              return element.defaultContent || defaultValue;
            };
  
            // Get feature list items
            const featureItems = featureListElements.map((el) => getTranslationContent(el, "")).filter(Boolean);
            
            // If no items were found, add an empty one
            if (featureItems.length === 0) {
              featureItems.push("");
            }
  
            // Create the feature object with a stable ID based on the feature number
            const feature: Feature = {
              id: `feature-${featureId}`,
              title: getTranslationContent(headingElement, ""),
              content: {
                heading: getTranslationContent(headingElement, ""),
                description: getTranslationContent(descriptionElement, ""),
                features: featureItems,
                image: imageElement?.imageUrl || "",
              },
            };
  
            // Add to language values
            languageValues[langCode].push(feature);
          });
        });
  
        console.log("Form values after processing:", languageValues);
  
        // Set all values in form
        Object.entries(languageValues).forEach(([langCode, features]) => {
          if (features.length > 0) {
            form.setValue(langCode as any, features as any, { shouldDirty: false });
          } else {
            // Ensure at least one empty feature if none were found
            form.setValue(langCode as any, [
              {
                id: `feature-1`,
                title: "",
                content: {
                  heading: "",
                  description: "",
                  features: [""],
                  image: "",
                },
              }
            ] as any, { shouldDirty: false });
          }
        });
      }
  
      // Reset form state to match the loaded values
      form.reset(form.getValues(), {
        keepValues: true,
        keepDirty: false,
      });
  
      setDataLoaded(true);
      setHasUnsavedChanges(false);
      validateFeatureCounts();
    } catch (error) {
      console.error("Error processing features section data:", error);
      toast({
        title: "Error loading features section data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Effect to populate form with existing data from complete subsection - only run once when data is available
  useEffect(() => {
    // Skip this effect entirely if no slug is provided
    if (!slug) {
      return
    }

    if (dataLoaded || isLoadingSubsection || !completeSubsectionData?.data) {
      return
    }

    setIsLoadingData(true)
    processAndLoadData(completeSubsectionData.data)
  }, [completeSubsectionData, isLoadingSubsection, dataLoaded, form, activeLanguages, languageIds, slug])

  // Update parent component with form data on change
  useEffect(() => {
    if (isLoadingData || !dataLoaded) return

    const subscription = form.watch((value) => {
      setHasUnsavedChanges(true)
      validateFeatureCounts()
      if (onDataChangeRef.current) {
        onDataChangeRef.current(value)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, isLoadingData, dataLoaded])

  // Handle image upload for a specific feature index
  const handleImageUpload = (featureIndex: number, file: File) => {
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    // Read file as data URL for preview
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string

        // Update the image for this feature across all languages
        const formValues = form.getValues()

        Object.keys(formValues).forEach((langCode) => {
          if (formValues[langCode] && formValues[langCode][featureIndex]) {
            form.setValue(`${langCode}.${featureIndex}.content.image` as any, imageData)
          }
        })

        // Store the file in our local state
        setFeatureImages((prev) => ({ ...prev, [featureIndex]: file }))

        toast({
          title: "Image uploaded",
          description: "Image has been uploaded successfully for all languages",
        })
      }
    }

    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was an error reading the selected file",
        variant: "destructive",
      })
    }

    reader.readAsDataURL(file)
  }

  // Handle image removal for a specific feature index
  const handleImageRemove = (featureIndex: number) => {
    // Remove the image for this feature across all languages
    const formValues = form.getValues()

    Object.keys(formValues).forEach((langCode) => {
      if (formValues[langCode] && formValues[langCode][featureIndex]) {
        form.setValue(`${langCode}.${featureIndex}.content.image` as any, "")
      }
    })

    // Remove from our local state
    const newFeatureImages = { ...featureImages }
    delete newFeatureImages[featureIndex]
    setFeatureImages(newFeatureImages)

    toast({
      title: "Image removed",
      description: "Image has been removed from all languages",
    })
  }




  const handleSave = async () => {
    const isValid = await form.trigger();
    const hasEqualFeatureCounts = validateFeatureCounts();
  
    if (!hasEqualFeatureCounts) {
      setIsValidationDialogOpen(true);
      return;
    }
  
    if (!isValid) return;
  
    // Show a toast to indicate saving has started
    toast({
      title: "Saving changes...",
      description: "Your feature content is being saved. Please wait.",
    });
  
    setIsLoadingData(true);
    try {
      // Get current form values
      const allFormValues = form.getValues();
  
      let sectionId = existingSubSectionId;
  
      // Create section if needed
      if (!existingSubSectionId) {
        // Create new subsection logic...
        const subsectionData = {
          name: "Features Section",
          slug: slug || `features-section-${Date.now()}`,
          description: "Features section for the website",
          isActive: true,
          order: 0,
          sectionItem: ParentSectionId,
          languages: languageIds as string[],
        };
  
        toast({
          title: "Creating new features section...",
          description: "Setting up your new features content.",
        });
  
        const newSubSection = await createSubSection.mutateAsync(subsectionData);
        sectionId = newSubSection.data._id;
        setExistingSubSectionId(sectionId);
      }
  
      if (!sectionId) {
        throw new Error("Failed to create or retrieve subsection ID");
      }
  
      // Get language mappings
      const langIdToCodeMap = activeLanguages.reduce((acc, lang) => {
        acc[lang._id] = lang.languageID;
        return acc;
      }, {});
  
      const langCodeToIdMap = activeLanguages.reduce((acc, lang) => {
        acc[lang.languageID] = lang._id;
        return acc;
      }, {});
  
      // Get the first language code for reference
      const firstLangCode = Object.keys(allFormValues)[0];
      const features = allFormValues[firstLangCode];
  
      if (!Array.isArray(features)) {
        throw new Error("Invalid features data");
      }
  
      // Find the highest feature number in existing content elements
      let highestFeatureNum = 0;
      contentElements.forEach(element => {
        const featureMatch = element.name.match(/Feature (\d+)/i);
        if (featureMatch) {
          const num = parseInt(featureMatch[1], 10);
          if (num > highestFeatureNum) {
            highestFeatureNum = num;
          }
        }
      });
  
      // Process each feature with progress feedback
      for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
        // Show progress toast
        toast({
          title: `Processing feature ${featureIndex + 1} of ${features.length}`,
          description: "Please wait while we save your content.",
        });
        
        const featureNum = featureIndex + 1;
        
        // Check if this feature already exists
        const headingElementName = `Feature ${featureNum} - Heading`;
        const existingHeading = contentElements.find(e => e.name === headingElementName);
        
        if (existingHeading) {
          // This is an existing feature - update it
          console.log(`Updating existing feature ${featureNum}`);
          
          // Create a collection of translations
          const translations = [];
          
          // Process each language
          Object.entries(allFormValues).forEach(([langCode, langFeatures]) => {
            const langId = langCodeToIdMap[langCode];
            if (!langId || !Array.isArray(langFeatures) || !langFeatures[featureIndex]) return;
            
            const feature = langFeatures[featureIndex];
            
            // Find elements for this feature
            const headingElement = contentElements.find(e => e.name === `Feature ${featureNum} - Heading`);
            const descriptionElement = contentElements.find(e => e.name === `Feature ${featureNum} - Description`);
            
            // Add translations for main elements
            if (headingElement) {
              translations.push({
                content: feature.content.heading,
                language: langId,
                contentElement: headingElement._id,
                isActive: true,
              });
            }
            
            if (descriptionElement) {
              translations.push({
                content: feature.content.description,
                language: langId,
                contentElement: descriptionElement._id,
                isActive: true,
              });
            }
            
            
            // Process feature items
            const featureItems = feature.content.features || [];
            featureItems.forEach((item, itemIndex) => {
              const itemName = `Feature ${featureNum} - Feature Item ${itemIndex + 1}`;
              const itemElement = contentElements.find(e => e.name === itemName);
              
              if (itemElement) {
                // Update existing item
                translations.push({
                  content: item,
                  language: langId,
                  contentElement: itemElement._id,
                  isActive: true,
                });
              } else {
                // Create new item element if it doesn't exist
                console.log(`Creating new feature item: ${itemName}`);
                createContentElement.mutateAsync({
                  name: itemName,
                  type: "text",
                  parent: sectionId,
                  isActive: true,
                  order: itemIndex,
                  defaultContent: item,
                }).then(newElement => {
                  // Add translation for new element
                  const newTranslation = {
                    content: item,
                    language: langId,
                    contentElement: newElement.data._id,
                    isActive: true,
                  };
                  
                  // Process this translation individually to avoid race conditions
                  bulkUpsertTranslations.mutateAsync([newTranslation]).catch(err => {
                    console.error(`Error creating translation for new item ${itemName}:`, err);
                  });
                });
              }
            });
          });
          
          // Process all collected translations
          if (translations.length > 0) {
            try {
              toast({
                title: `Updating translations for feature ${featureNum}`,
                description: `Processing ${translations.length} translations...`,
              });
              
              await bulkUpsertTranslations.mutateAsync(translations);
            } catch (error) {
              console.error(`Error updating translations for feature ${featureNum}:`, error);
              throw error;
            }
          }
          
          // Handle image upload if needed
          const imageFile = featureImages[featureIndex];
          if (imageFile) {
            toast({
              title: `Uploading image for feature ${featureNum}`,
              description: "Uploading image file...",
            });
            
            const imageElement = contentElements.find(e => 
              e.type === "image" && e.name === `Feature ${featureNum} - Image`
            );
            
            if (imageElement) {
              const formData = new FormData();
              formData.append("image", imageFile);
              await apiClient.post(`/content-elements/${imageElement._id}/image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            }
          }
        } else {
          // This is a new feature - create it
          toast({
            title: `Creating new feature ${featureNum}`,
            description: "Setting up new feature content...",
          });
          
          console.log(`Creating new feature ${featureNum}`);
          
          // Get the actual feature number to use (avoid duplicates)
          const actualFeatureNum = highestFeatureNum + (featureIndex - featureIndex + 1);
          highestFeatureNum = actualFeatureNum;
          
          const elementTypes = [
            { type: "image", key: "image", name: `Feature ${actualFeatureNum} - Image` },
            { type: "text", key: "heading", name: `Feature ${actualFeatureNum} - Heading` },
            { type: "text", key: "description", name: `Feature ${actualFeatureNum} - Description` },
          ];
          
          // Create elements one by one
          const createdElements = [];
          for (const [index, el] of elementTypes.entries()) {
            let defaultContent = "";
            
            if (el.type === "image") {
              defaultContent = "image-placeholder";
            } else if (el.type === "text" && allFormValues[firstLangCode]) {
              const feature = allFormValues[firstLangCode][featureIndex];
              if (feature?.content && el.key in feature.content) {
                defaultContent = feature.content[el.key];
              }
            }
            
            try {
              const elementData = {
                name: el.name,
                type: el.type,
                parent: sectionId,
                isActive: true,
                order: index,
                defaultContent: defaultContent,
              };
              
              const newElement = await createContentElement.mutateAsync(elementData);
              createdElements.push({ ...newElement.data, key: el.key });
            } catch (error) {
              console.error(`Error creating element ${el.name}:`, error);
              throw error;
            }
          }
          
          // Create feature items
          toast({
            title: `Creating feature items for feature ${featureNum}`,
            description: "Setting up feature details...",
          });
          
          const featureItemElements = [];
          const featureItems = features[featureIndex].content.features || [];
          
          for (let itemIndex = 0; itemIndex < featureItems.length; itemIndex++) {
            const itemName = `Feature ${actualFeatureNum} - Feature Item ${itemIndex + 1}`;
            const defaultContent = featureItems[itemIndex] || "";
            
            try {
              const elementData = {
                name: itemName,
                type: "text",
                parent: sectionId,
                isActive: true,
                order: itemIndex,
                defaultContent: defaultContent,
              };
              
              const newElement = await createContentElement.mutateAsync(elementData);
              featureItemElements.push({ ...newElement.data, itemIndex });
            } catch (error) {
              console.error(`Error creating feature item ${itemName}:`, error);
              throw error;
            }
          }
          
          // Upload image if needed
          const imageElement = createdElements.find(e => e.key === "image");
          const imageFile = featureImages[featureIndex];
          
          if (imageElement && imageFile) {
            toast({
              title: `Uploading image for new feature ${featureNum}`,
              description: "Uploading image file...",
            });
            
            try {
              const formData = new FormData();
              formData.append("image", imageFile);
              await apiClient.post(`/content-elements/${imageElement._id}/image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            } catch (error) {
              console.error(`Error uploading image for feature ${actualFeatureNum}:`, error);
            }
          }
          
          // Create translations
          const translations = [];
          
          // For each language, create translations
          for (const [langCode, langFeatures] of Object.entries(allFormValues)) {
            const langId = langCodeToIdMap[langCode];
            if (!langId || !Array.isArray(langFeatures) || !langFeatures[featureIndex]) continue;
            
            const feature = langFeatures[featureIndex];
            
            // Add translations for main elements
            for (const element of createdElements) {
              if (element.key === "image") continue;
              
              if (feature.content && element.key in feature.content) {
                translations.push({
                  content: feature.content[element.key],
                  language: langId,
                  contentElement: element._id,
                  isActive: true,
                });
              }
            }
            
            // Add translations for feature items
            const items = feature.content?.features || [];
            for (let i = 0; i < items.length && i < featureItemElements.length; i++) {
              translations.push({
                content: items[i],
                language: langId,
                contentElement: featureItemElements[i]._id,
                isActive: true,
              });
            }
          }
          
          // Process translations for this feature (do it in smaller batches)
          if (translations.length > 0) {
            toast({
              title: `Creating translations for new feature ${featureNum}`,
              description: `Processing ${translations.length} translations...`,
            });
            
            // Process in batches of 20 to avoid overwhelming the server
            const batchSize = 20;
            for (let i = 0; i < translations.length; i += batchSize) {
              const batch = translations.slice(i, i + batchSize);
              try {
                await bulkUpsertTranslations.mutateAsync(batch);
              } catch (error) {
                console.error(`Error creating translations for feature ${actualFeatureNum} (batch ${i/batchSize}):`, error);
                throw error;
              }
            }
          }
        }
      }
      
      // Final success message
      toast({
        title: existingSubSectionId
          ? "Features section updated successfully! ✅"
          : "Features section created successfully! ✅",
        description: "All changes have been saved.",
        duration: 5000, // Show for longer
      });
      
      // Refresh data
      if (slug) {
        toast({
          title: "Refreshing content",
          description: "Loading the updated content...",
        });
        
        const result = await refetch();
        if (result.data?.data) {
          setDataLoaded(false);
          await processAndLoadData(result.data.data);
        }
      }
      
      setHasUnsavedChanges(false);
      setFeatureImages({});
    } catch (error) {
      console.error("Operation failed:", error);
      toast({
        title: existingSubSectionId ? "Error updating features section ❌" : "Error creating features section ❌",
        variant: "destructive",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000, // Show for longer
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Function to add a new feature item
  const addFeatureItem = (langCode: string, featureIndex: number) => {
    // Add the new feature item to all languages to maintain consistency
    Object.keys(form.getValues()).forEach((lang) => {
      const features = [...(form.getValues()[lang] || [])]
      if (features[featureIndex]) {
        const feature = { ...features[featureIndex] }
        const featureItems = [...(feature.content.features || [])]
        featureItems.push("")

        feature.content = {
          ...feature.content,
          features: featureItems,
        }

        features[featureIndex] = feature
        form.setValue(lang as any, features)
      }
    })
  }

  // Function to remove a feature item
  const removeFeatureItem = (langCode: string, featureIndex: number, itemIndex: number) => {
    // Check if we have more than one feature item
    const currentFeatures = form.getValues()[langCode] || []
    const currentFeature = currentFeatures[featureIndex]

    if (!currentFeature || currentFeature.content.features.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one feature item",
        variant: "destructive",
      })
      return
    }

    // If we have existing content elements and this is an existing feature item, delete the element
    if (existingSubSectionId && contentElements.length > 0) {
      const featureNum = featureIndex + 1
      const itemNum = itemIndex + 1
      const featureItemElement = contentElements.find(
        (element) => element.name === `Feature ${featureNum} - Feature Item ${itemNum}`,
      )

      if (featureItemElement) {
        deleteContentElement.mutate(featureItemElement._id, {
          onSuccess: () => {
            console.log(`Deleted feature item: ${featureItemElement.name}`)
          },
          onError: (error) => {
            console.error(`Failed to delete feature item ${featureItemElement.name}:`, error)
            toast({
              title: "Error deleting feature item",
              description: "The feature item could not be deleted. Please try again.",
              variant: "destructive",
            })
          },
        })
      }
    }

    // Remove the feature item from all languages to maintain consistency
    Object.keys(form.getValues()).forEach((lang) => {
      const features = [...(form.getValues()[lang] || [])]
      if (features[featureIndex]) {
        const feature = { ...features[featureIndex] }
        const featureItems = [...(feature.content.features || [])]

        featureItems.splice(itemIndex, 1)

        feature.content = {
          ...feature.content,
          features: featureItems,
        }

        features[featureIndex] = feature
        form.setValue(lang as any, features)
      }
    })
  }

  // Function to get feature counts by language
  const getFeatureCountsByLanguage = () => {
    const values = form.getValues()
    return Object.entries(values).map(([langCode, features]) => ({
      language: langCode,
      count: Array.isArray(features) ? features.length : 0,
    }))
  }

  // Simple Image Uploader Component
  const SimpleImageUploader = ({ featureIndex }: { featureIndex: number }) => {
    // Get image value from first language
    const firstLangCode = Object.keys(form.getValues())[0]
    const features = form.getValues()[firstLangCode] || []
    const imageValue = features[featureIndex]?.content?.image || ""

    const inputId = `file-upload-feature-${featureIndex}`

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleImageUpload(featureIndex, file)
      }
    }

    return (
      <Card className="overflow-hidden">
        <div className="p-4">
          {imageValue ? (
            <div className="relative">
              <img
                src={imageValue || "/placeholder.svg"}
                alt="Image preview"
                className="w-full h-48 object-cover rounded-md"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={() => handleImageRemove(featureIndex)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => document.getElementById(inputId)?.click()}
                >
                  Change Image
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById(inputId)?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to upload image</p>
              <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max. 2MB)</p>
            </div>
          )}
          <input id={inputId} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </Card>
    )
  }

  // Get language codes for display
  const languageCodes = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  const addFeature = (langCode: string) => {
    // Generate a unique ID for the new feature
    const newFeatureId = `feature-${Date.now()}`;
    
    const newFeature: Feature = {
      id: newFeatureId,
      title: "",
      content: {
        heading: "",
        description: "",
        features: [""],
        image: "",
      },
    };

    // Add the new feature to all languages to maintain consistency
    Object.keys(form.getValues()).forEach((lang) => {
      const currentFeatures = form.getValues()[lang] || [];
      const updatedFeatures = [...currentFeatures, newFeature];
      
      // Use form.setValue with shouldDirty: true to ensure React Hook Form knows the form is dirty
      form.setValue(lang as any, updatedFeatures, { 
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true 
      });
    });
    
    // Force validation to ensure feature counts are consistent
    validateFeatureCounts();
    
    // Mark form as having unsaved changes
    setHasUnsavedChanges(true);
    
    // Show a loading indicator for better user feedback
    toast({
      title: "Feature added",
      description: "A new feature has been added. Please fill in the details and save your changes.",
    });
  };

  // Function to remove a feature
  const removeFeature = (langCode: string, featureIndex: number) => {
    // Check if we have more than one feature
    const currentFeatures = form.getValues()[langCode] || []
    if (currentFeatures.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one feature",
        variant: "destructive",
      })
      return
    }

    // If we have existing content elements and this is an existing feature, delete the elements
    if (existingSubSectionId && contentElements.length > 0) {
      const featureNum = featureIndex + 1
      const featureElements = contentElements.filter((element) => element.name.includes(`Feature ${featureNum}`))

      // Delete each element associated with this feature
      featureElements.forEach((element) => {
        deleteContentElement.mutate(element._id, {
          onSuccess: () => {
            console.log(`Deleted element: ${element.name}`)
          },
          onError: (error) => {
            console.error(`Failed to delete element ${element.name}:`, error)
            toast({
              title: "Error deleting feature",
              description: "Some elements could not be deleted. Please try again.",
              variant: "destructive",
            })
          },
        })
      })
    }

    // Remove the feature from all languages to maintain consistency
    Object.keys(form.getValues()).forEach((lang) => {
      const features = [...(form.getValues()[lang] || [])]
      features.splice(featureIndex, 1)
      form.setValue(lang as any, features)
    })

    // Update feature images
    const newFeatureImages = { ...featureImages }
    delete newFeatureImages[featureIndex]

    // Reindex the feature images for higher indices
    for (let i = featureIndex + 1; i < Object.keys(newFeatureImages).length; i++) {
      if (newFeatureImages[i]) {
        newFeatureImages[i - 1] = newFeatureImages[i]
        delete newFeatureImages[i]
      }
    }

    setFeatureImages(newFeatureImages)
  }

  return (
    <div className="space-y-6">
      {slug && (isLoadingData || isLoadingSubsection) && !dataLoaded ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading features section data...</p>
        </div>
      ) : (
        <Form {...form}>
          <div className="grid grid-cols-1 gap-6">
            {languageIds.map((langId) => {
              const langCode = languageCodes[langId] || langId
              return (
                <Card key={langId} className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
                        {langCode}
                      </span>
                      Features Section
                    </CardTitle>
                    <CardDescription>Manage features content for {langCode.toUpperCase()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Accordion type="single" collapsible className="w-full">
                      {form.watch(`${langCode}` as any)?.map((feature: Feature, index: number) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <div className="flex items-center justify-between">
                            <AccordionTrigger className="flex-1">
                              {feature.title || `Feature ${index + 1}`}
                            </AccordionTrigger>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="mr-4"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFeature(langCode, index)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <AccordionContent>
                            <Card className="border border-muted">
                              <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`${langCode}.${index}.id` as any}
                                    
                                    render={({ field }) => (
                                      <FormItem className="hidden">
                                        <FormLabel>ID</FormLabel>
                                        <FormControl>
                                          <Input placeholder="feature-id" {...field} />
                                        </FormControl>
                                        <FormDescription>A unique identifier for this feature</FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`${langCode}.${index}.title` as any}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Feature title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                   <FormField
                                  control={form.control}
                                  name={`${langCode}.${index}.content.heading` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Heading</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Feature heading" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                </div>

                               
                                <FormField
                                  control={form.control}
                                  name={`${langCode}.${index}.content.description` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Feature description"
                                          className="min-h-[100px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <Label>Feature List</Label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addFeatureItem(langCode, index)}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add Feature
                                    </Button>
                                  </div>

                                  {feature.content.features.map((featureItem: string, featureItemIndex: number) => (
                                    <FormField
                                      key={featureItemIndex}
                                      control={form.control}
                                      name={`${langCode}.${index}.content.features.${featureItemIndex}` as any}
                                      render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                          <div className="flex-1">
                                            <FormControl>
                                              <Input placeholder={`Feature ${featureItemIndex + 1}`} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFeatureItem(langCode, index, featureItemIndex)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </FormItem>
                                      )}
                                    />
                                  ))}
                                </div>

                                {/* Only show the image uploader in the first language */}
                                {langId === languageIds[0] && (
                                  <div className="grid grid-cols-1 gap-4">
                                    <div>
                                      <Label className="flex items-center gap-2 mb-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Feature Image
                                        <span className="text-xs text-muted-foreground">
                                          (applies to all languages)
                                        </span>
                                      </Label>
                                      <SimpleImageUploader featureIndex={index} />
                                    </div>
                                  </div>
                                )}

                              </CardContent>
                            </Card>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    <Button type="button" variant="outline" size="sm" onClick={() => addFeature(langCode)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Feature
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </Form>
      )}
      <div className="flex justify-end mt-6">
        {featureCountMismatch && (
          <div className="flex items-center text-amber-500 mr-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm">Each language must have the same number of features</span>
          </div>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoadingData || featureCountMismatch}
          className="flex items-center"
        >
          <Save className="mr-2 h-4 w-4" />
          {createSubSection.isPending
            ? "Saving..."
            : existingSubSectionId
              ? "Update Features Content"
              : "Save Features Content"}
        </Button>
      </div>

      {/* Validation Dialog */}
      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Count Mismatch</DialogTitle>
            <DialogDescription>
              <div className="mt-4 mb-4">
                Each language must have the same number of features before saving. Please add or remove features to
                ensure all languages have the same count:
              </div>
              <ul className="list-disc pl-6 space-y-1">
                {getFeatureCountsByLanguage().map(({ language, count }) => (
                  <li key={language}>
                    <span className="font-semibold uppercase">{language}</span>: {count} features
                  </li>
                ))}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsValidationDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})

FeaturesForm.displayName = "FeaturesForm"

export default FeaturesForm
