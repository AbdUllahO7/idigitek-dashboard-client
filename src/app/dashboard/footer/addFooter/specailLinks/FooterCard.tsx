"use client"

import type React from "react"

import { memo, useState } from "react"
import { Trash2, Plus, ChevronDown, ChevronUp, GripVertical, ExternalLink, Lock, Globe, Link } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { Button } from "@/src/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { LabeledImageUploader, useImageUpload } from "../../../services/addService/Utils/Image-uploader"
import { cn } from "@/src/lib/utils"
import { useTranslation } from "react-i18next"
import { useSections } from "@/src/hooks/webConfiguration/use-section"
import { useWebsiteContext } from "@/src/providers/WebsiteContext"

interface FooterCardProps {
  langCode: string
  index: number
  form: any
  isFirstLanguage: boolean
  onDelete: (langCode: string, index: number) => void
  FooterImageUploader?: React.ComponentType<any>
  SocialLinkImageUploader?: React.ComponentType<any>
}

export const FooterCard = memo(
  ({
    langCode,
    index,
    form,
    isFirstLanguage,
    onDelete,
    FooterImageUploader,
    SocialLinkImageUploader,
  }: FooterCardProps) => {
    const { imageFile, imagePreview, handleImageUpload, handleImageRemove } = useImageUpload({
      form,
      fieldPath: `${langCode}.${index}.image`,
      validate: (file) => {
        if (file.size > 2 * 1024 * 1024) {
          return "Image must be less than 2MB"
        }
        return true
      },
    })

    const { t } = useTranslation()
    const { websiteId } = useWebsiteContext()
    
    // Get sections for the website
    const { useGetByWebsiteId } = useSections()
    const { data: sectionsData } = useGetByWebsiteId(websiteId, false, true)
    const sections = sectionsData?.data || []

    // Safe function to get section name
    const getSafeSectionName = (section: any): string => {
      // Priority order: displayName -> subName -> name[en] -> _id
      if (section.displayName && typeof section.displayName === 'string') {
        return section.displayName;
      }
      
      if (section.subName && typeof section.subName === 'string') {
        return section.subName;
      }
      
      // If name is an object, try to get current language
      if (section.name && typeof section.name === 'object') {
        // Try common language codes
        const langCodes = [langCode, 'en', 'ar', 'tr'];
        for (const code of langCodes) {
          if (section.name[code] && typeof section.name[code] === 'string') {
            return section.name[code];
          }
        }
      }
      
      // Last fallback
      return section._id || 'Unknown Section';
    };

    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isSocialLinksExpanded, setIsSocialLinksExpanded] = useState(true)

    const handleDelete = () => onDelete(langCode, index)

    const currentSocialLinks = form.watch(`${langCode}.${index}.socialLinks`) || []
    const currentTitle = form.watch(`${langCode}.${index}.title`) || ""

    const addSocialLink = () => {
      const currentSocialLinks = form.getValues(`${langCode}.${index}.socialLinks`) || []
      const newSocialLink = { 
        id: `social-${Date.now()}`,
        image: "", 
        linkType: "custom" as const, 
        url: "", 
        sectionId: "", 
        linkName: "" 
      }

      // Add to current language
      form.setValue(`${langCode}.${index}.socialLinks`, [...currentSocialLinks, newSocialLink], {
        shouldDirty: true,
        shouldValidate: true,
      })

      // If this is the first language, sync structure to all other languages
      if (isFirstLanguage) {
        const allValues = form.getValues()
        Object.keys(allValues).forEach((otherLangCode) => {
          if (otherLangCode !== langCode) {
            const otherSocialLinks = form.getValues(`${otherLangCode}.${index}.socialLinks`) || []
            form.setValue(
              `${otherLangCode}.${index}.socialLinks`,
              [
                ...otherSocialLinks,
                {
                  id: `social-${Date.now()}`,
                  image: "", // Will be synced when user uploads in first language
                  linkType: "custom" as const, // Will be synced when user selects type in first language
                  url: "", // Will be synced when user enters URL in first language
                  sectionId: "", // Will be synced when user selects section in first language
                  linkName: "", // Each language will have its own linkName
                },
              ],
              { shouldDirty: true, shouldValidate: true },
            )
          }
        })
      }
    }

    const removeSocialLink = (socialLinkIndex: number) => {
      const currentSocialLinks = form.getValues(`${langCode}.${index}.socialLinks`) || []
      const updatedSocialLinks = currentSocialLinks.filter((_: any, i: number) => i !== socialLinkIndex)

      // Remove from current language
      form.setValue(`${langCode}.${index}.socialLinks`, updatedSocialLinks, {
        shouldDirty: true,
        shouldValidate: true,
      })

      // If this is the first language, sync removal to all other languages
      if (isFirstLanguage) {
        const allValues = form.getValues()
        Object.keys(allValues).forEach((otherLangCode) => {
          if (otherLangCode !== langCode) {
            const otherSocialLinks = form.getValues(`${otherLangCode}.${index}.socialLinks`) || []
            const otherUpdatedSocialLinks = otherSocialLinks.filter((_: any, i: number) => i !== socialLinkIndex)
            form.setValue(`${otherLangCode}.${index}.socialLinks`, otherUpdatedSocialLinks, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        })
      }
    }

    // Handle link type change - sync across all languages
    const handleLinkTypeChange = (socialLinkIndex: number, newType: string) => {
      if (isFirstLanguage) {
        const allValues = form.getValues()
        Object.keys(allValues).forEach((langCode) => {
          if (allValues[langCode] && allValues[langCode][index] && allValues[langCode][index].socialLinks[socialLinkIndex]) {
            form.setValue(`${langCode}.${index}.socialLinks.${socialLinkIndex}.linkType`, newType, {
              shouldDirty: true,
              shouldValidate: true,
            })
            // Clear the other field when switching types
            if (newType === "custom") {
              form.setValue(`${langCode}.${index}.socialLinks.${socialLinkIndex}.sectionId`, "", {
                shouldDirty: true,
                shouldValidate: true,
              })
            } else {
              form.setValue(`${langCode}.${index}.socialLinks.${socialLinkIndex}.url`, "", {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          }
        })
      }
    }

    return (
      <Card className="">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isFirstLanguage ? "bg-slate-100 text-slate-700" : "bg-gray-100 text-gray-700",
                  )}
                >
                  {index + 1}
                </div>
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {t("specialLinks.card.title", { number: index + 1 })}
                  {!isFirstLanguage && <Globe className="h-4 w-4 text-blue-500" />}
                </CardTitle>
                {currentTitle && (
                  <CardDescription className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {currentTitle.substring(0, 80)}
                    {currentTitle.length > 80 ? "..." : ""}
                  </CardDescription>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs">
                  {currentSocialLinks.length > 0 && (
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-blue-500" />
                      <span className="text-blue-600">
                        {t("specialLinks.card.socialLinksCount", { count: currentSocialLinks.length })}
                      </span>
                    </div>
                  )}
                  {!isFirstLanguage && (
                    <span className="text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full text-xs">
                      {t("specialLinks.card.translationMode")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>

              {isFirstLanguage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isCollapsed ? "max-h-0 p-0" : "max-h-none p-4 pt-0",
          )}
        >
          <div className="space-y-6">
            {/* Title Field */}
            <FormField
              control={form.control}
              name={`${langCode}.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {t("specialLinks.card.footerTitle.label")}
                    {!isFirstLanguage && (
                      <span className="text-amber-600 ml-1">
                        {t("specialLinks.card.footerTitle.translate")}
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("specialLinks.card.footerTitle.placeholder")}
                      className="min-h-[100px] hover:border-primary transition-colors focus:ring-2 focus:ring-primary/20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Social Links Section */}
            {currentSocialLinks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium">{t("specialLinks.card.socialLinks.title")}</h4>
                    {!isFirstLanguage ? (
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                        {t("specialLinks.card.socialLinks.translateNames")}
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                        {t("specialLinks.card.socialLinks.primaryControl")}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSocialLinksExpanded(!isSocialLinksExpanded)}
                    className="h-8 px-3"
                  >
                    <span className="text-xs mr-1">
                      {isSocialLinksExpanded 
                        ? t("specialLinks.card.socialLinks.buttons.collapse") 
                        : t("specialLinks.card.socialLinks.buttons.expand")
                      }
                    </span>
                    {isSocialLinksExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>

                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    isSocialLinksExpanded ? "max-h-none" : "max-h-0",
                  )}
                >
                  <div className="space-y-4">
                    {currentSocialLinks.map((_: any, socialLinkIndex: number) => {
                      const currentLinkType = form.watch(`${langCode}.${index}.socialLinks.${socialLinkIndex}.linkType`) || "custom"
                      
                      return (
                        <Card
                          key={`${langCode}-${index}-social-${socialLinkIndex}`}
                          className=""
                        >
                          <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    isFirstLanguage ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700",
                                  )}
                                >
                                  {socialLinkIndex + 1}
                                </div>
                                <h5 className="text-sm font-medium">
                                  {t("specialLinks.card.socialLinks.titleWithNumber", { number: socialLinkIndex + 1 })}
                                </h5>
                                {!isFirstLanguage && <Lock className="h-3 w-3 text-amber-600" />}
                              </div>
                              {isFirstLanguage && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSocialLink(socialLinkIndex)}
                                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                           

                            {/* Link Type Selection - Only for first language */}
                            {isFirstLanguage && (
                              <FormField
                                control={form.control}
                                name={`${langCode}.${index}.socialLinks.${socialLinkIndex}.linkType`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">Link Type</FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={(value) => {
                                          field.onChange(value)
                                          handleLinkTypeChange(socialLinkIndex, value)
                                        }}
                                        value={field.value}
                                        className="flex flex-row space-x-6"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="custom" id={`custom-${socialLinkIndex}`} />
                                          <label htmlFor={`custom-${socialLinkIndex}`} className="text-sm cursor-pointer">
                                            Custom URL
                                          </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="section" id={`section-${socialLinkIndex}`} />
                                          <label htmlFor={`section-${socialLinkIndex}`} className="text-sm cursor-pointer">
                                            Website Section
                                          </label>
                                        </div>
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                              {/* LinkName field - EDITABLE for ALL languages */}
                              <FormField
                                control={form.control}
                                name={`${langCode}.${index}.socialLinks.${socialLinkIndex}.linkName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                      {t("specialLinks.card.socialLinks.linkName.label")}
                                      {!isFirstLanguage && (
                                        <span className="text-amber-600 ml-1">
                                          {t("specialLinks.card.socialLinks.linkName.translate")}
                                        </span>
                                      )}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t("specialLinks.card.socialLinks.linkName.placeholder")}
                                        className="h-10 hover:border-primary transition-colors"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Conditional URL or Section field */}
                              {currentLinkType === "custom" ? (
                                <FormField
                                  control={form.control}
                                  name={`${langCode}.${index}.socialLinks.${socialLinkIndex}.url`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm font-medium flex items-center gap-1">
                                        Custom URL
                                        {!isFirstLanguage && (
                                          <Lock className="h-3 w-3 text-amber-600" />
                                        )}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="https://example.com"
                                          className={cn(
                                            "h-10 transition-colors",
                                            isFirstLanguage ? "hover:border-primary" : "bg-gray-100 cursor-not-allowed",
                                          )}
                                          value={field.value || ""}
                                          disabled={!isFirstLanguage}
                                          onChange={(e) => {
                                            // Always update the current field first
                                            field.onChange(e.target.value)
                                            
                                            // Then sync to other languages if this is the first language
                                            if (isFirstLanguage) {
                                              const allValues = form.getValues()
                                              Object.keys(allValues).forEach((otherLangCode) => {
                                                if (otherLangCode !== langCode && allValues[otherLangCode] && allValues[otherLangCode][index] && allValues[otherLangCode][index].socialLinks[socialLinkIndex]) {
                                                  form.setValue(`${otherLangCode}.${index}.socialLinks.${socialLinkIndex}.url`, e.target.value, {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                  })
                                                }
                                              })
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ) : (
                                <FormField
                                  control={form.control}
                                  name={`${langCode}.${index}.socialLinks.${socialLinkIndex}.sectionId`}
                                  render={({ field }) => {
                                    // Use form.watch to make this reactive to changes
                                    const currentValue = form.watch(`${langCode}.${index}.socialLinks.${socialLinkIndex}.sectionId`) || "";
                                    const selectedSection = sections.find(s => s._id === currentValue);
                                    
                                    // Debug logging
                                    console.log('Rendering sectionId field:', {
                                      fieldPath: `${langCode}.${index}.socialLinks.${socialLinkIndex}.sectionId`,
                                      currentValue,
                                      selectedSection: selectedSection ? getSafeSectionName(selectedSection) : 'None',
                                      fieldValue: field.value
                                    });
                                    
                                    return (
                                      <FormItem>
                                        <FormLabel className="text-sm font-medium flex items-center gap-1">
                                          Website Section
                                          {!isFirstLanguage && (
                                            <Lock className="h-3 w-3 text-amber-600" />
                                          )}
                                        </FormLabel>
                                        <FormControl>
                                          <Select
                                            onValueChange={(value) => {
                                              console.log('Select onValueChange - value:', value);
                                              
                                              // Always update the current field first
                                              field.onChange(value);
                                              
                                              // Force form to recognize the change
                                              form.setValue(`${langCode}.${index}.socialLinks.${socialLinkIndex}.sectionId`, value, {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                                shouldTouch: true,
                                              });
                                              
                                              // Then sync to other languages if this is the first language
                                              if (isFirstLanguage) {
                                                const allValues = form.getValues();
                                                Object.keys(allValues).forEach((otherLangCode) => {
                                                  if (otherLangCode !== langCode && allValues[otherLangCode] && allValues[otherLangCode][index] && allValues[otherLangCode][index].socialLinks[socialLinkIndex]) {
                                                    form.setValue(`${otherLangCode}.${index}.socialLinks.${socialLinkIndex}.sectionId`, value, {
                                                      shouldDirty: true,
                                                      shouldValidate: true,
                                                    });
                                                  }
                                                });
                                              }
                                            }}
                                            value={currentValue}
                                            disabled={!isFirstLanguage}
                                            key={`select-${currentValue}`} // Force re-render when value changes
                                          >
                                            <SelectTrigger 
                                              className={cn(
                                                "h-10 transition-colors",
                                                isFirstLanguage ? "hover:border-primary" : "bg-gray-100 cursor-not-allowed",
                                              )}
                                            >
                                              <SelectValue 
                                                placeholder="Select a section"
                                              >
                                                {selectedSection ? getSafeSectionName(selectedSection) : "Select a section"}
                                              </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                              {sections.map((section) => {
                                                if (!section || !section._id) return null;
                                                
                                                const sectionName = getSafeSectionName(section);
                                                
                                                return (
                                                  <SelectItem key={section._id} value={section._id}>
                                                    <div className="flex items-center gap-2">
                                                      <Link className="h-4 w-4" />
                                                      <span>{sectionName}</span>
                                                    </div>
                                                  </SelectItem>
                                                );
                                              })}
                                            </SelectContent>
                                          </Select>
                                        </FormControl>
                                        <FormMessage />
                                        
                                       
                                      </FormItem>
                                    );
                                  }}
                                />
                              )}
                            </div>

                            {/* Image upload - Only for first language */}
                            {isFirstLanguage ? (
                              <div className="space-y-2">
                                <FormLabel className="text-sm font-medium">
                                  {t("specialLinks.card.socialLinks.title")}
                                </FormLabel>
                                {SocialLinkImageUploader ? (
                                  <SocialLinkImageUploader
                                    heroIndex={index}
                                    socialLinkIndex={socialLinkIndex}
                                    langCode={langCode}
                                  />
                                ) : (
                                  <LabeledImageUploader
                                    label=""
                                    helperText={t("specialLinks.card.imageManagement.description")}
                                    imageValue={
                                      form.watch(`${langCode}.${index}.socialLinks.${socialLinkIndex}.image`) || ""
                                    }
                                    inputId={`social-link-image-${langCode}-${index}-${socialLinkIndex}`}
                                    onUpload={(file) => {
                                      const reader = new FileReader()
                                      reader.onload = () => {
                                        form.setValue(
                                          `${langCode}.${index}.socialLinks.${socialLinkIndex}.image`,
                                          reader.result as string,
                                          {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          },
                                        )
                                      }
                                      reader.readAsDataURL(file)
                                    }}
                                    onRemove={() => {
                                      form.setValue(`${langCode}.${index}.socialLinks.${socialLinkIndex}.image`, "", {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      })
                                    }}
                                    altText={t("specialLinks.card.socialLinks.titleWithNumber", { number: socialLinkIndex + 1 })}
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-amber-700">
                                  <Lock className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {t("specialLinks.card.imageManagement.title")}
                                  </span>
                                </div>
                                <p className="text-xs text-amber-600 mt-1">
                                  {t("specialLinks.card.imageManagement.description")}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}

                    {/* Add  Link button - Only for first language */}
                    {isFirstLanguage && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSocialLink}
                        className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("specialLinks.card.socialLinks.buttons.add")}                      
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Show "Add Social Link" button if no social links exist and this is first language */}
            {isFirstLanguage && currentSocialLinks.length === 0 && (
              <div className="text-center py-6">
                <ExternalLink className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-500 mb-3">
                  {t("specialLinks.card.socialLinks.noLinks")}
                </p>                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSocialLink}
                  className="hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("specialLinks.card.socialLinks.buttons.add")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  },
)

FooterCard.displayName = "FooterCard"