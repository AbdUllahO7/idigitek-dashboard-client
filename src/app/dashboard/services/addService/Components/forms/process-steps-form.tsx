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
import { ProcessStepsFormProps } from "@/src/api/types/sectionsTypes"


// Available icons
const availableIcons = [
  "Car",
  "MonitorSmartphone",
  "Settings",
  "CreditCard",
  "Clock",
  "MessageSquare",
  "LineChart",
  "Headphones",
]

// Create a dynamic schema based on available languages
const createProcessStepsSchema = (languageIds: string[], activeLanguages: Language[]) => {
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
      .min(1, { message: "At least one process step is required" })
  })

  return z.object(schemaShape)
}

type SchemaType = ReturnType<typeof createProcessStepsSchema>

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
        icon: "Car",
        title: "",
        description: "",
      },
    ]
  })

  return defaultValues
}

const ProcessStepsForm = forwardRef<any, ProcessStepsFormProps>(
  ({ languageIds, activeLanguages, onDataChange, slug , ParentSectionId}, ref) => {
    const formSchema = createProcessStepsSchema(languageIds as string[], activeLanguages)
    const [isLoadingData, setIsLoadingData] = useState(!slug)
    const [dataLoaded, setDataLoaded] = useState(!slug)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
    const [stepCountMismatch, setStepCountMismatch] = useState(false)
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
          throw new Error("Process steps form has validation errors")
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

    // Check if all languages have the same number of steps
    const validateStepCounts = () => {
      const values = form.getValues()
      const counts = Object.values(values).map((langSteps) => (Array.isArray(langSteps) ? langSteps.length : 0))

      // Check if all counts are the same
      const allEqual = counts.every((count) => count === counts[0])
      setStepCountMismatch(!allEqual)

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

          // Group content elements by step number
          const stepGroups: Record<number, any[]> = {}

          subsectionData.contentElements.forEach((element: any) => {
            // Extract step number from element name (e.g., "Step 1 - Title")
            const match = element.name.match(/Step (\d+)/i)
            if (match) {
              const stepNumber = Number.parseInt(match[1])
              if (!stepGroups[stepNumber]) {
                stepGroups[stepNumber] = []
              }
              stepGroups[stepNumber].push(element)
            }
          })

          // Initialize form values for each language
          const languageValues: Record<string, any[]> = {}

          // Initialize all languages with empty arrays
          languageIds.forEach((langId) => {
            const langCode = langIdToCodeMap[langId] || langId
            languageValues[langCode] = []
          })

          // Process each step group
          Object.entries(stepGroups).forEach(([stepNumber, elements]) => {
            const iconElement = elements.find((el) => el.name.includes("Icon"))
            const titleElement = elements.find((el) => el.name.includes("Title"))
            const descriptionElement = elements.find((el) => el.name.includes("Description"))

            if (titleElement && descriptionElement) {
              // For each language, create a step entry
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
                const icon = iconElement?.defaultContent || "Car"

                // Add to language values
                if (!languageValues[langCode]) {
                  languageValues[langCode] = []
                }

                languageValues[langCode].push({ icon, title, description })
              })
            }
          })

          // Set all values in form
          Object.entries(languageValues).forEach(([langCode, steps]) => {
            if (steps.length > 0) {
              form.setValue(langCode as any, steps as any)
            }
          })
        }

        setDataLoaded(true)
        setHasUnsavedChanges(false)
      } catch (error) {
        console.error("Error processing process steps data:", error)
        toast({
          title: "Error loading process steps data",
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
        validateStepCounts()
        if (onDataChangeRef.current) {
          onDataChangeRef.current(value)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, isLoadingData, dataLoaded])

    // Function to add a new process step
    const addProcessStep = (langCode: string) => {
      const currentSteps = form.getValues()[langCode] || []
      form.setValue(langCode, [
        ...currentSteps,
        {
          icon: "Car",
          title: "",
          description: "",
        },
      ])
    }

    // Function to remove a process step
    const removeProcessStep = (langCode: string, index: number) => {
      const currentSteps = form.getValues()[langCode] || []
      if (currentSteps.length <= 1) {
        toast({
          title: "Cannot remove",
          description: "You need at least one process step",
          variant: "destructive",
        })
        return
      }

      // If we have existing content elements and a subsection ID, delete the elements from the database
      if (existingSubSectionId && contentElements.length > 0) {
        try {
          // Find the step number (1-based index)
          const stepNumber = index + 1

          // Find elements associated with this step
          const stepElements = contentElements.filter((element) => {
            const match = element.name.match(/Step (\d+)/i)
            return match && Number.parseInt(match[1]) === stepNumber
          })

          if (stepElements.length > 0) {
            // Delete each element
            stepElements.forEach(async (element) => {
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
                const match = element.name.match(/Step (\d+)/i)
                return !(match && Number.parseInt(match[1]) === stepNumber)
              }),
            )

            toast({
              title: "Step deleted",
              description: `Step ${stepNumber} has been deleted from the database`,
            })
          }

          // Renumber the remaining step elements in the database
          const remainingElements = contentElements.filter((element) => {
            const match = element.name.match(/Step (\d+)/i)
            return match && Number.parseInt(match[1]) > stepNumber
          })

          // Update the names and orders of the remaining elements
          remainingElements.forEach(async (element) => {
            const match = element.name.match(/Step (\d+)/i)
            if (match) {
              const oldNumber = Number.parseInt(match[1])
              const newNumber = oldNumber - 1
              const newName = element.name.replace(`Step ${oldNumber}`, `Step ${newNumber}`)
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
          console.error("Error removing process step elements:", error)
          toast({
            title: "Error removing step",
            description: "There was an error removing the step from the database",
            variant: "destructive",
          })
        }
      }

      // Update the form state
      const updatedSteps = [...currentSteps]
      updatedSteps.splice(index, 1)
      form.setValue(langCode, updatedSteps)
    }

    // Function to get step counts by language
    const getStepCountsByLanguage = () => {
      const values = form.getValues()
      return Object.entries(values).map(([langCode, steps]) => ({
        language: langCode,
        count: Array.isArray(steps) ? steps.length : 0,
      }))
    }

    const handleSave = async () => {
      const isValid = await form.trigger()
      const hasEqualStepCounts = validateStepCounts()

      if (!hasEqualStepCounts) {
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
            name: "Process Steps Section",
            slug: slug || `process-steps-section-${Date.now()}`, // Use provided slug or generate one
            description: "Process steps section for the website",
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

        // Get the maximum number of steps across all languages
        const maxStepCount = Math.max(
          ...Object.values(allFormValues).map((langSteps) => (Array.isArray(langSteps) ? langSteps.length : 0)),
        )

        if (existingSubSectionId && contentElements.length > 0) {
          // Update existing elements
          // Group content elements by step number
          const stepGroups: Record<number, any[]> = {}

          contentElements.forEach((element: any) => {
            // Extract step number from element name (e.g., "Step 1 - Title")
            const match = element.name.match(/Step (\d+)/i)
            if (match) {
              const stepNumber = Number.parseInt(match[1])
              if (!stepGroups[stepNumber]) {
                stepGroups[stepNumber] = []
              }
              stepGroups[stepNumber].push(element)
            }
          })

          // Prepare translations for bulk upsert
          const translations: Omit<ContentTranslation, "_id">[] = []

          // Process each language's steps
          Object.entries(allFormValues).forEach(([langCode, langSteps]) => {
            if (!Array.isArray(langSteps)) return

            const langId = langCodeToIdMap[langCode]
            if (!langId) return

            // Process each step in this language
            langSteps.forEach((step, index) => {
              const stepNumber = index + 1
              const stepElements = stepGroups[stepNumber]

              if (stepElements) {
                const iconElement = stepElements.find((el) => el.name.includes("Icon"))
                const titleElement = stepElements.find((el) => el.name.includes("Title"))
                const descriptionElement = stepElements.find((el) => el.name.includes("Description"))

                // Update icon if it exists
                if (iconElement && step.icon) {
                  updateContentElement.mutate({
                    _id: iconElement._id,
                    defaultContent: step.icon,
                  })
                }

                if (titleElement && step.title) {
                  translations.push({
                    content: step.title,
                    language: langId,
                    contentElement: titleElement._id,
                    isActive: true,
                  })
                }

                if (descriptionElement && step.description) {
                  translations.push({
                    content: step.description,
                    language: langId,
                    contentElement: descriptionElement._id,
                    isActive: true,
                  })
                }
              }
            })
          })

          // Create new elements for steps that don't exist yet
          const existingStepCount = Object.keys(stepGroups).length

          if (maxStepCount > existingStepCount) {
            // Create new elements for additional steps
            for (let stepNumber = existingStepCount + 1; stepNumber <= maxStepCount; stepNumber++) {
              // Get default content from the first language that has this step
              let defaultIcon = "Car"
              let defaultTitle = ""
              let defaultDescription = ""

              // Find the first language that has this step
              for (const [langCode, langSteps] of Object.entries(allFormValues)) {
                if (Array.isArray(langSteps) && langSteps.length >= stepNumber) {
                  const step = langSteps[stepNumber - 1]
                  if (step) {
                    defaultIcon = step.icon
                    defaultTitle = step.title
                    defaultDescription = step.description
                    break
                  }
                }
              }

              // Create icon element
              const iconElement = await createContentElement.mutateAsync({
                name: `Step ${stepNumber} - Icon`,
                type: "text",
                parent: sectionId,
                isActive: true,
                order: (stepNumber - 1) * 3,
                defaultContent: defaultIcon,
              })

              // Create title element
              const titleElement = await createContentElement.mutateAsync({
                name: `Step ${stepNumber} - Title`,
                type: "text",
                parent: sectionId,
                isActive: true,
                order: (stepNumber - 1) * 3 + 1,
                defaultContent: defaultTitle,
              })

              // Create description element
              const descriptionElement = await createContentElement.mutateAsync({
                name: `Step ${stepNumber} - Description`,
                type: "text",
                parent: sectionId,
                isActive: true,
                order: (stepNumber - 1) * 3 + 2,
                defaultContent: defaultDescription,
              })

              // Add translations for new elements
              Object.entries(allFormValues).forEach(([langCode, langSteps]) => {
                if (!Array.isArray(langSteps) || langSteps.length < stepNumber) return

                const langId = langCodeToIdMap[langCode]
                if (!langId) return

                const step = langSteps[stepNumber - 1]

                if (step) {
                  if (step.title) {
                    translations.push({
                      content: step.title,
                      language: langId,
                      contentElement: titleElement.data._id,
                      isActive: true,
                    })
                  }

                  if (step.description) {
                    translations.push({
                      content: step.description,
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
          // Create new elements for each step
          const translations: Omit<ContentTranslation, "_id">[] = []

          // Get the first language's steps to determine how many to create
          const firstLangSteps = Object.values(allFormValues)[0]
          const stepCount = Array.isArray(firstLangSteps) ? firstLangSteps.length : 0

          // Create elements for each step
          for (let stepIndex = 0; stepIndex < stepCount; stepIndex++) {
            const stepNumber = stepIndex + 1

            // Get default content from the first language
            const firstLangCode = Object.keys(allFormValues)[0]
            const firstLangSteps = allFormValues[firstLangCode]
            const defaultIcon =
              Array.isArray(firstLangSteps) && firstLangSteps[stepIndex] ? firstLangSteps[stepIndex].icon : "Car"
            const defaultTitle =
              Array.isArray(firstLangSteps) && firstLangSteps[stepIndex] ? firstLangSteps[stepIndex].title : ""
            const defaultDescription =
              Array.isArray(firstLangSteps) && firstLangSteps[stepIndex] ? firstLangSteps[stepIndex].description : ""

            // Create icon element
            const iconElement = await createContentElement.mutateAsync({
              name: `Step ${stepNumber} - Icon`,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: stepIndex * 3,
              defaultContent: defaultIcon,
            })

            // Create title element
            const titleElement = await createContentElement.mutateAsync({
              name: `Step ${stepNumber} - Title`,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: stepIndex * 3 + 1,
              defaultContent: defaultTitle,
            })

            // Create description element
            const descriptionElement = await createContentElement.mutateAsync({
              name: `Step ${stepNumber} - Description`,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: stepIndex * 3 + 2,
              defaultContent: defaultDescription,
            })

            // Create translations for each language
            Object.entries(allFormValues).forEach(([langCode, langSteps]) => {
              if (!Array.isArray(langSteps) || langSteps.length <= stepIndex) return

              const langId = langCodeToIdMap[langCode]
              if (!langId) return

              const step = langSteps[stepIndex]

              if (step) {
                if (step.title) {
                  translations.push({
                    content: step.title,
                    language: langId,
                    contentElement: titleElement.data._id,
                    isActive: true,
                  })
                }

                if (step.description) {
                  translations.push({
                    content: step.description,
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
          title: existingSubSectionId ? "Process steps updated successfully!" : "Process steps created successfully!",
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
          title: existingSubSectionId ? "Error updating process steps" : "Error creating process steps",
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
            <p className="text-muted-foreground">Loading process steps data...</p>
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
                        Process Steps Section
                      </CardTitle>
                      <CardDescription>Manage process steps content for {langCode.toUpperCase()}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {form.watch(langCode)?.map((_, index) => (
                        <Card key={index} className="border border-muted">
                          <CardHeader className="p-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Step {index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeProcessStep(langCode, index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-4">
                            <FormField
                              control={form.control}
                              name={`${langCode}.${index}.icon`}
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
                              name={`${langCode}.${index}.title`}
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
                              name={`${langCode}.${index}.description`}
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

                      <Button type="button" variant="outline" size="sm" onClick={() => addProcessStep(langCode)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Process Step
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </Form>
        )}
        <div className="flex justify-end mt-6">
          {stepCountMismatch && (
            <div className="flex items-center text-amber-500 mr-4">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm">Each language must have the same number of steps</span>
            </div>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoadingData || stepCountMismatch}
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            {createSubSection.isPending
              ? "Saving..."
              : existingSubSectionId
                ? "Update Process Steps"
                : "Save Process Steps"}
          </Button>
        </div>

        {/* Validation Dialog */}
        <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Step Count Mismatch</DialogTitle>
              <DialogDescription>
                <div className="mt-4 mb-4">
                  Each language must have the same number of process steps before saving. Please add or remove steps to
                  ensure all languages have the same count:
                </div>
                <ul className="list-disc pl-6 space-y-1">
                  {getStepCountsByLanguage().map(({ language, count }) => (
                    <li key={language}>
                      <span className="font-semibold uppercase">{language}</span>: {count} steps
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
  },
)

ProcessStepsForm.displayName = "ProcessStepsForm"

export default ProcessStepsForm
