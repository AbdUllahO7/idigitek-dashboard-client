"use client"

import { forwardRef, useImperativeHandle, useEffect, useState } from "react"
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



interface HeroFormProps {
  languages: readonly string[]
  onDataChange?: (data: any) => void
}

// Define a type-safe schema for the form
const createHeroSchema = (languages: readonly string[]) => {
  // Create a record of language fields
  const schemaShape: Record<string, any> = {
    backgroundImage: z.string().min(1, { message: "Background image is required" }),
  }

  // Add language-specific fields
  languages.forEach((lang) => {
    schemaShape[lang] = z.object({
      title: z.string().min(1, { message: "Title is required" }),
      description: z.string().min(1, { message: "Description is required" }),
      backLinkText: z.string().min(1, { message: "Back link text is required" }),
    })
  })

  return z.object(schemaShape)
}

// Helper type to infer the schema type
type SchemaType = ReturnType<typeof createHeroSchema>

const createDefaultValues = (languages: readonly string[]) => {
  const defaultValues: Record<string, any> = {
    backgroundImage: "",
  }

  languages.forEach((lang) => {
    defaultValues[lang] = {
      title: "",
      description: "",
      backLinkText: "",
    }
  })

  return defaultValues
}

const HeroForm = forwardRef<any, HeroFormProps>(({ languages, onDataChange }, ref) => {
  const formSchema = createHeroSchema(languages)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Use explicit typing for the form
  const form = useForm<z.infer<SchemaType>>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(languages),
  })

  // Expose form data to parent component
  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      const isValid = await form.trigger()
      if (!isValid) {
        throw new Error("Hero form has validation errors")
      }
      return form.getValues()
    },
    getImageFile: () => imageFile,
    form: form,
    hasUnsavedChanges,
    resetUnsavedChanges: () => setHasUnsavedChanges(false),
  }))

  // Update parent component with form data on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setHasUnsavedChanges(true)
      if (onDataChange) {
        onDataChange(value)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, onDataChange])

  const handleSave = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      try {
        // Prepare form data for submission
        const formData = new FormData()

        // Add the image file if it exists
        if (imageFile) {
          formData.append("backgroundImage", imageFile)
        }

        // Add the form values as JSON
        const formValues = form.getValues()
        formData.append("data", JSON.stringify(formValues))

        // Log the FormData (for demonstration)
        console.log("Form data ready for submission:", {
          imageFile: imageFile,
          formValues: formValues,
        })

        // Here you would typically send the formData to your backend
        // const response = await fetch('/api/hero', {
        //   method: 'POST',
        //   body: formData,
        // })

        toast({
          title: "Hero content ready",
          description: "Your hero content is ready to be sent to the backend.",
        })

        setHasUnsavedChanges(false)
      } catch (error) {
        console.error("Error preparing form data:", error)
        toast({
          title: "Error",
          description: "There was an error preparing your data.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-6">
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
          {languages.map((lang) => (
            <Card key={lang} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
                    {lang}
                  </span>
                  Hero Section
                </CardTitle>
                <CardDescription>Manage hero content for {lang.toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Use type assertion to handle dynamic field paths */}
                <FormField
                  control={form.control}
                  name={`${lang}.title` as any}
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
                  name={`${lang}.description` as any}
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
                  name={`${lang}.backLinkText` as any}
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
          ))}
        </div>
      </Form>
      <div className="flex justify-end mt-6">
        <Button type="button" onClick={handleSave} disabled={!hasUnsavedChanges} className="flex items-center">
          <Save className="mr-2 h-4 w-4" />
          Save Hero Content
        </Button>
      </div>
    </div>
  )
})

HeroForm.displayName = "HeroForm"

export default HeroForm
