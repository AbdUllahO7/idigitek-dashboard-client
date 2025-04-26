"use client"

import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save } from "lucide-react"
import { toast } from "@/src/hooks/use-toast"
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

interface HeroFormProps {
  languageIds: readonly string[]
  activeLanguages: Language[]
  onDataChange?: (data: any) => void
  slug?: string // Optional slug to load existing data
}

const createHeroSchema = (languageIds: string[], activeLanguages: Language[]) => {
  const schemaShape: Record<string, any> = {
    backgroundImage: z.string().min(1, { message: "Background image is required" }),
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
      title: "Title",  // Default placeholder text
      description: "Description text",  // Default placeholder text
      backLinkText: "Get Started",  // Default placeholder text
    }
  })

  return defaultValues
}

const HeroForm = forwardRef<any, HeroFormProps>(({ languageIds, activeLanguages, onDataChange, slug }, ref) => {
  const formSchema = createHeroSchema(languageIds as string[], activeLanguages)
  const [isLoadingData, setIsLoadingData] = useState(!slug)
  const [dataLoaded, setDataLoaded] = useState(!slug)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingSubSectionId, setExistingSubSectionId] = useState<string | null>(null)
  const [contentElements, setContentElements] = useState<any[]>([])

  console.log(isLoadingData)
  
  // Get default language code for form values
  const defaultLangCode = activeLanguages.length > 0 ? activeLanguages[0].languageID : 'en'

  const form = useForm<z.infer<SchemaType>>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(languageIds as string[], activeLanguages),
  })

  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Hero form has validation errors")
      return form.getValues()
    },
    getImageFile: () => imageFile,
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
  const { useCreate: useCreateContentElement } = useContentElements()
  const { useBulkUpsert: useBulkUpsertTranslations } = useContentTranslations()

  const createSubSection = useCreateSubSection()
  const createContentElement = useCreateContentElement()
  const bulkUpsertTranslations = useBulkUpsertTranslations()
  
  // Query for complete subsection data by slug if provided
  const { data: completeSubsectionData, isLoading: isLoadingSubsection, refetch } = 
    useGetCompleteBySlug(slug || '', false, true, { enabled: !!slug })
  
  // Function to process and load data into the form
  const processAndLoadData = (subsectionData: any) => {
    if (!subsectionData) return;

    try {
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
  
        // Initialize all languages with default values
        languageIds.forEach(langId => {
          const langCode = langIdToCodeMap[langId] || langId
          languageValues[langCode] = {
            title: 'Title',
            description: 'Description text',
            backLinkText: 'Get Started'
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
    } catch (error) {
      console.error('Error processing hero section data:', error)
      toast({
        title: 'Error loading hero section data',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingData(false)
    }
  }
  
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

  const handleSave = async () => {
    if (!(await form.trigger())) return

    setIsLoadingData(true);
    try {
      let sectionId = existingSubSectionId
      
      // Create or update logic here
      if (!existingSubSectionId) {
        // Create new subsection
        const subsectionData: Omit<SubSection, "_id"> = {
          name: "Hero Section",
          slug: slug || `hero-section-${Date.now()}`, // Use provided slug or generate one
          description: "Hero section for the website",
          isActive: true,
          order: 0,
          parentSections: [],
          languages: languageIds as string[],
        }

        const newSubSection = await createSubSection.mutateAsync(subsectionData)
        sectionId = newSubSection.data._id
      }

      if (!sectionId) {
        throw new Error("Failed to create or retrieve subsection ID")
      }

      // Create or update content elements
      if (existingSubSectionId && contentElements.length > 0) {
        // Update existing elements
        // For image element, handle the upload if there's a new file
        const bgImageElement = contentElements.find(e => e.type === 'image')
        if (bgImageElement && imageFile) {
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
        const elementKeyMap: Record<string, string> = {
          'Title': 'title',
          'Description': 'description',
          'Back Link Text': 'backLinkText'
        }
        
        // Get language codes map
        const langCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
          acc[lang.languageID] = lang._id
          return acc
        }, {})

        Object.entries(form.getValues()).forEach(([langCode, values]) => {
          if (langCode === 'backgroundImage') return
          
          const langId = langCodeMap[langCode]
          if (!langId) return
          
          textElements.forEach(element => {
            const key = elementKeyMap[element.name]
            if (key && values[key] !== undefined) {
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
          await bulkUpsertTranslations.mutateAsync(translations)
        }
      } else {
        // Create new elements
        const elements = [
          { type: 'image', key: 'backgroundImage', name: 'Background Image' },
          { type: 'text', key: 'title', name: 'Title' },
          { type: 'text', key: 'description', name: 'Description' },
          { type: 'text', key: 'backLinkText', name: 'Back Link Text' },
        ]

        const createdElements = []
        for (const [index, el] of elements.entries()) {
          const elementData = {
            name: el.name,
            type: el.type,
            parent: sectionId,
            isActive: true,
            order: index,
            defaultContent: el.type === 'image' 
              ? 'image-placeholder'
              : form.getValues()[defaultLangCode]?.[el.key] || '',
          }
          const newElement = await createContentElement.mutateAsync(elementData)
          createdElements.push({ ...newElement.data, key: el.key })
        }

        // Upload Background Image separately using FormData 
        const bgImageElement = createdElements.find(e => e.key === 'backgroundImage')
        if (bgImageElement && imageFile) {
          const formData = new FormData()
          formData.append('image', imageFile)
          await apiClient.post(`/content-elements/${bgImageElement._id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }

        // Create Translations
        const translations: Omit<ContentTranslation, "_id">[] = []
        const textElements = createdElements.filter(e => e.type === 'text')
        const langCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
          acc[lang.languageID] = lang._id
          return acc
        }, {})

        Object.entries(form.getValues()).forEach(([langCode, values]) => {
          if (langCode === 'backgroundImage') return
          
          const langId = langCodeMap[langCode]
          if (!langId) return

          for (const element of textElements) {
            translations.push({
              content: values[element.key],
              language: langId,
              contentElement: element._id,
              isActive: true,
            })
          }
        })

        if (translations.length > 0) {
          await bulkUpsertTranslations.mutateAsync(translations)
        }
      }

      toast({ 
        title: existingSubSectionId 
          ? "Hero section updated successfully!" 
          : "Hero section created successfully!" 
      })

      // Refresh data immediately after save
      if (slug) {
        const result = await refetch();
        if (result.data?.data) {
          // Reset form with the new data
          setDataLoaded(false);
          processAndLoadData(result.data.data);
        }
      }
      
      setHasUnsavedChanges(false);
      setImageFile(null); // Clear the file state after saving
    } catch (error) {
      console.error("Operation failed:", error)
      toast({
        title: existingSubSectionId ? "Error updating hero section" : "Error creating hero section",
        variant: "destructive",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoadingData(false);
    }
  }

  // Get language codes for display
  const languageCodes = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {(slug && (isLoadingData || isLoadingSubsection) && !dataLoaded) ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading hero section data...</p>
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
        disabled={isLoadingData || isLoadingSubsection || !hasUnsavedChanges || createSubSection.isPending}
        className="flex items-center"
      >
        <Save className="mr-2 h-4 w-4" />
        {createSubSection.isPending ? "Saving..." : existingSubSectionId ? "Update Hero Content" : "Save Hero Content"}
      </Button>
    </div>
  )
})

HeroForm.displayName = "HeroForm"
export default HeroForm