"use client"

import { forwardRef, useImperativeHandle, useEffect, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"

interface BenefitsFormProps {
  languages: readonly string[]
  onDataChange?: (data: any) => void
}

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
const createBenefitsSchema = (languages: readonly string[]) => {
  const languageFields: Record<string, any> = {}

  languages.forEach((lang) => {
    languageFields[lang] = z
      .array(
        z.object({
          icon: z.string().min(1, { message: "Icon is required" }),
          title: z.string().min(1, { message: "Title is required" }),
          description: z.string().min(1, { message: "Description is required" }),
        }),
      )
      .min(1, { message: "At least one benefit is required" })
  })

  return z.object(languageFields)
}

const BenefitsForm = forwardRef<any, BenefitsFormProps>(({ languages, onDataChange }, ref) => {
  const benefitsSchema = createBenefitsSchema(languages)

  // Create default values for the form
  const createDefaultValues = (languages: readonly string[]) => {
    const defaultValues: Record<string, any> = {}

    languages.forEach((lang) => {
      defaultValues[lang] = [
        {
          icon: "Clock",
          title: "",
          description: "",
        },
      ]
    })

    return defaultValues
  }

  const form = useForm<z.infer<typeof benefitsSchema>>({
    resolver: zodResolver(benefitsSchema),
    defaultValues: createDefaultValues(languages),
  })

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [benefitCountMismatch, setBenefitCountMismatch] = useState(false)

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
  }))

  // Check if all languages have the same number of benefits
  const validateBenefitCounts = () => {
    const values = form.getValues()
    const counts = languages.map(lang => values[lang]?.length || 0)
    
    // Check if all counts are the same
    const allEqual = counts.every(count => count === counts[0])
    setBenefitCountMismatch(!allEqual)
    
    return allEqual
  }

  // Update parent component with form data on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setHasUnsavedChanges(true)
      validateBenefitCounts()
      if (onDataChange) {
        onDataChange(value)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, onDataChange])

  const handleSave = async () => {
    const isValid = await form.trigger()
    const hasEqualBenefitCounts = validateBenefitCounts()

    if (!hasEqualBenefitCounts) {
      setIsValidationDialogOpen(true)
      return
    }

    if (isValid) {
      // Here you would typically save to an API
      toast({
        title: "Benefits content saved",
        description: "Your benefits content has been saved successfully.",
      })

      // Get the form values
      const formData = form.getValues()

      // Convert the form data to an array format
      const benefitsArray = Object.entries(formData).flatMap(([language, benefits]) => {
        return benefits.map((benefit: any) => ({
          language,
          ...benefit,
        }))
      })

      // Log the array to console
      console.log("Benefits data as array:", benefitsArray)

      setHasUnsavedChanges(false)
    }
  }

  // Function to add a new benefit
  const addBenefit = (lang: string) => {
    const currentBenefits = form.getValues()[lang] || []
    form.setValue(lang, [
      ...currentBenefits,
      {
        icon: "Clock",
        title: "",
        description: "",
      },
    ])
  }

  // Function to remove a benefit
  const removeBenefit = (lang: string, index: number) => {
    const currentBenefits = form.getValues()[lang] || []
    if (currentBenefits.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one benefit",
        variant: "destructive",
      })
      return
    }

    const updatedBenefits = [...currentBenefits]
    updatedBenefits.splice(index, 1)
    form.setValue(lang, updatedBenefits)
  }

  // Function to get benefit counts by language
  const getBenefitCountsByLanguage = () => {
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
                  Benefits Section
                </CardTitle>
                <CardDescription>Manage benefits content for {lang.toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.watch(lang)?.map((_, index) => (
                  <Card key={index} className="border border-muted">
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Benefit {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeBenefit(lang, index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      <FormField
                        control={form.control}
                        name={`${lang}.${index}.icon`}
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
                        name={`${lang}.${index}.title`}
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
                        name={`${lang}.${index}.description`}
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

                <Button type="button" variant="outline" size="sm" onClick={() => addBenefit(lang)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Benefit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Form>
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
          disabled={!hasUnsavedChanges || benefitCountMismatch} 
          className="flex items-center"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Benefits Content
        </Button>
      </div>

      {/* Validation Dialog */}
      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benefit Count Mismatch</DialogTitle>
            <DialogDescription>
              <div className="mt-4 mb-4">
                Each language must have the same number of benefits before saving. Please add or remove benefits to ensure all languages have the same count:
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