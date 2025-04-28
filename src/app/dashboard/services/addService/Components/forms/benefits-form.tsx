"use client"

import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Trash2, Plus, AlertTriangle } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Button } from "@/src/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import type { ContentTranslation, SubSection, Language } from "@/src/api/types"
import { useToast } from "@/src/hooks/use-toast"
import { BenefitsFormProps } from "@/src/api/types/sectionsTypes"



// Available icons
const availableIcons = [
  "Clock",
  "MessageSquare",
  "LineChart",
  "Headphones",
  "Car",
  "MonitorSmartphone",
  "Settings",
  "CreditCard",
]

// Create a dynamic schema based on available languages
const createBenefitsSchema = (languageIds: string[], activeLanguages: Language[]) => {
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
          icon: z.string().min(1, { message: "Icon is required" }),
          title: z.string().min(1, { message: "Title is required" }),
          description: z.string().min(1, { message: "Description is required" }),
        }),
      )
      .min(1, { message: "At least one benefit is required" })
  })

  return z.object(schemaShape)
}

type SchemaType = ReturnType<typeof createBenefitsSchema>

const createDefaultValues = (languageIds: string[], activeLanguages: Language[]) => {
  const defaultValues: Record<string, any> = {}

  const languageCodeMap = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  languageIds.forEach((langId) => {
    const langCode = languageCodeMap[langId] || langId
    defaultValues[langCode] = [
      {
        icon: "Clock",
        title: "",
        description: "",
      },
    ]
  })

  return defaultValues
}

const BenefitsForm = forwardRef<any, BenefitsFormProps>(({ languageIds, activeLanguages, onDataChange, slug , ParentSectionId }, ref) => {
  const formSchema = createBenefitsSchema(languageIds as string[], activeLanguages)
  const [isLoadingData, setIsLoadingData] = useState(!slug)
  const [dataLoaded, setDataLoaded] = useState(!slug)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [benefitCountMismatch, setBenefitCountMismatch] = useState(false)
  const [existingSubSectionId, setExistingSubSectionId] = useState<string | null>(null)
  const [contentElements, setContentElements] = useState<any[]>([])
  const { toast } = useToast()

  // Get default language code for form values
  const defaultLangCode = activeLanguages.length > 0 ? activeLanguages[0].languageID : "en"

  const form = useForm<z.infer<SchemaType>>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(languageIds as string[], activeLanguages),
  })

  // Expose form data to parent component
  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      const isValid = await form.trigger()
      if (!isValid) {
        throw new Error("Benefits form has validation errors")
      }
      return form.getValues()
    },
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

  // Check if all languages have the same number of benefits
  const validateBenefitCounts = () => {
    const values = form.getValues()
    const counts = Object.values(values).map((langBenefits) => (Array.isArray(langBenefits) ? langBenefits.length : 0))

    // Check if all counts are the same
    const allEqual = counts.every((count) => count === counts[0])
    setBenefitCountMismatch(!allEqual)

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

        // Group content elements by benefit number
        const benefitGroups: Record<number, any[]> = {}

        subsectionData.contentElements.forEach((element: any) => {
          // Extract benefit number from element name (e.g., "Benefit 1 - Title")
          const match = element.name.match(/Benefit (\d+)/i)
          if (match) {
            const benefitNumber = Number.parseInt(match[1])
            if (!benefitGroups[benefitNumber]) {
              benefitGroups[benefitNumber] = []
            }
            benefitGroups[benefitNumber].push(element)
          }
        })

        // Initialize form values for each language
        const languageValues: Record<string, any[]> = {}

        // Initialize all languages with empty arrays
        languageIds.forEach((langId) => {
          const langCode = langIdToCodeMap[langId] || langId
          languageValues[langCode] = []
        })

        // Process each benefit group
        Object.entries(benefitGroups).forEach(([benefitNumber, elements]) => {
          const iconElement = elements.find((el) => el.name.includes("Icon"))
          const titleElement = elements.find((el) => el.name.includes("Title"))
          const descriptionElement = elements.find((el) => el.name.includes("Description"))

          if (titleElement && descriptionElement) {
            // For each language, create a benefit entry
            languageIds.forEach((langId) => {
              const langCode = langIdToCodeMap[langId] || langId

              // Find translations for this language
              const titleTranslation = titleElement.translations?.find(
                (t: any) => t.language === langId || t.language?._id === langId,
              )

              const descriptionTranslation = descriptionElement.translations?.find(
                (t: any) => t.language === langId || t.language?._id === langId,
              )

              // Use translation content or default content
              const title = titleTranslation?.content || titleElement.defaultContent || ""
              const description = descriptionTranslation?.content || descriptionElement.defaultContent || ""

              // Get icon value
              const icon = iconElement?.defaultContent || "Clock"

              // Add to language values
              if (!languageValues[langCode]) {
                languageValues[langCode] = []
              }

              languageValues[langCode].push({ icon, title, description })
            })
          }
        })

        // Set all values in form
        Object.entries(languageValues).forEach(([langCode, benefits]) => {
          if (benefits.length > 0) {
            form.setValue(langCode as any, benefits as any)
          }
        })
      }

      setDataLoaded(true)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Error processing benefits data:", error)
      toast({
        title: "Error loading benefits data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // Effect to populate form with existing data from complete subsection
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
      validateBenefitCounts()
      if (onDataChangeRef.current) {
        onDataChangeRef.current(value)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, isLoadingData, dataLoaded])

  // Function to add a new benefit
  const addBenefit = (langCode: string) => {
    const currentBenefits = form.getValues()[langCode] || []
    form.setValue(langCode as any, [
      ...currentBenefits,
      {
        icon: "Clock",
        title: "",
        description: "",
      },
    ])
  }

  // Function to remove a benefit
  const removeBenefit = (langCode: string, index: number) => {
    const currentBenefits = form.getValues()[langCode] || []
    if (currentBenefits.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one benefit",
        variant: "destructive",
      })
      return
    }

    // If we have existing content elements and a subsection ID, delete the elements from the database
    if (existingSubSectionId && contentElements.length > 0) {
      try {
        // Find the benefit number (1-based index)
        const benefitNumber = index + 1

        // Find elements associated with this benefit
        const benefitElements = contentElements.filter((element) => {
          const match = element.name.match(/Benefit (\d+)/i)
          return match && Number.parseInt(match[1]) === benefitNumber
        })

        if (benefitElements.length > 0) {
          // Delete each element
          benefitElements.forEach(async (element) => {
            try {
              await deleteContentElement.mutateAsync(element._id)
              console.log(`Deleted content element: ${element.name}`)
            } catch (error) {
              console.error(`Failed to delete content element ${element.name}:`, error)
            }
          })

          // Update the contentElements state to remove the deleted elements
          setContentElements((prev) =>
            prev.filter((element) => {
              const match = element.name.match(/Benefit (\d+)/i)
              return !(match && Number.parseInt(match[1]) === benefitNumber)
            }),
          )

          toast({
            title: "Benefit deleted",
            description: `Benefit ${benefitNumber} has been deleted from the database`,
          })
        }

        // Renumber the remaining benefit elements in the database
        const remainingElements = contentElements.filter((element) => {
          const match = element.name.match(/Benefit (\d+)/i)
          return match && Number.parseInt(match[1]) > benefitNumber
        })

        // Update the names and orders of the remaining elements
        remainingElements.forEach(async (element) => {
          const match = element.name.match(/Benefit (\d+)/i)
          if (match) {
            const oldNumber = Number.parseInt(match[1])
            const newNumber = oldNumber - 1
            const newName = element.name.replace(`Benefit ${oldNumber}`, `Benefit ${newNumber}`)
            const newOrder = element.order - 3 // Assuming icon, title, and description are consecutive

            try {
              await updateContentElement.mutateAsync({
                id: element._id,
                data: {
                  name: newName,
                  order: newOrder,
                },
              })
              console.log(`Updated element ${element.name} to ${newName}`)
            } catch (error) {
              console.error(`Failed to update element ${element.name}:`, error)
            }
          }
        })
      } catch (error) {
        console.error("Error removing benefit elements:", error)
        toast({
          title: "Error removing benefit",
          description: "There was an error removing the benefit from the database",
          variant: "destructive",
        })
      }
    }

    // Update the form state
    const updatedBenefits = [...currentBenefits]
    updatedBenefits.splice(index, 1)
    form.setValue(langCode as any, updatedBenefits)
  }

  // Function to get benefit counts by language
  const getBenefitCountsByLanguage = () => {
    const values = form.getValues()
    return Object.entries(values).map(([langCode, benefits]) => ({
      language: langCode,
      count: Array.isArray(benefits) ? benefits.length : 0,
    }))
  }

  const handleSave = async () => {
    const isValid = await form.trigger()
    const hasEqualBenefitCounts = validateBenefitCounts()

    if (!hasEqualBenefitCounts) {
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
          name: "Benefits Section",
          slug: slug || `benefits-section-${Date.now()}`, // Use provided slug or generate one
          description: "Benefits section for the website",
          isActive: true,
          order: 0,
          sectionItem: ParentSectionId,
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

      // Get the maximum number of benefits across all languages
      const maxBenefitCount = Math.max(
        ...Object.values(allFormValues).map((langBenefits) => (Array.isArray(langBenefits) ? langBenefits.length : 0)),
      )

      if (existingSubSectionId && contentElements.length > 0) {
        // Update existing elements
        // Group content elements by benefit number
        const benefitGroups: Record<number, any[]> = {}

        contentElements.forEach((element: any) => {
          // Extract benefit number from element name (e.g., "Benefit 1 - Title")
          const match = element.name.match(/Benefit (\d+)/i)
          if (match) {
            const benefitNumber = Number.parseInt(match[1])
            if (!benefitGroups[benefitNumber]) {
              benefitGroups[benefitNumber] = []
            }
            benefitGroups[benefitNumber].push(element)
          }
        })

        // Prepare translations for bulk upsert
        const translations: Omit<ContentTranslation, "_id">[] = []

        // Process each language's benefits
        Object.entries(allFormValues).forEach(([langCode, langBenefits]) => {
          if (!Array.isArray(langBenefits)) return

          const langId = langCodeToIdMap[langCode]
          if (!langId) return

          // Process each benefit in this language
          langBenefits.forEach((benefit, index) => {
            const benefitNumber = index + 1
            const benefitElements = benefitGroups[benefitNumber]

            if (benefitElements) {
              const iconElement = benefitElements.find((el) => el.name.includes("Icon"))
              const titleElement = benefitElements.find((el) => el.name.includes("Title"))
              const descriptionElement = benefitElements.find((el) => el.name.includes("Description"))

              // Update icon if it exists
              if (iconElement && benefit.icon) {
                updateContentElement.mutate({
                  _id: iconElement._id,
                  defaultContent: benefit.icon,
                })
              }

              if (titleElement && benefit.title) {
                translations.push({
                  content: benefit.title,
                  language: langId,
                  contentElement: titleElement._id,
                  isActive: true,
                })
              }

              if (descriptionElement && benefit.description) {
                translations.push({
                  content: benefit.description,
                  language: langId,
                  contentElement: descriptionElement._id,
                  isActive: true,
                })
              }
            }
          })
        })

        // Create new elements for benefits that don't exist yet
        const existingBenefitCount = Object.keys(benefitGroups).length

        if (maxBenefitCount > existingBenefitCount) {
          // Create new elements for additional benefits
          for (let benefitNumber = existingBenefitCount + 1; benefitNumber <= maxBenefitCount; benefitNumber++) {
            // Get default content from the first language that has this benefit
            let defaultIcon = "Clock"
            let defaultTitle = ""
            let defaultDescription = ""

            // Find the first language that has this benefit
            for (const [langCode, langBenefits] of Object.entries(allFormValues)) {
              if (Array.isArray(langBenefits) && langBenefits.length >= benefitNumber) {
                const benefit = langBenefits[benefitNumber - 1]
                if (benefit) {
                  defaultIcon = benefit.icon
                  defaultTitle = benefit.title
                  defaultDescription = benefit.description
                  break
                }
              }
            }

            // Create icon element
            const iconElement = await createContentElement.mutateAsync({
              name: `Benefit ${benefitNumber} - Icon`,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: (benefitNumber - 1) * 3,
              defaultContent: defaultIcon,
            })

            // Create title element
            const titleElement = await createContentElement.mutateAsync({
              name: `Benefit ${benefitNumber} - Title`,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: (benefitNumber - 1) * 3 + 1,
              defaultContent: defaultTitle,
            })

            // Create description element
            const descriptionElement = await createContentElement.mutateAsync({
              name: `Benefit ${benefitNumber} - Description`,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: (benefitNumber - 1) * 3 + 2,
              defaultContent: defaultDescription,
            })

            // Add translations for new elements
            Object.entries(allFormValues).forEach(([langCode, langBenefits]) => {
              if (!Array.isArray(langBenefits) || langBenefits.length < benefitNumber) return

              const langId = langCodeToIdMap[langCode]
              if (!langId) return

              const benefit = langBenefits[benefitNumber - 1]

              if (benefit) {
                if (benefit.title) {
                  translations.push({
                    content: benefit.title,
                    language: langId,
                    contentElement: titleElement.data._id,
                    isActive: true,
                  })
                }

                if (benefit.description) {
                  translations.push({
                    content: benefit.description,
                    language: langId,
                    contentElement: descriptionElement.data._id,
                    isActive: true,
                  })
                }
              }
            })
          }
        }

        // Update translations
        if (translations.length > 0) {
          await bulkUpsertTranslations.mutateAsync(translations)
        }
      } else {
        // Create new elements for each benefit
        const translations: Omit<ContentTranslation, "_id">[] = []

        // Get the first language's benefits to determine how many to create
        const firstLangBenefits = Object.values(allFormValues)[0]
        const benefitCount = Array.isArray(firstLangBenefits) ? firstLangBenefits.length : 0

        // Create elements for each benefit
        for (let benefitIndex = 0; benefitIndex < benefitCount; benefitIndex++) {
          const benefitNumber = benefitIndex + 1

          // Get default content from the first language
          const firstLangCode = Object.keys(allFormValues)[0]
          const firstLangBenefits = allFormValues[firstLangCode]
          const defaultIcon =
            Array.isArray(firstLangBenefits) && firstLangBenefits[benefitIndex]
              ? firstLangBenefits[benefitIndex].icon
              : "Clock"
          const defaultTitle =
            Array.isArray(firstLangBenefits) && firstLangBenefits[benefitIndex]
              ? firstLangBenefits[benefitIndex].title
              : ""
          const defaultDescription =
            Array.isArray(firstLangBenefits) && firstLangBenefits[benefitIndex]
              ? firstLangBenefits[benefitIndex].description
              : ""

          // Create icon element
          const iconElement = await createContentElement.mutateAsync({
            name: `Benefit ${benefitNumber} - Icon`,
            type: "text",
            parent: sectionId,
            isActive: true,
            order: benefitIndex * 3,
            defaultContent: defaultIcon,
          })

          // Create title element
          const titleElement = await createContentElement.mutateAsync({
            name: `Benefit ${benefitNumber} - Title`,
            type: "text",
            parent: sectionId,
            isActive: true,
            order: benefitIndex * 3 + 1,
            defaultContent: defaultTitle,
          })

          // Create description element
          const descriptionElement = await createContentElement.mutateAsync({
            name: `Benefit ${benefitNumber} - Description`,
            type: "text",
            parent: sectionId,
            isActive: true,
            order: benefitIndex * 3 + 2,
            defaultContent: defaultDescription,
          })

          // Create translations for each language
          Object.entries(allFormValues).forEach(([langCode, langBenefits]) => {
            if (!Array.isArray(langBenefits) || langBenefits.length <= benefitIndex) return

            const langId = langCodeToIdMap[langCode]
            if (!langId) return

            const benefit = langBenefits[benefitIndex]

            if (benefit) {
              if (benefit.title) {
                translations.push({
                  content: benefit.title,
                  language: langId,
                  contentElement: titleElement.data._id,
                  isActive: true,
                })
              }

              if (benefit.description) {
                translations.push({
                  content: benefit.description,
                  language: langId,
                  contentElement: descriptionElement.data._id,
                  isActive: true,
                })
              }
            }
          })
        }

        // Create translations
        if (translations.length > 0) {
          await bulkUpsertTranslations.mutateAsync(translations)
        }
      }

      toast({
        title: existingSubSectionId
          ? "Benefits section updated successfully!"
          : "Benefits section created successfully!",
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
    } catch (error) {
      console.error("Operation failed:", error)
      toast({
        title: existingSubSectionId ? "Error updating benefits section" : "Error creating benefits section",
        variant: "destructive",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // Get language codes for display
  const languageCodes = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {slug && (isLoadingData || isLoadingSubsection) && !dataLoaded ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading benefits section data...</p>
        </div>
      ) : (
        <Form {...form}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {languageIds.map((langId) => {
              const langCode = languageCodes[langId] || langId
              return (
                <Card key={langId} className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
                        {langCode}
                      </span>
                      Benefits Section
                    </CardTitle>
                    <CardDescription>Manage benefits content for {langCode.toUpperCase()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {form.watch(langCode as any)?.map((_, index) => (
                      <Card key={index} className="border border-muted">
                        <CardHeader className="p-4 flex flex-row items-center justify-between">
                          <CardTitle className="text-base">Benefit {index + 1}</CardTitle>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeBenefit(langCode, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                          <FormField
                            control={form.control}
                            name={`${langCode}.${index}.icon` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an icon" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableIcons.map((icon) => (
                                      <SelectItem key={icon} value={icon}>
                                        {icon}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                                  <Input placeholder="Enter title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`${langCode}.${index}.description` as any}
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

                    <Button type="button" variant="outline" size="sm" onClick={() => addBenefit(langCode)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Benefit
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </Form>
      )}
      <div className="flex justify-end mt-6">
        {benefitCountMismatch && (
          <div className="flex items-center text-amber-500 mr-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm">Each language must have the same number of benefits</span>
          </div>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoadingData || benefitCountMismatch}
          className="flex items-center"
        >
          <Save className="mr-2 h-4 w-4" />
          {createSubSection.isPending ? "Saving..." : existingSubSectionId ? "Update Benefits" : "Save Benefits"}
        </Button>
      </div>

      {/* Validation Dialog */}
      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benefit Count Mismatch</DialogTitle>
            <DialogDescription>
              <div className="mt-4 mb-4">
                Each language must have the same number of benefits before saving. Please add or remove benefits to
                ensure all languages have the same count:
              </div>
              <ul className="list-disc pl-6 space-y-1">
                {getBenefitCountsByLanguage().map(({ language, count }) => (
                  <li key={language}>
                    <span className="font-semibold uppercase">{language}</span>: {count} benefits
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

BenefitsForm.displayName = "BenefitsForm"

export default BenefitsForm
