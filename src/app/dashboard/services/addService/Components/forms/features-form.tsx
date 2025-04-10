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
import { Plus, Trash2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { Label } from "@/src/components/ui/label"
import { ImageUpload } from "@/src/lib/ImageUploder"

interface FeaturesFormProps {
  languages: readonly string[]
  onDataChange?: (data: any) => void
}

// Create a dynamic schema based on available languages
const createFeaturesSchema = (languages: readonly string[]) => {
  const languageFields: Record<string, any> = {}

  // Define feature content schema without the image field
  const featureContentSchema = z.object({
    heading: z.string().min(1, { message: "Heading is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    features: z
      .array(z.string().min(1, { message: "Feature cannot be empty" }))
      .min(1, { message: "At least one feature is required" }),
    imageAlt: z.string().min(1, { message: "Image alt text is required" }),
    imagePosition: z.enum(["left", "right"]),
  })

  languages.forEach((lang) => {
    languageFields[lang] = z
      .array(
        z.object({
          id: z.string().min(1, { message: "ID is required" }),
          title: z.string().min(1, { message: "Title is required" }),
          content: featureContentSchema,
        }),
      )
      .min(1, { message: "At least one feature is required" })
  })

  // Add the shared images object
  languageFields.shared = z.object({
    images: z.record(z.string(), z.string().min(1, { message: "Image is required" }))
  })

  return z.object(languageFields)
}

const FeaturesForm = forwardRef<any, FeaturesFormProps>(({ languages, onDataChange }, ref) => {
  const featuresSchema = createFeaturesSchema(languages)

  // Create default values for the form
  const createDefaultValues = (languages: readonly string[]) => {
    const defaultValues: Record<string, any> = {
      shared: {
        images: {} // Empty images record initially
      }
    }

    languages.forEach((lang) => {
      defaultValues[lang] = [
        {
          id: "feature-1",
          title: "",
          content: {
            heading: "",
            description: "",
            features: [""],
            imageAlt: "",
            imagePosition: "right",
          },
        },
      ]
    })

    return defaultValues
  }

  const form = useForm<z.infer<typeof featuresSchema>>({
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
      
      // Transform data to the expected format with the image field in each feature
      const formData = form.getValues()
      const sharedImages = formData.shared.images
      
      const transformedData: Record<string, any> = {}
      languages.forEach(lang => {
        transformedData[lang] = formData[lang].map(feature => ({
          ...feature,
          content: {
            ...feature.content,
            image: sharedImages[feature.id] || "" // Add the image from shared images
          }
        }))
      })
      
      return transformedData
    },
    form: form,
  }))

  // Update parent component with form data on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (onDataChange) {
        // Transform data before sending to parent
        const sharedImages = value.shared?.images || {}
        
        const transformedData: Record<string, any> = {}
        languages.forEach(lang => {
          const langData = value[lang] || []
          transformedData[lang] = langData.map(feature => {
            if (!feature) return null // Skip if feature is undefined
            return {
              ...feature,
              content: {
                ...feature.content,
                image: sharedImages[feature.id] || "" // Add the image from shared images
              }
            }
          }).filter(Boolean) // Remove any null values
        })
        
        onDataChange(transformedData)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, onDataChange, languages])

  // Function to add a new feature
  const addFeature = (lang: string) => {
    const currentFeatures = form.getValues()[lang] || []
    const newId = `feature-${Date.now()}`
    
    form.setValue(lang, [
      ...currentFeatures,
      {
        id: newId,
        title: "",
        content: {
          heading: "",
          description: "",
          features: [""],
          imageAlt: "",
          imagePosition: "right",
        },
      },
    ])
    
    // Initialize the image for this feature ID
    const currentImages = form.getValues().shared.images
    form.setValue("shared.images", {
      ...currentImages,
      [newId]: ""
    })
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

    const featureId = currentFeatures[index].id
    
    // Remove the feature
    const updatedFeatures = [...currentFeatures]
    updatedFeatures.splice(index, 1)
    form.setValue(lang, updatedFeatures)
    
    // Check if this feature ID is used in other languages
    let isUsedElsewhere = false
    languages.forEach(otherLang => {
      if (otherLang === lang) return // Skip current language
      
      const otherLangFeatures = form.getValues()[otherLang] || []
      if (otherLangFeatures.some(f => f.id === featureId)) {
        isUsedElsewhere = true
      }
    })
    
    // Only remove from shared images if not used elsewhere
    if (!isUsedElsewhere) {
      const currentImages = form.getValues().shared.images
      const { [featureId]: _, ...restImages } = currentImages
      form.setValue("shared.images", restImages)
    }
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

    form.setValue(lang, updatedFeatures)
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

    form.setValue(lang, updatedFeatures)
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
                  {form.watch(lang)?.map((feature, index) => (
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
                                name={`${lang}.${index}.id`}
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
                                name={`${lang}.${index}.title`}
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
                              name={`${lang}.${index}.content.heading`}
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
                              name={`${lang}.${index}.content.description`}
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

                              {feature.content.features.map((_, featureItemIndex) => (
                                <FormField
                                  key={featureItemIndex}
                                  control={form.control}
                                  name={`${lang}.${index}.content.features.${featureItemIndex}`}
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
                                name={`shared.images.${feature.id}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Feature Image</FormLabel>
                                    <FormControl>
                                      <ImageUpload value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormDescription>This image will be used across all languages</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid gap-4">
                                <FormField
                                  control={form.control}
                                  name={`${lang}.${index}.content.imageAlt`}
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
                                  name={`${lang}.${index}.content.imagePosition`}
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
                              </div>
                            </div>
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
    </div>
  )
})

FeaturesForm.displayName = "FeaturesForm"

export default FeaturesForm