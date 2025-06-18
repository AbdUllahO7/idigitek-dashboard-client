// src/app/dashboard/heroSection/NavigationCard.tsx

"use client"

import { useState, useEffect } from "react"
import { Navigation, Save, Loader2, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-content-elements"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-content-translations"
import { useLanguages } from "@/src/hooks/webConfiguration/use-language"
import { useWebsiteContext } from "@/src/providers/WebsiteContext"
import { useToast } from "@/src/hooks/use-toast"
import { useTranslation } from "react-i18next"

interface NavigationCardProps {
  sectionId: string; // Hero section ID
}

// Schema for navigation form
const navigationSchema = z.object({
  en: z.object({
    name: z.string().min(1, "Navigation name is required"),
  }),
  ar: z.object({
    name: z.string().min(1, "Navigation name is required"),
  }),
  tr: z.object({
    name: z.string().min(1, "Navigation name is required"),
  }),
  urlType: z.enum(["default", "custom"]),
  customUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
})

type NavigationFormData = z.infer<typeof navigationSchema>

export default function NavigationCard({ sectionId }: NavigationCardProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { websiteId } = useWebsiteContext()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasNavigation, setHasNavigation] = useState(false)
  const [navigationItem, setNavigationItem] = useState<any>(null)

  // API hooks
  const { useGetBySectionId, useCreate: useCreateSectionItem, useUpdate: useUpdateSectionItem } = useSectionItems()
  const { useCreate: useCreateSubSection } = useSubSections()
  const { useCreate: useCreateContentElement } = useContentElements()
  const { useBulkUpsert: useBulkUpsertTranslations } = useContentTranslations()
  const { useGetByWebsite: useGetLanguages } = useLanguages()

  // Get languages and navigation data
  const { data: languagesData } = useGetLanguages(websiteId)
  const { data: navigationData, isLoading: isLoadingNav, refetch } = useGetBySectionId(sectionId)
  
  const createSectionItem = useCreateSectionItem()
  const updateSectionItem = useUpdateSectionItem()
  const createSubSection = useCreateSubSection()
  const createContentElement = useCreateContentElement()
  const bulkUpsertTranslations = useBulkUpsertTranslations()

  const activeLanguages = languagesData?.data?.filter((lang: any) => lang.isActive) || []

  // Form setup
  const form = useForm<NavigationFormData>({
    resolver: zodResolver(navigationSchema),
    defaultValues: {
      en: { name: "" },
      ar: { name: "" },
      tr: { name: "" },
      urlType: "default",
      customUrl: "",
    },
  })

  const watchUrlType = form.watch("urlType")

  // Load existing navigation data
  useEffect(() => {
    if (navigationData?.data) {
      const navItems = Array.isArray(navigationData.data) ? navigationData.data : [navigationData.data]
      if (navItems.length > 0) {
        const navItem = navItems[0] // Get first (and only) navigation item
        setNavigationItem(navItem)
        setHasNavigation(true)
        
        // TODO: Load navigation data into form
        // This would require fetching the subsection and content elements
        // For now, we'll leave the form empty and let user edit
      }
    }
    setIsLoading(isLoadingNav)
  }, [navigationData, isLoadingNav])

  // Handle form submission
  const onSubmit = async (data: NavigationFormData) => {
    setIsSaving(true)
    
    try {
      let navItemId = navigationItem?._id

      // Create navigation item if it doesn't exist
      if (!hasNavigation) {
        const navigationPayload = {
          name: data.en.name, // Use English name as main name
          description: "Navigation item for hero section",
          isActive: true,
          section: sectionId
        }
        
        const newNavItem = await createSectionItem.mutateAsync(navigationPayload)
        navItemId = newNavItem.data._id
        setNavigationItem(newNavItem.data)
        setHasNavigation(true)
      }

      // Create subsection for navigation content
      const subsectionData = {
        name: "Navigation Section",
        slug: `navigation-section-${navItemId}`,
        description: "Navigation section for managing navigation content",
        defaultContent: "",
        isActive: true,
        order: 0,
        sectionItem: navItemId,
        languages: activeLanguages.map((lang: any) => lang._id),
        WebSiteId: websiteId,
      }

      const newSubSection = await createSubSection.mutateAsync(subsectionData)
      const sectionId = newSubSection.data._id

      // Create content elements
      const nameElement = await createContentElement.mutateAsync({
        name: "Navigation Name",
        type: "text",
        parent: sectionId,
        isActive: true,
        order: 0,
        defaultContent: "",
      })

      const urlElement = await createContentElement.mutateAsync({
        name: "Navigation URL",
        type: "text", 
        parent: sectionId,
        isActive: true,
        order: 1,
        defaultContent: "",
      })

      const urlTypeElement = await createContentElement.mutateAsync({
        name: "Navigation URL Type",
        type: "text",
        parent: sectionId,
        isActive: true,
        order: 2,
        defaultContent: "",
      })

      // Create translations
      const translations = []

      // Name translations for all languages
      activeLanguages.forEach((lang: any) => {
        const langCode = lang.languageID
        const nameValue = data[langCode as keyof typeof data]?.name || ""
        
        if (nameValue) {
          translations.push({
            _id: "",
            content: nameValue,
            language: lang._id,
            contentElement: nameElement.data._id,
            isActive: true,
          })
        }
      })

      // URL type (only for primary language)
      const primaryLang = activeLanguages[0]
      translations.push({
        _id: "",
        content: data.urlType,
        language: primaryLang._id,
        contentElement: urlTypeElement.data._id,
        isActive: true,
      })

      // Custom URL (only if custom type and only for primary language)
      if (data.urlType === "custom" && data.customUrl) {
        translations.push({
          _id: "",
          content: data.customUrl,
          language: primaryLang._id,
          contentElement: urlElement.data._id,
          isActive: true,
        })
      }

      // Save translations
      if (translations.length > 0) {
        await bulkUpsertTranslations.mutateAsync(translations)
      }

      toast({
        title: "Navigation Saved",
        description: "Navigation item has been saved successfully.",
      })

      // Refresh data
      refetch()

    } catch (error) {
      console.error("Error saving navigation:", error)
      toast({
        title: "Error Saving Navigation",
        description: "There was an error saving the navigation item.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Navigation Item
          {hasNavigation && (
            <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {hasNavigation 
            ? "Edit your navigation item settings"
            : "Create a navigation item for this hero section"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Navigation Names for each language */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Navigation Names</Label>
              
              {activeLanguages.map((lang: any) => (
                <FormField
                  key={lang._id}
                  control={form.control}
                  name={`${lang.languageID}.name` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span className="uppercase font-bold text-xs bg-primary text-primary-foreground rounded px-2 py-1">
                          {lang.languageID}
                        </span>
                        Navigation Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={`Enter navigation name in ${lang.name}`}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* URL Type Selection */}
            <FormField
              control={form.control}
              name="urlType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="default" />
                        <Label htmlFor="default">Default (use hero section link)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom">Custom URL</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom URL Input - only show if custom is selected */}
            {watchUrlType === "custom" && (
              <FormField
                control={form.control}
                name="customUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com"
                        type="url"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Save Button */}
            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {hasNavigation ? "Update Navigation" : "Create Navigation"}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}