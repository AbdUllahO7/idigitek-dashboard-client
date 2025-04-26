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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { Label } from "@/src/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import apiClient from "@/src/lib/api-client"
import type { ContentTranslation, SubSection, Language } from "@/src/api/types"
import { toast } from "@/src/components/ui/use-toast"

interface FeaturesFormProps {
  languageIds: readonly string[]
  activeLanguages: Language[]
  onDataChange?: (data: any) => void
  slug?: string // Optional slug to load existing data
}

// Define interfaces to improve type safety
interface FeatureContent {
  heading: string
  description: string
  features: string[]
  image: string
  imageAlt: string
  imagePosition: "left" | "right"
}

interface Feature {
  id: string
  title: string
  content: FeatureContent
}

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
            imageAlt: z.string().min(1, { message: "Image alt text is required" }),
            imagePosition: z.enum(["left", "right"]),
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
          imageAlt: "",
          imagePosition: "right",
        },
      },
    ]
  })

  return defaultValues
}

const FeaturesForm = forwardRef<any, FeaturesFormProps>(({ languageIds, activeLanguages, onDataChange, slug }, ref) => {
  const featuresSchema = createFeaturesSchema(languageIds as string[], activeLanguages)
  const [isLoadingData, setIsLoadingData] = useState(!slug)
  const [dataLoaded, setDataLoaded] = useState(!slug)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [featureCountMismatch, setFeatureCountMismatch] = useState(false)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [featureImages, setFeatureImages] = useState<Record<number, File | null>>({})
  const [existingSubSectionId, setExistingSubSectionId] = useState<string | null>(null)
  const [contentElements, setContentElements] = useState<any[]>([])

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
  } = useGetCompleteBySlug(slug || "", false, true, { enabled: !!slug })

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
  const processAndLoadData = (subsectionData: any) => {
    if (!subsectionData) return

    try {
      setExistingSubSectionId(subsectionData._id)

      if (subsectionData.contentElements && subsectionData.contentElements.length > 0) {
        setContentElements(subsectionData.contentElements)

        // Create a mapping of languages for easier access
        const langIdToCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
          acc[lang._id] = lang.languageID
          return acc
        }, {})

        // Group content elements by feature
        const featureGroups: Record<string, any[]> = {}

        subsectionData.contentElements.forEach((element: any) => {
          // Extract feature ID from element name (e.g., "Feature 1 - Heading" -> "1")
          const featureIdMatch = element.name.match(/Feature (\d+)/i)
          if (featureIdMatch) {
            const featureId = featureIdMatch[1]
            if (!featureGroups[featureId]) {
              featureGroups[featureId] = []
            }
            featureGroups[featureId].push(element)
          }
        })

        // Initialize form values for each language
        const languageValues: Record<string, Feature[]> = {}

        // Initialize all languages with empty feature arrays
        languageIds.forEach((langId) => {
          const langCode = langIdToCodeMap[langId] || langId
          languageValues[langCode] = []
        })

        // Process each feature group
        Object.entries(featureGroups).forEach(([featureId, elements]) => {
          // Find elements for this feature
          const headingElement = elements.find((el) => el.name.includes("Heading"))
          const descriptionElement = elements.find((el) => el.name.includes("Description"))
          const imageElement = elements.find((el) => el.name.includes("Image") && el.type === "image")
          const imageAltElement = elements.find((el) => el.name.includes("Image Alt"))
          const imagePositionElement = elements.find((el) => el.name.includes("Image Position"))
          const featureListElements = elements.filter((el) => el.name.includes("Feature Item"))

          // For each language, create a feature object
          languageIds.forEach((langId) => {
            const langCode = langIdToCodeMap[langId] || langId

            // Helper function to get translation content for an element
            const getTranslationContent = (element: any, defaultValue = "") => {
              if (!element) return defaultValue

              // First check for a translation in this language
              const translation = element.translations?.find((t: any) => {
                const translationLangId = t.language?._id || t.language
                return translationLangId === langId
              })

              if (translation?.content) return translation.content

              // Fall back to default content
              return element.defaultContent || defaultValue
            }

            // Get feature list items
            const featureItems = featureListElements.map((el) => getTranslationContent(el, "")).filter(Boolean)

            // Create the feature object
            const feature: Feature = {
              id: `feature-${featureId}`,
              title: getTranslationContent(headingElement, ""),
              content: {
                heading: getTranslationContent(headingElement, ""),
                description: getTranslationContent(descriptionElement, ""),
                features: featureItems.length > 0 ? featureItems : [""],
                image: imageElement?.imageUrl || "",
                imageAlt: getTranslationContent(imageAltElement, ""),
                imagePosition: getTranslationContent(imagePositionElement, "right") as "left" | "right",
              },
            }

            // Add to language values
            languageValues[langCode].push(feature)
          })
        })

        // Set all values in form
        Object.entries(languageValues).forEach(([langCode, features]) => {
          if (features.length > 0) {
            form.setValue(langCode as any, features as any)
          }
        })
      }

      setDataLoaded(true)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error processing features section data:", error)
      toast({
        title: "Error loading features section data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
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
    const isValid = await form.trigger()
    const hasEqualFeatureCounts = validateFeatureCounts()

    if (!hasEqualFeatureCounts) {
      setIsValidationDialogOpen(true)
      return
    }

    if (!isValid) return

    setIsLoadingData(true)
    try {
      // Get current form values before any processing
      const allFormValues = form.getValues()
      console.log("Form values at save:", allFormValues)

      let sectionId = existingSubSectionId

      // Create or update logic here
      if (!existingSubSectionId) {
        // Create new subsection
        const subsectionData: Omit<SubSection, "_id"> = {
          name: "Features Section",
          slug: slug || `features-section-${Date.now()}`, // Use provided slug or generate one
          description: "Features section for the website",
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

      if (existingSubSectionId && contentElements.length > 0) {
        // Update existing elements
        // For image elements, handle the upload if there's a new file
        for (const [featureIndex, file] of Object.entries(featureImages)) {
          if (!file) continue

          const featureNum = Number.parseInt(featureIndex) + 1
          const imageElement = contentElements.find(
            (e) => e.type === "image" && e.name.includes(`Feature ${featureNum}`),
          )

          if (imageElement) {
            const formData = new FormData()
            formData.append("image", file)
            await apiClient.post(`/content-elements/${imageElement._id}/image`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            })
          }
        }

        // For text elements, update the translations
        const translations: Omit<ContentTranslation, "_id">[] = []

        // Process form values and create translations
        Object.entries(allFormValues).forEach(([langCode, features]) => {
          const langId = langCodeToIdMap[langCode]
          if (!langId || !Array.isArray(features)) return

          features.forEach((feature, featureIndex) => {
            const featureNum = featureIndex + 1

            // Find elements for this feature
            const headingElement = contentElements.find((e) => e.name === `Feature ${featureNum} - Heading`)
            const descriptionElement = contentElements.find((e) => e.name === `Feature ${featureNum} - Description`)
            const imageAltElement = contentElements.find((e) => e.name === `Feature ${featureNum} - Image Alt`)
            const imagePositionElement = contentElements.find(
              (e) => e.name === `Feature ${featureNum} - Image Position`,
            )

            // Find feature item elements
            const featureItemElements = contentElements.filter((e) =>
              e.name.startsWith(`Feature ${featureNum} - Feature Item `),
            )

            // Create translations for each element
            if (headingElement) {
              translations.push({
                content: feature.content.heading,
                language: langId,
                contentElement: headingElement._id,
                isActive: true,
              })
            }

            if (descriptionElement) {
              translations.push({
                content: feature.content.description,
                language: langId,
                contentElement: descriptionElement._id,
                isActive: true,
              })
            }

            if (imageAltElement) {
              translations.push({
                content: feature.content.imageAlt,
                language: langId,
                contentElement: imageAltElement._id,
                isActive: true,
              })
            }

            if (imagePositionElement) {
              translations.push({
                content: feature.content.imagePosition,
                language: langId,
                contentElement: imagePositionElement._id,
                isActive: true,
              })
            }

            // Create translations for feature items
            feature.content.features.forEach((featureItem, itemIndex) => {
              const itemElement = featureItemElements.find(
                (e) => e.name === `Feature ${featureNum} - Feature Item ${itemIndex + 1}`,
              )

              if (itemElement) {
                translations.push({
                  content: featureItem,
                  language: langId,
                  contentElement: itemElement._id,
                  isActive: true,
                })
              } else {
                // Create new feature item element if it doesn't exist
                createContentElement
                  .mutateAsync({
                    name: `Feature ${featureNum} - Feature Item ${itemIndex + 1}`,
                    type: "text",
                    parent: sectionId,
                    isActive: true,
                    order: itemIndex,
                    defaultContent: featureItem,
                  })
                  .then((newElement) => {
                    translations.push({
                      content: featureItem,
                      language: langId,
                      contentElement: newElement.data._id,
                      isActive: true,
                    })

                    // Add to bulk upsert if we have a batch
                    if (translations.length > 0) {
                      bulkUpsertTranslations.mutateAsync(translations)
                    }
                  })
              }
            })
          })
        })

        if (translations.length > 0) {
          await bulkUpsertTranslations.mutateAsync(translations)
        }
      } else {
        // Create new elements for each feature
        const firstLangCode = Object.keys(allFormValues)[0]
        const features = allFormValues[firstLangCode]

        if (!Array.isArray(features)) {
          throw new Error("Invalid features data")
        }

        // Create elements for each feature
        for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
          const featureNum = featureIndex + 1
          const elementTypes = [
            { type: "image", key: "image", name: `Feature ${featureNum} - Image` },
            { type: "text", key: "heading", name: `Feature ${featureNum} - Heading` },
            { type: "text", key: "description", name: `Feature ${featureNum} - Description` },
            { type: "text", key: "imageAlt", name: `Feature ${featureNum} - Image Alt` },
            { type: "text", key: "imagePosition", name: `Feature ${featureNum} - Image Position` },
          ]

          const createdElements = []

          // Step 1: Create base elements first
          for (const [index, el] of elementTypes.entries()) {
            let defaultContent = ""

            if (el.type === "image") {
              defaultContent = "image-placeholder"
            } else if (el.type === "text" && allFormValues[defaultLangCode]) {
              // For text elements, use the value from the default language
              const feature = allFormValues[defaultLangCode][featureIndex]
              if (feature && feature.content && el.key in feature.content) {
                defaultContent = feature.content[el.key]
              }
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

          // Step 2: Create feature item elements
          const featureItems = features[featureIndex].content.features || []
          const featureItemElements = []

          for (let itemIndex = 0; itemIndex < featureItems.length; itemIndex++) {
            const itemName = `Feature ${featureNum} - Feature Item ${itemIndex + 1}`
            const defaultContent = featureItems[itemIndex] || ""

            const elementData = {
              name: itemName,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: itemIndex,
              defaultContent: defaultContent,
            }

            const newElement = await createContentElement.mutateAsync(elementData)
            featureItemElements.push({ ...newElement.data, itemIndex })
          }

          // Step 3: Upload image if needed
          const imageElement = createdElements.find((e) => e.key === "image")
          const imageFile = featureImages[featureIndex]

          if (imageElement && imageFile) {
            const formData = new FormData()
            formData.append("image", imageFile)
            try {
              await apiClient.post(`/content-elements/${imageElement._id}/image`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
              })
            } catch (error) {
              console.error(`Failed to upload image for feature ${featureNum}:`, error)
            }
          }

          // Step 4: Create translations for all text elements
          const translations: Omit<ContentTranslation, "_id">[] = []

          // Process each language in the form values
          for (const [langCode, langFeatures] of Object.entries(allFormValues)) {
            const langId = langCodeToIdMap[langCode]
            if (!langId || !Array.isArray(langFeatures) || !langFeatures[featureIndex]) continue

            const feature = langFeatures[featureIndex]

            // Add translations for main elements
            for (const element of createdElements) {
              if (element.key === "image") continue

              if (feature.content && element.key in feature.content) {
                translations.push({
                  content: feature.content[element.key],
                  language: langId,
                  contentElement: element._id,
                  isActive: true,
                })
              }
            }

            // Add translations for feature items
            const items = feature.content?.features || []
            for (let i = 0; i < items.length && i < featureItemElements.length; i++) {
              translations.push({
                content: items[i],
                language: langId,
                contentElement: featureItemElements[i]._id,
                isActive: true,
              })
            }
          }

          if (translations.length > 0) {
            try {
              await bulkUpsertTranslations.mutateAsync(translations)
            } catch (error) {
              console.error(`Failed to create translations for feature ${featureNum}:`, error)
            }
          }
        }
      }

      toast({
        title: existingSubSectionId
          ? "Features section updated successfully!"
          : "Features section created successfully!",
      })

      // Refresh data immediately after save
      if (slug) {
        const result = await refetch()
        if (result.data?.data) {
          // Reset form with the new data
          setDataLoaded(false)
          processAndLoadData(result.data.data)
        }
      }

      setHasUnsavedChanges(false)
      setFeatureImages({}) // Clear the file state after saving
    } catch (error) {
      console.error("Operation failed:", error)
      toast({
        title: existingSubSectionId ? "Error updating features section" : "Error creating features section",
        variant: "destructive",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

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

  // Function to add a new feature
  const addFeature = (langCode: string) => {
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      title: "",
      content: {
        heading: "",
        description: "",
        features: [""],
        image: "",
        imageAlt: "",
        imagePosition: "right",
      },
    }

    // Add the new feature to all languages to maintain consistency
    Object.keys(form.getValues()).forEach((lang) => {
      const features = [...(form.getValues()[lang] || [])]
      features.push(newFeature)
      form.setValue(lang as any, features)
    })
  }

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
                                      <FormItem>
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
                                </div>

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

                                <FormField
                                  control={form.control}
                                  name={`${langCode}.${index}.content.imageAlt` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Image Alt Text</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Image description" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`${langCode}.${index}.content.imagePosition` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Image Position</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select position" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="left">Left</SelectItem>
                                          <SelectItem value="right">Right</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
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
