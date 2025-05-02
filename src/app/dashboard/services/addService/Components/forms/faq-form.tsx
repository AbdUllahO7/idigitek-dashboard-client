"use client"

import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Save, Trash2, Plus, AlertTriangle, Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Button } from "@/src/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import { useToast } from "@/src/hooks/use-toast"
import { LoadingDialog } from "./MainSectionComponents"


// Create a dynamic schema based on available languages
const createFaqSchema = (languageIds, activeLanguages) => {
  const schemaShape = {}

  const languageCodeMap = activeLanguages.reduce((acc, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  languageIds.forEach((langId) => {
    const langCode = languageCodeMap[langId] || langId
    schemaShape[langCode] = z
      .array(
        z.object({
          question: z.string().min(1, { message: "Question is required" }),
          answer: z.string().min(1, { message: "Answer is required" }),
        }),
      )
      .min(1, { message: "At least one FAQ is required" })
  })

  return z.object(schemaShape)
}

const createDefaultValues = (languageIds, activeLanguages) => {
  const defaultValues = {}

  const languageCodeMap = activeLanguages.reduce((acc, lang) => {
    acc[lang._id] = lang.languageID
    return acc
  }, {})

  languageIds.forEach((langId) => {
    const langCode = languageCodeMap[langId] || langId
    defaultValues[langCode] = [
      {
        question: "",
        answer: "",
      },
    ]
  })

  return defaultValues
}

const FaqForm = forwardRef(
  ({ languageIds, activeLanguages, onDataChange, slug, ParentSectionId }, ref) => {
    const formSchema = createFaqSchema(languageIds, activeLanguages)
    const [isLoadingData, setIsLoadingData] = useState(!slug)
    const [dataLoaded, setDataLoaded] = useState(!slug)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
    const [faqCountMismatch, setFaqCountMismatch] = useState(false)
    const [existingSubSectionId, setExistingSubSectionId] = useState(null)
    const [contentElements, setContentElements] = useState([])
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    // Get default language code for form values
    const defaultLangCode = activeLanguages.length > 0 ? activeLanguages[0].languageID : "en"

    const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: createDefaultValues(languageIds, activeLanguages),
    })

    // Expose form data to parent component
    useImperativeHandle(ref, () => ({
      getFormData: async () => {
        const isValid = await form.trigger()
        if (!isValid) {
          throw new Error("FAQ form has validation errors")
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
    const bulkUpsertTranslations = useBulkUpsertTranslations()
    const deleteContentElement = useDeleteContentElement()

    // Query for complete subsection data by slug if provided
    const {
      data: completeSubsectionData,
      isLoading: isLoadingSubsection,
      refetch,
    } = useGetCompleteBySlug(slug || "", false)

    // Check if all languages have the same number of FAQs
    const validateFaqCounts = () => {
      const values = form.getValues()
      const counts = Object.values(values).map((langFaqs) => (Array.isArray(langFaqs) ? langFaqs.length : 0))

      // Check if all counts are the same
      const allEqual = counts.every((count) => count === counts[0])
      setFaqCountMismatch(!allEqual)

      return allEqual
    }

    // Function to process and load data into the form
    const processAndLoadData = (subsectionData) => {
      if (!subsectionData) return;

      try {
        console.log("Processing FAQ subsection data:", subsectionData);
        setExistingSubSectionId(subsectionData._id);

        // Check if we have elements directly in the subsection data (API response structure)
        const elements = subsectionData.elements || subsectionData.contentElements || [];
        
        if (elements.length > 0) {
          // Store the content elements for later use
          setContentElements(elements);

          // Create a mapping of languages for easier access
          const langIdToCodeMap = activeLanguages.reduce((acc, lang) => {
            acc[lang._id] = lang.languageID;
            return acc;
          }, {});

          // Group content elements by FAQ number
          const faqGroups = {};

          elements.forEach((element) => {
            // Extract FAQ number from element name (e.g., "FAQ 1 - Question")
            const match = element.name.match(/FAQ (\d+)/i);
            if (match) {
              const faqNumber = Number.parseInt(match[1]);
              if (!faqGroups[faqNumber]) {
                faqGroups[faqNumber] = [];
              }
              faqGroups[faqNumber].push(element);
            }
          });

          console.log("FAQ groups:", faqGroups);

          // Initialize form values for each language
          const languageValues = {};

          // Initialize all languages with empty arrays
          languageIds.forEach((langId) => {
            const langCode = langIdToCodeMap[langId] || langId;
            languageValues[langCode] = [];
          });

          // Process each FAQ group
          Object.entries(faqGroups).forEach(([faqNumber, elements]) => {
            const questionElement = elements.find((el) => el.name.includes("Question"));
            const answerElement = elements.find((el) => el.name.includes("Answer"));

            if (questionElement && answerElement) {
              // For each language, create a FAQ entry
              languageIds.forEach((langId) => {
                const langCode = langIdToCodeMap[langId] || langId;

                // Helper function to get translation content for an element
                const getTranslationContent = (element, defaultValue = "") => {
                  if (!element) return defaultValue;

                  // First check for a translation in this language
                  const translation = element.translations?.find((t) => {
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

                // Get content values with proper translation handling
                const question = getTranslationContent(questionElement, "");
                const answer = getTranslationContent(answerElement, "");

                // Add to language values
                if (!languageValues[langCode]) {
                  languageValues[langCode] = [];
                }

                languageValues[langCode].push({ question, answer });
              });
            }
          });

          console.log("Form values after processing:", languageValues);

          // Set all values in form
          Object.entries(languageValues).forEach(([langCode, faqs]) => {
            if (faqs.length > 0) {
              form.setValue(langCode, faqs);
            } else {
              // Ensure at least one empty FAQ if none were found
              form.setValue(langCode, [
                {
                  question: "",
                  answer: "",
                }
              ]);
            }
          });
        }

        setDataLoaded(true);
        setHasUnsavedChanges(false);
        validateFaqCounts();
      } catch (error) {
        console.error("Error processing FAQ section data:", error);
        toast({
          title: "Error loading FAQ section data",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

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
        validateFaqCounts()
        if (onDataChangeRef.current) {
          onDataChangeRef.current(value)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, isLoadingData, dataLoaded])

    // Function to add a new FAQ
    const addFaq = (langCode) => {
      const currentFaqs = form.getValues()[langCode] || []
      form.setValue(langCode, [
        ...currentFaqs,
        {
          question: "",
          answer: "",
        },
      ])
    }

    // Function to remove a FAQ
    const removeFaq = (langCode, index) => {
      const currentFaqs = form.getValues()[langCode] || []
      if (currentFaqs.length <= 1) {
        toast({
          title: "Cannot remove",
          description: "You need at least one FAQ",
          variant: "destructive",
        })
        return
      }

      // If we have existing content elements and a subsection ID, delete the elements from the database
      if (existingSubSectionId && contentElements.length > 0) {
        try {
          // Find the FAQ number (1-based index)
          const faqNumber = index + 1

          // Find elements associated with this FAQ
          const faqElements = contentElements.filter((element) => {
            const match = element.name.match(/FAQ (\d+)/i)
            return match && Number.parseInt(match[1]) === faqNumber
          })

          if (faqElements.length > 0) {
            // Delete each element
            faqElements.forEach(async (element) => {
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
                const match = element.name.match(/FAQ (\d+)/i)
                return !(match && Number.parseInt(match[1]) === faqNumber)
              }),
            )

            toast({
              title: "FAQ deleted",
              description: `FAQ ${faqNumber} has been deleted from the database`,
            })
          }

          // Renumber the remaining FAQ elements in the database
          const remainingElements = contentElements.filter((element) => {
            const match = element.name.match(/FAQ (\d+)/i)
            return match && Number.parseInt(match[1]) > faqNumber
          })

          // Update the names and orders of the remaining elements
          remainingElements.forEach(async (element) => {
            const match = element.name.match(/FAQ (\d+)/i)
            if (match) {
              const oldNumber = Number.parseInt(match[1])
              const newNumber = oldNumber - 1
              const newName = element.name.replace(`FAQ ${oldNumber}`, `FAQ ${newNumber}`)
              const newOrder = element.order - 2 // Assuming question and answer are consecutive

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
          console.error("Error removing FAQ elements:", error)
          toast({
            title: "Error removing FAQ",
            description: "There was an error removing the FAQ from the database",
            variant: "destructive",
          })
        }
      }

      // Update the form state
      const updatedFaqs = [...currentFaqs]
      updatedFaqs.splice(index, 1)
      form.setValue(langCode, updatedFaqs)
    }

    // Function to get FAQ counts by language
    const getFaqCountsByLanguage = () => {
      const values = form.getValues()
      return Object.entries(values).map(([langCode, faqs]) => ({
        language: langCode,
        count: Array.isArray(faqs) ? faqs.length : 0,
      }))
    }

    const handleSave = async () => {
      const isValid = await form.trigger()
      const hasEqualFaqCounts = validateFaqCounts()

      if (!hasEqualFaqCounts) {
        setIsValidationDialogOpen(true)
        return
      }

      if (!isValid) return

      setIsSaving(true)
      setIsLoadingData(true)
      try {
        // Get current form values before any processing
        const allFormValues = form.getValues()
        console.log("Form values at save:", allFormValues)

        let sectionId = existingSubSectionId

        // Create or update logic here
        if (!existingSubSectionId) {
          // Create new subsection
          const subsectionData = {
            name: "FAQ Section",
            slug: slug || `faq-section`, // Use provided slug or generate one
            description: "FAQ section for the website",
            isActive: true,
            order: 0,
            sectionItem: ParentSectionId,
            languages: languageIds,
          }

          const newSubSection = await createSubSection.mutateAsync(subsectionData)
          sectionId = newSubSection.data._id
        }

        if (!sectionId) {
          throw new Error("Failed to create or retrieve subsection ID")
        }

    
        // Get language code to ID mapping
        const langCodeToIdMap = activeLanguages.reduce((acc, lang) => {
          acc[lang.languageID] = lang._id
          return acc
        }, {})

        // Get the maximum number of FAQs across all languages
        const maxFaqCount = Math.max(
          ...Object.values(allFormValues).map((langFaqs) => (Array.isArray(langFaqs) ? langFaqs.length : 0)),
        )

        if (existingSubSectionId && contentElements.length > 0) {
          // Update existing elements
          // Group content elements by FAQ number
          const faqGroups = {}

          contentElements.forEach((element) => {
            // Extract FAQ number from element name (e.g., "FAQ 1 - Question")
            const match = element.name.match(/FAQ (\d+)/i)
            if (match) {
              const faqNumber = Number.parseInt(match[1])
              if (!faqGroups[faqNumber]) {
                faqGroups[faqNumber] = []
              }
              faqGroups[faqNumber].push(element)
            }
          })

          // Prepare translations for bulk upsert
          const translations = []

          // Process each language's FAQs
          Object.entries(allFormValues).forEach(([langCode, langFaqs]) => {
            if (!Array.isArray(langFaqs)) return

            const langId = langCodeToIdMap[langCode]
            if (!langId) return

            // Process each FAQ in this language
            langFaqs.forEach((faq, index) => {
              const faqNumber = index + 1
              const faqElements = faqGroups[faqNumber]

              if (faqElements) {
                const questionElement = faqElements.find((el) => el.name.includes("Question"))
                const answerElement = faqElements.find((el) => el.name.includes("Answer"))

                if (questionElement && faq.question) {
                  translations.push({
                    content: faq.question,
                    language: langId,
                    contentElement: questionElement._id,
                    isActive: true,
                  })
                }

                if (answerElement && faq.answer) {
                  translations.push({
                    content: faq.answer,
                    language: langId,
                    contentElement: answerElement._id,
                    isActive: true,
                  })
                }
              }
            })
          })

          // Create new elements for FAQs that don't exist yet
          const existingFaqCount = Object.keys(faqGroups).length

          if (maxFaqCount > existingFaqCount) {
            // Create new elements for additional FAQs
            for (let faqNumber = existingFaqCount + 1; faqNumber <= maxFaqCount; faqNumber++) {
              // Get default content from the first language that has this FAQ
              let defaultQuestion = ""
              let defaultAnswer = ""

              // Find the first language that has this FAQ
              for (const [langCode, langFaqs] of Object.entries(allFormValues)) {
                if (Array.isArray(langFaqs) && langFaqs.length >= faqNumber) {
                  const faq = langFaqs[faqNumber - 1]
                  if (faq) {
                    defaultQuestion = faq.question
                    defaultAnswer = faq.answer
                    break
                  }
                }
              }

              // Create question element
              const questionElement = await createContentElement.mutateAsync({
                name: `FAQ ${faqNumber} - Question`,
                type: "text",
                parent: sectionId,
                isActive: true,
                order: (faqNumber - 1) * 2,
                defaultContent: defaultQuestion,
              })

              // Create answer element
              const answerElement = await createContentElement.mutateAsync({
                name: `FAQ ${faqNumber} - Answer`,
                type: "text",
                parent: sectionId,
                isActive: true,
                order: (faqNumber - 1) * 2 + 1,
                defaultContent: defaultAnswer,
              })

              // Add translations for new elements
              Object.entries(allFormValues).forEach(([langCode, langFaqs]) => {
                if (!Array.isArray(langFaqs) || langFaqs.length < faqNumber) return

                const langId = langCodeToIdMap[langCode]
                if (!langId) return

                const faq = langFaqs[faqNumber - 1]

                if (faq) {
                  if (faq.question) {
                    translations.push({
                      content: faq.question,
                      language: langId,
                      contentElement: questionElement.data._id,
                      isActive: true,
                    })
                  }

                  if (faq.answer) {
                    translations.push({
                      content: faq.answer,
                      language: langId,
                      contentElement: answerElement.data._id,
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
          // Create new elements for each FAQ
          const translations = []

          // Get the first language's FAQs to determine how many to create
          const firstLangFaqs = Object.values(allFormValues)[0]
          const faqCount = Array.isArray(firstLangFaqs) ? firstLangFaqs.length : 0

          // Create elements for each FAQ
          for (let faqIndex = 0; faqIndex < faqCount; faqIndex++) {
            const faqNumber = faqIndex + 1

            // Get default content from the first language
            const firstLangCode = Object.keys(allFormValues)[0]
            const firstLangFaqs = allFormValues[firstLangCode]
            const defaultQuestion =
              Array.isArray(firstLangFaqs) && firstLangFaqs[faqIndex] ? firstLangFaqs[faqIndex].question : ""
            const defaultAnswer =
              Array.isArray(firstLangFaqs) && firstLangFaqs[faqIndex] ? firstLangFaqs[faqIndex].answer : ""

            // Create question element
            const questionElement = await createContentElement.mutateAsync({
              name: `FAQ ${faqNumber} - Question`,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: faqIndex * 2,
              defaultContent: defaultQuestion,
            })

            // Create answer element
            const answerElement = await createContentElement.mutateAsync({
              name: `FAQ ${faqNumber} - Answer`,
              type: "text",
              parent: sectionId,
              isActive: true,
              order: faqIndex * 2 + 1,
              defaultContent: defaultAnswer,
            })

            // Create translations for each language
            Object.entries(allFormValues).forEach(([langCode, langFaqs]) => {
              if (!Array.isArray(langFaqs) || langFaqs.length <= faqIndex) return

              const langId = langCodeToIdMap[langCode]
              if (!langId) return

              const faq = langFaqs[faqIndex]

              if (faq) {
                if (faq.question) {
                  translations.push({
                    content: faq.question,
                    language: langId,
                    contentElement: questionElement.data._id,
                    isActive: true,
                  })
                }

                if (faq.answer) {
                  translations.push({
                    content: faq.answer,
                    language: langId,
                    contentElement: answerElement.data._id,
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
          title: existingSubSectionId ? "FAQ section updated successfully!" : "FAQ section created successfully!",
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
          title: existingSubSectionId ? "Error updating FAQ section" : "Error creating FAQ section",
          variant: "destructive",
          description: error instanceof Error ? error.message : "Unknown error occurred",
        })
      } finally {
        setIsLoadingData(false)
        setIsSaving(false)
      }
    }

    // Get language codes for display
    const languageCodes = activeLanguages.reduce((acc, lang) => {
      acc[lang._id] = lang.languageID
      return acc
    }, {})

    return (
      <div className="space-y-6">
        {/* Loading Dialog */}
        <LoadingDialog 
          isOpen={isSaving} 
          title={existingSubSectionId ? "Updating FAQ Section" : "Creating FAQ Section"}
          description="Please wait while we save your changes..."
        />
        
        {slug && (isLoadingData || isLoadingSubsection) && !dataLoaded ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading FAQ section data...</p>
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
                        FAQ Section
                      </CardTitle>
                      <CardDescription>Manage FAQ content for {langCode.toUpperCase()}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Accordion type="single" collapsible className="w-full">
                        {form.watch(langCode)?.map((faq, index) => (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <div className="flex items-center justify-between">
                              <AccordionTrigger className="flex-1">{faq.question || `FAQ ${index + 1}`}</AccordionTrigger>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="mr-4"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFaq(langCode, index)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <AccordionContent>
                              <Card className="border border-muted">
                                <CardContent className="p-4 space-y-4">
                                  <FormField
                                    control={form.control}
                                    name={`${langCode}.${index}.question`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Question</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Enter question" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`${langCode}.${index}.answer`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Answer</FormLabel>
                                        <FormControl>
                                          <Textarea placeholder="Enter answer" className="min-h-[100px]" {...field} />
                                        </FormControl>
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

                      <Button type="button" variant="outline" className="w-full" onClick={() => addFaq(langCode)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add FAQ
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </Form>
        )}
        <div className="flex justify-end mt-6">
          {faqCountMismatch && (
            <div className="flex items-center text-amber-500 mr-4">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm">Each language must have the same number of FAQs</span>
            </div>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoadingData || faqCountMismatch || isSaving}
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
                {existingSubSectionId ? "Update FAQ Content" : "Save FAQ Content"}
              </>
            )}
          </Button>
        </div>

        {/* Validation Dialog */}
        <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>FAQ Count Mismatch</DialogTitle>
              <DialogDescription>
                <div className="mt-4 mb-4">
                  Each language must have the same number of FAQs before saving. Please add or remove FAQs to ensure all
                  languages have the same count:
                </div>
                <ul className="list-disc pl-6 space-y-1">
                  {getFaqCountsByLanguage().map(({ language, count }) => (
                    <li key={language}>
                      <span className="font-semibold uppercase">{language}</span>: {count} FAQs
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
  }
)

FaqForm.displayName = "FaqForm"

export default FaqForm