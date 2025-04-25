"use client"

import { forwardRef, useImperativeHandle, useEffect, useState } from "react"
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
import { toast } from "@/src/components/ui/use-toast"
import { Plus, Trash2, X, Save, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { Label } from "@/src/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"

interface FeaturesFormProps {
  languages: readonly string[]
  onDataChange?: (data: any) => void
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
const createFeaturesSchema = (languages: readonly string[]) => {
  const languageFields: Record<string, any> = {}

  languages.forEach((lang) => {
    languageFields[lang] = z
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

  return z.object(languageFields)
}

// Helper type to infer the schema type
type FeaturesSchemaType = ReturnType<typeof createFeaturesSchema>

const FeaturesForm = forwardRef<any, FeaturesFormProps>(({ languages, onDataChange }, ref) => {
  const featuresSchema = createFeaturesSchema(languages)

  // Create default values for the form
  const createDefaultValues = (languages: readonly string[]) => {
    const defaultValues: Record<string, Feature[]> = {}

    languages.forEach((lang) => {
      defaultValues[lang] = [
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

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false)
  const [featureCountMismatch, setFeatureCountMismatch] = useState(false)

  const form = useForm<z.infer<FeaturesSchemaType>>({
    resolver: zodResolver(featuresSchema),
    defaultValues: createDefaultValues(languages),
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
    form: form,
    hasUnsavedChanges,
    resetUnsavedChanges: () => setHasUnsavedChanges(false),
  }))

  // Check if all languages have the same number of features
  const validateFeatureCounts = () => {
    const values = form.getValues()
    const counts = languages.map(lang => values[lang]?.length || 0)
    
    // Check if all counts are the same
    const allEqual = counts.every(count => count === counts[0])
    setFeatureCountMismatch(!allEqual)
    
    return allEqual
  }

  // Update parent component with form data on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setHasUnsavedChanges(true)
      validateFeatureCounts()
      if (onDataChange) {
        onDataChange(value)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, onDataChange])

  const handleSave = async () => {
    const isValid = await form.trigger()
    const hasEqualFeatureCounts = validateFeatureCounts()

    if (!hasEqualFeatureCounts) {
      setIsValidationDialogOpen(true)
      return
    }

    if (isValid) {
      // Here you would typically save to an API
      toast({
        title: "Features content saved",
        description: "Your features content has been saved successfully.",
      })

      // Get the form values
      const formData = form.getValues()

      // Convert the form data to an array format
      const featuresArray = Object.entries(formData).flatMap(([language, features]) => {
        return features.map((feature: Feature) => ({
          language,
          id: feature.id,
          title: feature.title,
          content: {
            heading: feature.content.heading,
            description: feature.content.description,
            features: feature.content.features,
            image: feature.content.image,
            imageAlt: feature.content.imageAlt,
            imagePosition: feature.content.imagePosition,
          },
        }))
      })

      // Log the array to console
      console.log("Features data as array:", featuresArray)

      setHasUnsavedChanges(false)
    }
  }

  // Function to add a new feature
  const addFeature = (lang: string) => {
    const currentFeatures = form.getValues()[lang] || []
    const newIndex = currentFeatures.length + 1
    form.setValue(lang as any, [
      ...currentFeatures,
      {
        id: `feature-${newIndex}`,
        title: "",
        content: {
          heading: "",
          description: "",
          features: [""],
          image: "",
          imageAlt: "",
          imagePosition: "right" as const,
        },
      },
    ])
  }

  // Function to remove a feature
  const removeFeature = (lang: string, index: number) => {
    const currentFeatures = form.getValues()[lang] || []
    if (currentFeatures.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one feature",
        variant: "destructive",
      })
      return
    }

    const updatedFeatures = [...currentFeatures]
    updatedFeatures.splice(index, 1)
    form.setValue(lang as any, updatedFeatures)
  }

  // Function to add a new feature item
  const addFeatureItem = (lang: string, featureIndex: number) => {
    const currentFeatures = form.getValues()[lang] || []
    const currentFeature = currentFeatures[featureIndex]
    const updatedFeatures = [...currentFeatures]

    updatedFeatures[featureIndex] = {
      ...currentFeature,
      content: {
        ...currentFeature.content,
        features: [...currentFeature.content.features, ""],
      },
    }

    form.setValue(lang as any, updatedFeatures)
  }

  // Function to remove a feature item
  const removeFeatureItem = (lang: string, featureIndex: number, itemIndex: number) => {
    const currentFeatures = form.getValues()[lang] || []
    const currentFeature = currentFeatures[featureIndex]

    if (currentFeature.content.features.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one feature item",
        variant: "destructive",
      })
      return
    }

    const updatedFeatures = [...currentFeatures]
    const updatedFeatureItems = [...currentFeature.content.features]
    updatedFeatureItems.splice(itemIndex, 1)

    updatedFeatures[featureIndex] = {
      ...currentFeature,
      content: {
        ...currentFeature.content,
        features: updatedFeatureItems,
      },
    }

    form.setValue(lang as any, updatedFeatures)
  }

  // Function to get feature counts by language
  const getFeatureCountsByLanguage = () => {
    const values = form.getValues()
    return languages.map(lang => ({
      language: lang,
      count: values[lang]?.length || 0
    }))
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <div className="grid grid-cols-1 gap-6">
          {languages.map((lang) => (
            <Card key={lang} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
                    {lang}
                  </span>
                  Features Section
                </CardTitle>
                <CardDescription>Manage features content for {lang.toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  {form.watch(lang as any)?.map((feature: Feature, index: number) => (
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
                            removeFeature(lang, index)
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
                                name={`${lang}.${index}.id` as any}
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
                                name={`${lang}.${index}.title` as any}
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
                              name={`${lang}.${index}.content.heading` as any}
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
                              name={`${lang}.${index}.content.description` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Feature description" className="min-h-[100px]" {...field} />
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
                                  onClick={() => addFeatureItem(lang, index)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Feature
                                </Button>
                              </div>

                              {feature.content.features.map((featureItem: string, featureItemIndex: number) => (
                                <FormField
                                  key={featureItemIndex}
                                  control={form.control}
                                  name={`${lang}.${index}.content.features.${featureItemIndex}` as any}
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
                                        onClick={() => removeFeatureItem(lang, index, featureItemIndex)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`${lang}.${index}.content.image` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Feature Image</FormLabel>
                                    <FormControl>
                                      {/* <ImageUpload value={field.value} onChange={field.onChange} /> */}
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`${lang}.${index}.content.imageAlt` as any}
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
                            </div>

                            <FormField
                              control={form.control}
                              name={`${lang}.${index}.content.imagePosition` as any}
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

                <Button type="button" variant="outline" size="sm" onClick={() => addFeature(lang)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Feature
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Form>
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
          disabled={!hasUnsavedChanges || featureCountMismatch} 
          className="flex items-center"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Features Content
        </Button>
      </div>

      {/* Validation Dialog */}
      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Count Mismatch</DialogTitle>
            <DialogDescription>
              <div className="mt-4 mb-4">
                Each language must have the same number of features before saving. Please add or remove features to ensure all languages have the same count:
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