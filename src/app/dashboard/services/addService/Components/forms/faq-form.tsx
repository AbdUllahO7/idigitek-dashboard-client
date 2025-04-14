"use client"

import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { toast } from "@/src/components/ui/use-toast"
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"

interface FaqFormProps {
  languages: readonly string[]
  onDataChange?: (data: any) => void
}

// Create a dynamic schema based on available languages
const createFaqSchema = (languages: readonly string[]) => {
  const languageFields: Record<string, any> = {}

  languages.forEach((lang) => {
    languageFields[lang] = z
      .array(
        z.object({
          question: z.string().min(1, { message: "Question is required" }),
          answer: z.string().min(1, { message: "Answer is required" }),
        }),
      )
      .min(1, { message: "At least one FAQ is required" })
  })

  return z.object(languageFields)
}

const FaqForm = forwardRef<any, FaqFormProps>(({ languages, onDataChange }, ref) => {
  const faqSchema = createFaqSchema(languages)

  // Create default values for the form
  const createDefaultValues = (languages: readonly string[]) => {
    const defaultValues: Record<string, any> = {}

    languages.forEach((lang) => {
      defaultValues[lang] = [
        {
          question: "",
          answer: "",
        },
      ]
    })

    return defaultValues
  }

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [faqCountMismatch, setFaqCountMismatch] = useState(false)

  const form = useForm<z.infer<typeof faqSchema>>({
    resolver: zodResolver(faqSchema),
    defaultValues: createDefaultValues(languages),
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
  }))

  // Check if all languages have the same number of FAQs
  const validateFaqCounts = () => {
    const values = form.getValues()
    const counts = languages.map(lang => values[lang]?.length || 0)
    
    // Check if all counts are the same
    const allEqual = counts.every(count => count === counts[0])
    setFaqCountMismatch(!allEqual)
    
    return allEqual
  }

  // Update parent component with form data on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setHasUnsavedChanges(true)
      validateFaqCounts()
      if (onDataChange) {
        onDataChange(value)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, onDataChange])

  const handleSave = async () => {
    const isValid = await form.trigger()
    const hasEqualFaqCounts = validateFaqCounts()

    if (!hasEqualFaqCounts) {
      setIsValidationDialogOpen(true)
      return
    }

    if (isValid) {
      // Here you would typically save to an API
      toast({
        title: "FAQ content saved",
        description: "Your FAQ content has been saved successfully.",
      })

      // Get the form values
      const formData = form.getValues()

      // Convert the form data to an array format
      const faqArray = Object.entries(formData).flatMap(([language, faqs]) => {
        return faqs.map((faq: any, index: number) => ({
          language,
          faqNumber: index + 1,
          question: faq.question,
          answer: faq.answer,
        }))
      })

      // Log the array to console
      console.log("FAQ data as array:", faqArray)

      setHasUnsavedChanges(false)
    }
  }

  // Function to add a new FAQ
  const addFaq = (lang: string) => {
    const currentFaqs = form.getValues()[lang] || []
    form.setValue(lang, [
      ...currentFaqs,
      {
        question: "",
        answer: "",
      },
    ])
  }

  // Function to remove a FAQ
  const removeFaq = (lang: string, index: number) => {
    const currentFaqs = form.getValues()[lang] || []
    if (currentFaqs.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one FAQ",
        variant: "destructive",
      })
      return
    }

    const updatedFaqs = [...currentFaqs]
    updatedFaqs.splice(index, 1)
    form.setValue(lang, updatedFaqs)
  }

  // Function to get FAQ counts by language
  const getFaqCountsByLanguage = () => {
    const values = form.getValues()
    return languages.map(lang => ({
      language: lang,
      count: values[lang]?.length || 0
    }))
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {languages.map((lang) => (
            <Card key={lang} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
                    {lang}
                  </span>
                  FAQ Section
                </CardTitle>
                <CardDescription>Manage FAQ content for {lang.toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  {form.watch(lang)?.map((faq, index) => (
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
                            removeFaq(lang, index)
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
                              name={`${lang}.${index}.question`}
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
                              name={`${lang}.${index}.answer`}
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

                <Button type="button" variant="outline" size="sm" onClick={() => addFaq(lang)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add FAQ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Form>
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
          disabled={!hasUnsavedChanges || faqCountMismatch} 
          className="flex items-center"
        >
          <Save className="mr-2 h-4 w-4" />
          Save FAQ Content
        </Button>
      </div>

      {/* Validation Dialog */}
      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>FAQ Count Mismatch</DialogTitle>
            <DialogDescription>
              <div className="mt-4 mb-4">
                Each language must have the same number of FAQs before saving. Please add or remove FAQs to ensure all languages have the same count:
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
})

FaqForm.displayName = "FaqForm"

export default FaqForm