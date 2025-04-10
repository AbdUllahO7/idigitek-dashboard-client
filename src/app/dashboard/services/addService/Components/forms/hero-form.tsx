"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { ImageUpload } from "@/src/lib/ImageUploder"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface HeroFormProps {
  languages: readonly string[]
}

const createHeroSchema = (languages: readonly string[]) => {
  const languageFields: Record<string, any> = {}

  languages.forEach((lang) => {
    languageFields[lang] = z.object({
      title: z.string().min(1, { message: "Title is required" }),
      description: z.string().min(1, { message: "Description is required" }),
      backLinkText: z.string().min(1, { message: "Back link text is required" }),
    })
  })

  return z.object({
    backgroundImage: z.string().min(1, { message: "Background image is required" }),
    ...languageFields,
  })
}

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

export const HeroForm = ({ languages }: HeroFormProps) => {
  const formSchema = createHeroSchema(languages)
  const defaultValues = createDefaultValues(languages)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  })

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
                    <FormLabel>Background Image</FormLabel>
                    <FormControl>
                      <ImageUpload value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>Upload an image for the hero background</FormDescription>
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
                <FormField
                  control={form.control}
                  name={`${lang}.title`}
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
                  name={`${lang}.description`}
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
                  name={`${lang}.backLinkText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Get Started"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          disabled={field.disabled}
                          name={field.name}
                        />
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
    </div>
  )
}
