"use client"

import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { ImageUploader } from "@/src/components/image-uploader"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Button } from "@/src/components/ui/button"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import apiClient from "@/src/lib/api-client"
import { ContentTranslation, SubSection, Language } from "@/src/api/types"
import { useToast } from "@/src/hooks/use-toast"
import { HeroFormProps } from "@/src/api/types/service/serviceSections.types"



const createHeroSchema = (languageIds: string[], activeLanguages: Language[]) => {
  const schemaShape: Record<string, any> = {
    backgroundImage: z.string().optional(), // Made optional for better UX
  }

  const languageCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  languageIds.forEach((langId) => {
    const langCode = languageCodeMap[langId] || langId
    schemaShape[langCode] = z.object({
      title: z.string().min(1, { message: "Title is required" }),
      description: z.string().min(1, { message: "Description is required" }),
      backLinkText: z.string().min(1, { message: "Back link text is required" }),
    })
  })

  return z.object(schemaShape)
}

type SchemaType = ReturnType<typeof createHeroSchema>

const createDefaultValues = (languageIds: string[], activeLanguages: Language[]) => {
  const defaultValues: Record<string, any> = {
    backgroundImage: "",
  }

  const languageCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  languageIds.forEach((langId) => {
    const langCode = languageCodeMap[langId] || langId
    defaultValues[langCode] = {
      title: "",
      description: "",
      backLinkText: "", // Default value for better UX
    }
  })

  return defaultValues
}

const HeroForm = forwardRef<any, HeroFormProps>(
  ({ languageIds, activeLanguages, onDataChange, slug, ParentSectionId, initialData }, ref) => {
  const formSchema = createHeroSchema(languageIds as string[], activeLanguages)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingSubSectionId, setExistingSubSectionId] = useState<string | null>(null)
  const [contentElements, setContentElements] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { toast } = useToast()

  // Get default language code for form values
  const defaultLangCode = activeLanguages.length > 0 ? activeLanguages[0].languageID : 'en'

  const form = useForm<z.infer<SchemaType>>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(languageIds as string[], activeLanguages),
  })

  // Make form methods and data available to parent component
  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Hero form has validation errors")
      
      // Return combined data with image file for the parent to use
      const formValues = form.getValues()
      return {
        ...formValues,
        imageFile: imageFile, // Include the image file
        existingSubSectionId // Include existing ID for updates
      }
    },
    getImageFile: () => imageFile,
    form: form,
    hasUnsavedChanges,
    resetUnsavedChanges: () => setHasUnsavedChanges(false),
    existingSubSectionId,
    contentElements,
    saveData: handleSave // Expose save method to parent
  }))

  const onDataChangeRef = useRef(onDataChange)
  useEffect(() => {
    onDataChangeRef.current = onDataChange
  }, [onDataChange])

  // API hooks
  const { useCreate: useCreateSubSection, useGetCompleteBySlug, useUpdate: useUpdateSubSection } = useSubSections()
  const { useCreate: useCreateContentElement, useUpdate: useUpdateContentElement } = useContentElements()
  const { useBulkUpsert: useBulkUpsertTranslations } = useContentTranslations()

  const createSubSection = useCreateSubSection()
  const updateSubSection = useUpdateSubSection()
  const createContentElement = useCreateContentElement()
  const updateContentElement = useUpdateContentElement()
  const bulkUpsertTranslations = useBulkUpsertTranslations()
  
  // Query for complete subsection data by slug if provided
  const { 
    data: completeSubsectionData, 
    isLoading: isLoadingSubsection, 
    refetch 
  } = useGetCompleteBySlug(
    slug || '', 
    false,    
  )
  
  // Function to process and load initial data from parent component into the form
  const processInitialData = () => {
    // If initialData is provided directly (from parent service/section item), use that
    if (initialData && !dataLoaded) {
      console.log("Processing initial data from parent:", initialData)
      

      
      if (initialData.description) {
        // Set description for default language
        const formValues = form.getValues()
        if (formValues[defaultLangCode]) {
          form.setValue(`${defaultLangCode}.description`, initialData.description)
        }
      }
      
      if (initialData.image) {
        form.setValue('backgroundImage', initialData.image)
      }
      
      setDataLoaded(true)
      setHasUnsavedChanges(false)
    }
  }
  
  // Function to process and load data from subsection API into the form
  const processAndLoadData = (subsectionData: any) => {
    if (!subsectionData) return;

    try {
      console.log("Processing subsection data:", subsectionData)
      setExistingSubSectionId(subsectionData._id)
  
      if (subsectionData.contentElements && subsectionData.contentElements.length > 0) {
        setContentElements(subsectionData.contentElements)
  
        // Find background image element
        const bgImageElement = subsectionData.contentElements.find(
          (el: any) => el.name === 'Background Image' && el.type === 'image'
        )
  
        if (bgImageElement && bgImageElement.imageUrl) {
          form.setValue('backgroundImage', bgImageElement.imageUrl)
        }
  
        // Map element names to keys for form values
        const elementKeyMap: Record<string, string> = {
          'Title': 'title',
          'Description': 'description',
          'Back Link Text': 'backLinkText'
        }
  
        // Create a mapping of languages for easier access
        const langIdToCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
          acc[lang._id] = lang.languageID
          return acc
        }, {})
  
        // Initialize form values for each language
        const languageValues: Record<string, Record<string, string>> = {}
  
        // Initialize all languages with empty values
        languageIds.forEach(langId => {
          const langCode = langIdToCodeMap[langId] || langId
          languageValues[langCode] = {
            title: '',
            description: '',
            backLinkText: '' // Default value
          }
        })
  
        // Process text elements and their translations
        const textElements = subsectionData.contentElements.filter((el: any) => el.type === 'text')
        textElements.forEach((element: any) => {
          const key = elementKeyMap[element.name]
          if (!key) return
  
          // First set default content for all languages
          const defaultContent = element.defaultContent || ''
          if (defaultContent) {
            Object.keys(languageValues).forEach(langCode => {
              languageValues[langCode][key] = defaultContent
            })
          }
          
          // Then process each translation
          if (element.translations && element.translations.length > 0) {
            element.translations.forEach((translation: any) => {
              // Get the language code from the language object or ID
              let langCode
              if (translation.language && translation.language._id) {
                // Handle nested language object
                langCode = langIdToCodeMap[translation.language._id]
              } else if (translation.language) {
                // Handle language ID directly
                langCode = langIdToCodeMap[translation.language]
              }
              
              if (langCode && languageValues[langCode] && translation.content) {
                languageValues[langCode][key] = translation.content
              }
            })
          }
        })
  
        // Set all values in form
        Object.entries(languageValues).forEach(([langCode, values]) => {
          form.setValue(langCode as any, values as any)
        })
      }
      
      setDataLoaded(true)
      setHasUnsavedChanges(false)
      
      // If onDataChange handler exists, update parent with loaded data
      if (onDataChangeRef.current) {
        onDataChangeRef.current(form.getValues())
      }
    } catch (error) {
      console.error('Error processing hero section data:', error)
      toast({
        title: 'Error loading hero section data',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingData(false)
      setIsInitialLoad(false)
    }
  }
  
  // Effect to process initial data from parent component
  useEffect(() => {
    if (isInitialLoad && !dataLoaded && initialData) {
      processInitialData()
      setIsInitialLoad(false)
    }
  }, [initialData, dataLoaded, isInitialLoad])
  
  // Effect to populate form with existing data from complete subsection
  useEffect(() => {
    // Skip if no slug or data already loaded
    if (!slug || dataLoaded || isLoadingSubsection) {
      return
    }
    
    // If we have subsection data, process it
    if (completeSubsectionData?.data) {
      setIsLoadingData(true)
      processAndLoadData(completeSubsectionData.data)
    }
    
  }, [completeSubsectionData, isLoadingSubsection, dataLoaded, slug])

  // Track form changes, but only after initial data is loaded
  useEffect(() => {
    if (isLoadingData || !dataLoaded) return

    const subscription = form.watch((value) => {
      setHasUnsavedChanges(true)
      if (onDataChangeRef.current) {
        onDataChangeRef.current(value)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, isLoadingData, dataLoaded])

  // Handler for saving the form
  const handleSave = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Get current form values before any processing
      const allFormValues = form.getValues()
      console.log("Form values at save:", allFormValues)
      
      let sectionId = existingSubSectionId
      
      // Create or update the subsection
      if (!existingSubSectionId) {
        // Create new subsection only if we don't already have one
        if (!ParentSectionId) {
          throw new Error("Parent section ID is required to create a subsection")
        }

        const subsectionData: Omit<SubSection, "_id"> = {
          name: "Hero Section",
          slug: slug || `hero-section-${Date.now()}`, // Use provided slug or generate one
          description: "Hero section for the website",
          isActive: true,
          order: 0,
          sectionItem: ParentSectionId,
          languages: languageIds as string[],
        }

        console.log("Creating new subsection with data:", subsectionData)
        const newSubSection = await createSubSection.mutateAsync(subsectionData)
        sectionId = newSubSection.data._id
        setExistingSubSectionId(sectionId)
        console.log("Created new subsection with ID:", sectionId)
      } 
      else {
        // Update existing subsection if needed
        const updateData = {
          isActive: true,
          languages: languageIds as string[]
        }
        await updateSubSection.mutateAsync({
          id: existingSubSectionId,
          data: updateData
        })
      }

      if (!sectionId) {
        throw new Error("Failed to create or retrieve subsection ID")
      }

      // Get language ID to code mapping
      const langIdToCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
        acc[lang._id] = lang.languageID
        return acc
      }, {})
      
      // Get language code to ID mapping 
      const langCodeToIdMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
        acc[lang.languageID] = lang._id
        return acc
      }, {})
      
      // Element key to name mapping
      const elementKeyToNameMap = {
        'title': 'Title',
        'description': 'Description',
        'backLinkText': 'Back Link Text'
      }

      if (contentElements.length > 0) {
        // Update existing elements
        console.log("Updating existing elements:", contentElements)
        
        // For image element, handle the upload if there's a new file
        const bgImageElement = contentElements.find(e => e.type === 'image')
        if (bgImageElement && imageFile) {
          console.log("Updating image for element:", bgImageElement._id)
          const formData = new FormData()
          formData.append('image', imageFile)
          await apiClient.post(`/content-elements/${bgImageElement._id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }

        // For text elements, update the translations
        const textElements = contentElements.filter(e => e.type === 'text')
        const translations: Omit<ContentTranslation, "_id">[] = []
        
        // Map element names to keys for form values
        const elementNameToKeyMap: Record<string, string> = {
          'Title': 'title',
          'Description': 'description',
          'Back Link Text': 'backLinkText'
        }

        // Process form values and create translations
        Object.entries(allFormValues).forEach(([langCode, values]) => {
          if (langCode === 'backgroundImage') return
          
          const langId = langCodeToIdMap[langCode]
          if (!langId) return
          
          textElements.forEach(element => {
            const key = elementNameToKeyMap[element.name]
            if (key && values && typeof values === 'object' && key in values) {
              translations.push({
                content: values[key],
                language: langId,
                contentElement: element._id,
                isActive: true,
              })
            }
          })
        })

        if (translations.length > 0) {
          console.log("Bulk upserting translations:", translations.length)
          await bulkUpsertTranslations.mutateAsync(translations)
        }
      } else {
        // Create new elements
        console.log("Creating new content elements for subsection:", sectionId)
        const elementTypes = [
          { type: 'image', key: 'backgroundImage', name: 'Background Image' },
          { type: 'text', key: 'title', name: 'Title' },
          { type: 'text', key: 'description', name: 'Description' },
          { type: 'text', key: 'backLinkText', name: 'Back Link Text' },
        ]

        const createdElements = []
        
        // Step 1: Create all elements first
        for (const [index, el] of elementTypes.entries()) {
          let defaultContent = ""
          
          if (el.type === 'image') {
            defaultContent = allFormValues.backgroundImage || 'image-placeholder'
          } else if (el.type === 'text' && allFormValues[defaultLangCode]) {
            // For text elements, use the value from the default language
            const langValues = allFormValues[defaultLangCode]
            defaultContent = langValues && typeof langValues === 'object' && el.key in langValues
              ? langValues[el.key]
              : ''
              
            console.log(`Creating element ${el.name} with default content: ${defaultContent}`)
          }
          
          const elementData = {
            name: el.name,
            type: el.type,
            parent: sectionId,
            isActive: true,
            order: index,
            defaultContent: defaultContent,
          }
          
          const newElement = await createContentElement.mutateAsync(elementData)
          createdElements.push({ ...newElement.data, key: el.key })
        }

        // Set the newly created content elements
        setContentElements(createdElements.map(e => ({ ...e, translations: [] })))

        // Step 2: Upload background image if needed
        const bgImageElement = createdElements.find(e => e.key === 'backgroundImage')
        if (bgImageElement && imageFile) {
          console.log("Uploading image for new element:", bgImageElement._id)
          const formData = new FormData()
          formData.append('image', imageFile)
          try {
            await apiClient.post(`/content-elements/${bgImageElement._id}/image`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          } catch (error) {
            console.error("Failed to upload image:", error)
          }
        }

        // Step 3: Create translations for all text elements
        const textElements = createdElements.filter(e => e.key !== 'backgroundImage')
        const translations: Omit<ContentTranslation, "_id">[] = []
        
        // Process each language in the form values
        for (const [langCode, langValues] of Object.entries(allFormValues)) {
          if (langCode === 'backgroundImage') continue
          
          const langId = langCodeToIdMap[langCode]
          if (!langId) continue
          
          console.log(`Processing translations for language: ${langCode}`)
          
          // For each text element, create a translation
          for (const element of textElements) {
            if (langValues && typeof langValues === 'object' && element.key in langValues) {
              const content = langValues[element.key]
              console.log(`Creating translation for ${element.key}: ${content}`)
              
              translations.push({
                content: content,
                language: langId,
                contentElement: element._id,
                isActive: true,
              })
            }
          }
        }

        if (translations.length > 0) {
          console.log("Creating translations:", translations.length)
          try {
            const result = await bulkUpsertTranslations.mutateAsync(translations)
            console.log("Translation result:", result)
          } catch (error) {
            console.error("Failed to create translations:", error)
          }
        }
      }

      toast({ 
        title: existingSubSectionId 
          ? "Hero section updated successfully!" 
          : "Hero section created successfully!",
        description: "All content has been saved."
      });

      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Refresh data to ensure we have latest state
      if (slug) {
        await refetch();
      }
      
      setImageFile(null); // Clear the file state after saving
      
      // Return true to indicate successful save
      return true;
    } catch (error) {
      console.error("Operation failed:", error);
      toast({
        title: existingSubSectionId ? "Error updating hero section" : "Error creating hero section",
        variant: "destructive",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      return false;
    } finally {
      setIsSaving(false);
      setIsLoadingData(false);
    }
  };

  // Get language codes for display
  const languageCodes = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {(isLoadingData || isLoadingSubsection) ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading hero section data...</p>
        </div>
      ) : (
        <Form {...form}>
          <div className="mb-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Hero Background Image</CardTitle>
                <CardDescription>
                  Upload a background image for the hero section (applies to all languages)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="backgroundImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploader value={field.value} onChange={field.onChange} onFileChange={setImageFile} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {languageIds.map((langId) => {
              const langCode = languageCodes[langId] || langId
              return (
                <Card key={langId} className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
                        {langCode}
                      </span>
                      Hero Section
                    </CardTitle>
                    <CardDescription>Manage hero content for {langCode.toUpperCase()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`${langCode}.title`}
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
                      name={`${langCode}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter description" className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`${langCode}.backLinkText`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button Text</FormLabel>
                          <FormControl>
                            <Input placeholder="Get Started" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </Form>
      )}
      <Button 
        type="button" 
        onClick={handleSave} 
        disabled={isLoadingData || isSaving}
        className="flex items-center"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {existingSubSectionId ? "Update Hero Content" : "Save Hero Content"}
          </>
        )}
      </Button>
    </div>
  )
})

HeroForm.displayName = "HeroForm"
export default HeroForm