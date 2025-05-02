"use client"

import { forwardRef, useEffect, useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Loader2, ImageIcon } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Button } from "@/src/components/ui/button"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import apiClient from "@/src/lib/api-client"
import { useToast } from "@/src/hooks/use-toast"
import { LoadingDialog } from "./MainSectionComponents"
import { ContentElement, FormLanguageValues, HeroFormProps, SubSectionData, Translation } from "../../types/HeroFor.types"
import { HeroFormRef } from "../../types/BenefitsForm.types"
import { Label } from "@/src/components/ui/label"
import { createHeroSchema } from "../../Utils/language-specifi-schemas"
import { createHeroDefaultValues } from "../../Utils/Language-default-values"
import { createFormRef } from "../../Utils/Expose-form-data"
import { processAndLoadData } from "../../Utils/load-form-data"
import { ContentElementType } from "@/src/api/types"
import { createLanguageCodeMap } from "../../Utils/language-utils"
import { SimpleImageUploader, useImageUpload } from "../../Utils/Image-uploader"

const HeroForm = forwardRef<HeroFormRef, HeroFormProps>(
  ({ languageIds, activeLanguages, onDataChange, slug, ParentSectionId, initialData }, ref) => {
    // Create schema with type safety
    const formSchema = createHeroSchema(languageIds, activeLanguages)
    type FormSchemaType = z.infer<typeof formSchema>
    const defaultValues = createHeroDefaultValues(languageIds, activeLanguages)
    const [isLoadingData, setIsLoadingData] = useState<boolean>(false)
    const [dataLoaded, setDataLoaded] = useState<boolean>(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
    const [existingSubSectionId, setExistingSubSectionId] = useState<string | null>(null)
    const [contentElements, setContentElements] = useState<ContentElementType[]>([])
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [isFormReady, setIsFormReady] = useState<boolean>(false)
    const { toast } = useToast()
    const dataProcessed = useRef<boolean>(false)
    
    // API hooks
    const { useCreate: useCreateSubSection, useGetCompleteBySlug, useUpdate: useUpdateSubSection } = useSubSections()
    const { useCreate: useCreateContentElement } = useContentElements()
    const { useBulkUpsert: useBulkUpsertTranslations } = useContentTranslations()
    const createSubSection = useCreateSubSection()
    const updateSubSection = useUpdateSubSection()
    const createContentElement = useCreateContentElement()
    const bulkUpsertTranslations = useBulkUpsertTranslations()

    // Get default language code for form values
    const defaultLangCode = activeLanguages.length > 0 ? activeLanguages[0].languageID : 'en'

    const form = useForm<FormSchemaType>({
      resolver: zodResolver(formSchema),
      defaultValues: defaultValues
    })

    // Use the image upload hook from our utility
    const { 
      imageFile, 
      imagePreview, 
      handleImageUpload, 
      handleImageRemove 
    } = useImageUpload({
      form,
      fieldPath: 'backgroundImage',
      initialImageUrl: initialData?.image || form.getValues().backgroundImage,
      onUpload: (file) => {
        setHasUnsavedChanges(true);
      },
      onRemove: () => {
        setHasUnsavedChanges(true);
      }
    });

    // Use ref for callback to avoid unnecessary re-renders
    const onDataChangeRef = useRef<((data: any) => void) | undefined>(onDataChange)
    useEffect(() => {
      onDataChangeRef.current = onDataChange
    }, [onDataChange])

    // Query for complete subsection data by slug if provided
    const { 
      data: completeSubsectionData, 
      isLoading: isLoadingSubsection, 
      refetch 
    } = useGetCompleteBySlug(
      slug || '', 
      Boolean(slug),  // Only enable query if slug exists
    )
    
    const processInitialData = () => {
      // If initialData is provided directly (from parent service/section item), use that
      if (initialData && !dataLoaded) {
        console.log("Processing initial data from parent:", initialData)
        
        if (initialData.description) {
          // Set description for default language
          const formValues = form.getValues()
          if (formValues[defaultLangCode] && typeof formValues[defaultLangCode] === 'object') {
            form.setValue(`${defaultLangCode}.description` as any, initialData.description)
          }
        }
        
        if (initialData.image) {
          form.setValue('backgroundImage', initialData.image)
          // Image preview is now handled by the useImageUpload hook
        }
        
        setDataLoaded(true)
        setHasUnsavedChanges(false)
        setIsFormReady(true)
      }
    }

    const processHeroData = (subsectionData: SubSectionData | null) => {
      processAndLoadData(
        subsectionData,
        form,
        languageIds,
        activeLanguages,
        {
          // Group elements by their type - for hero we don't need grouping
          groupElements: (elements) => {
            // For hero section, we don't group by ID, but by element name
            return {
              'hero': elements.filter(el => el.type === 'text' || (el.name === 'Background Image' && el.type === 'image'))
            };
          },
          
          // Process the hero elements for a language
          processElementGroup: (groupId, elements, langId, getTranslationContent) => {
            // Map element names to keys for form values
            const elementKeyMap = {
              'Title': 'title',
              'Description': 'description',
              'Back Link Text': 'backLinkText'
            };
            
            // Create result object
            const result = {
              title: '',
              description: '',
              backLinkText: ''
            };
            
            // Find and set values for text elements
            elements.filter(el => el.type === 'text').forEach(element => {
              const key = elementKeyMap[element.name];
              if (key) {
                result[key] = getTranslationContent(element, '');
              }
            });
            
            return result;
          },
          
          // Default value for hero
          getDefaultValue: () => ({
            title: '',
            description: '',
            backLinkText: ''
          })
        },
        {
          setExistingSubSectionId,
          setContentElements,
          setDataLoaded,
          setHasUnsavedChanges,
          setIsLoadingData
        }
      );
      
      // Handle background image separately (this is outside the language structure)
      const bgImageElement = subsectionData?.elements?.find(
        (el) => el.name === 'Background Image' && el.type === 'image'
      ) || subsectionData?.contentElements?.find(
        (el) => el.name === 'Background Image' && el.type === 'image'
      );
      
      if (bgImageElement?.imageUrl) {
        form.setValue('backgroundImage', bgImageElement.imageUrl);
        // Image preview is now handled by the useImageUpload hook
      }
    };
    
    // Effect to process initial data from parent component
    useEffect(() => {
      if (!dataLoaded && initialData) {
        processInitialData()
      }
    }, [initialData])
    
    // Effect to populate form with existing data from complete subsection
    useEffect(() => {
      if (!slug || isLoadingSubsection || dataProcessed.current) return
      if (completeSubsectionData?.data) {
        setIsLoadingData(true)
        processHeroData(completeSubsectionData.data as unknown as SubSectionData)
        setDataLoaded(true)
        dataProcessed.current = true
        setIsLoadingData(false)
        setIsFormReady(true)
      }
    }, [completeSubsectionData, isLoadingSubsection, slug])

    // Make form ready even if no data is loaded
    useEffect(() => {
      if (!isLoadingData && !isLoadingSubsection && !isFormReady) {
        setIsFormReady(true)
      }
    }, [isLoadingData, isLoadingSubsection, isFormReady])

    // Track form changes, but only after initial data is loaded
    useEffect(() => {
      if (isLoadingData || !isFormReady) return

      const subscription = form.watch((value) => {
        setHasUnsavedChanges(true)
        if (onDataChangeRef.current) {
          onDataChangeRef.current(value)
        }
      })
      
      return () => subscription.unsubscribe()
    }, [form, isLoadingData, isFormReady])

    // Handler for saving the form
    const handleSave = async (): Promise<boolean> => {
      const isValid = await form.trigger()
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields correctly",
          variant: "destructive",
        })
        return false
      }

      setIsSaving(true)
      try {
        const allFormValues = form.getValues()
        console.log("Form values at save:", allFormValues)

        let sectionId = existingSubSectionId

        if (!existingSubSectionId) {
          if (!ParentSectionId) {
            throw new Error("Parent section ID is required to create a subsection")
          }
          const subsectionData = {
            name: "Hero Section",
            slug: slug || `hero-section-${Date.now()}`,
            description: "",
            isActive: true,
            isMain: false,
            order: 0,
            sectionItem: ParentSectionId,
            languages: languageIds,
          }
          const newSubSection = await createSubSection.mutateAsync(subsectionData)
          sectionId = newSubSection.data._id
          setExistingSubSectionId(sectionId)
        } else {
          const updateData = {
            isActive: true,
            isMain: false,
            languages: languageIds,
          }
          await updateSubSection.mutateAsync({
            id: existingSubSectionId,
            data: updateData,
          })
        }

        if (!sectionId) {
          throw new Error("Failed to create or retrieve subsection ID")
        }

        const langCodeToIdMap = activeLanguages.reduce<Record<string, string>>((acc, lang) => {
          acc[lang.languageID] = lang._id
          return acc
        }, {})


        if (contentElements.length > 0) {
          const bgImageElement = contentElements.find((e) => e.type === "image")
          if (bgImageElement && imageFile) {
            const formData = new FormData()
            formData.append("image", imageFile)
            const uploadResult = await apiClient.post(`/content-elements/${bgImageElement._id}/image`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            })
            if (uploadResult.data?.imageUrl) {
              form.setValue("backgroundImage", uploadResult.data.imageUrl, { shouldDirty: false })
              // Update handled by the form value
            }
          }

          const textElements = contentElements.filter((e) => e.type === "text")
          const translations: Translation[] = []

          const elementNameToKeyMap: Record<string, string> = {
            Title: "title",
            Description: "description",
            "Back Link Text": "backLinkText",
          }

          Object.entries(allFormValues).forEach(([langCode, values]) => {
            if (langCode === "backgroundImage") return
            const langId = langCodeToIdMap[langCode]
            if (!langId) return
            textElements.forEach((element) => {
              const key = elementNameToKeyMap[element.name]
              if (key && values && typeof values === "object" && key in values) {
                translations.push({
                  content: (values as FormLanguageValues)[key as keyof FormLanguageValues] as string,
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
          const elementTypes = [
            { type: "image", key: "backgroundImage", name: "Background Image" },
            { type: "text", key: "title", name: "Title" },
            { type: "text", key: "description", name: "Description" },
            { type: "text", key: "backLinkText", name: "Back Link Text" },
          ]

          const createdElements: (ContentElement & { key: string })[] = []
          for (const [index, el] of elementTypes.entries()) {
            let defaultContent = ""
            if (el.type === "image") {
              defaultContent = allFormValues.backgroundImage || "image-placeholder"
            } else if (el.type === "text" && typeof allFormValues[defaultLangCode] === "object") {
              const langValues = allFormValues[defaultLangCode] as FormLanguageValues
              defaultContent =
                langValues && typeof langValues === "object" && el.key in langValues
                  ? (langValues[el.key as keyof FormLanguageValues] as string)
                  : ""
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

          setContentElements(createdElements.map((e) => ({ ...e, translations: [] })))

          const bgImageElement = createdElements.find((e) => e.key === "backgroundImage")
          if (bgImageElement && imageFile) {
            const formData = new FormData()
            formData.append("image", imageFile)
            const uploadResult = await apiClient.post(`/content-elements/${bgImageElement._id}/image`, formData, {
              headers: { "Content-Type": "multipart/form-data", timeout: 30000 },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / (progressEvent.total || 1)
                )
                console.log(`Upload progress: ${percentCompleted}%`)
              },
            })

            if (uploadResult.data?.imageUrl) {
              form.setValue("backgroundImage", uploadResult.data.imageUrl, { shouldDirty: false })
              // Update handled by the form value
            }
          }

          const textElements = createdElements.filter((e) => e.key !== "backgroundImage")
          const translations: Translation[] = []
          for (const [langCode, langValues] of Object.entries(allFormValues)) {
            if (langCode === "backgroundImage") continue
            const langId = langCodeToIdMap[langCode]
            if (!langId) continue
            for (const element of textElements) {
              if (langValues && typeof langValues === "object" && element.key in langValues) {
                const content = (langValues as FormLanguageValues)[element.key as keyof FormLanguageValues] as string
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
            await bulkUpsertTranslations.mutateAsync(translations)
          }
        }

        toast({
          title: existingSubSectionId ? "Hero section updated successfully!" : "Hero section created successfully!",
          description: "All content has been saved.",
        })

        setHasUnsavedChanges(false)
        // Do not clear imageFile here, as it's managed by the utility hook

        if (slug) {
          await refetch()
        }

        return true
      } catch (error) {
        console.error("Operation failed:", error)
        toast({
          title: existingSubSectionId ? "Error updating hero section" : "Error creating hero section",
          variant: "destructive",
          description: error instanceof Error ? error.message : "Unknown error occurred",
        })
        return false
      } finally {
        setIsSaving(false)
      }
    }

    // Use the form ref utility
    createFormRef(ref, {
      form,
      hasUnsavedChanges,
      setHasUnsavedChanges,
      existingSubSectionId,
      contentElements,
      componentName: 'Hero',
      extraMethods: {
        getImageFile: () => imageFile,
        saveData: handleSave
      },
      extraData: {
        imageFile,
        existingSubSectionId
      }
    });

    // Get language codes for display
    const languageCodes = createLanguageCodeMap(activeLanguages);

    return (
      <div className="space-y-6">
        {/* Loading Dialog */}
        <LoadingDialog 
          isOpen={isSaving} 
          title={existingSubSectionId ? "Updating Hero Section" : "Creating Hero Section"}
          description="Please wait while we save your changes..."
        />
        
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
                  <CardDescription>Upload a background image for the hero section (applies to all languages)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4" />
                        Background Image
                        <span className="text-xs text-muted-foreground">(applies to all languages)</span>
                      </Label>
                      {/* Use our SimpleImageUploader component from the utilities */}
                      <SimpleImageUploader
                        imageValue={imagePreview || form.getValues().backgroundImage}
                        inputId="file-upload-background-image"
                        onUpload={handleImageUpload}
                        onRemove={handleImageRemove}
                        altText="Background image preview"
                      />
                    </div>
                  </div>
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
        <div className="flex justify-end mt-6">
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
      </div>
    )
  }
)

HeroForm.displayName = "HeroForm"
export default HeroForm