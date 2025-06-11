"use client"

import type React from "react"
import { memo, useState } from "react"
import { Trash2, Plus, Minus, HelpCircle, ExternalLink, GripVertical } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { cn } from "@/src/lib/utils"
import { useTranslation } from "react-i18next"

interface FaqItemProps {
  langCode: string
  index: number
  faq: { question: string; answer: string; socialLinks?: { name: string; url: string; image: string }[] }
  form: any
  onConfirmDelete: (langCode: string, index: number) => void
  isFirstLanguage: boolean
  languageIds: string[]
  SocialLinkImageUploader?: React.ComponentType<any>
}

export const FaqItem = memo(
  ({
    langCode,
    index,
    faq,
    form,
    onConfirmDelete,
    isFirstLanguage,
    languageIds,
    SocialLinkImageUploader,
  }: FaqItemProps) => {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)
    const socialLinks = form.watch(`${langCode}.${index}.socialLinks`) || []

    const handleDelete = (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onConfirmDelete(langCode, index)
    }

    const addSocialLink = () => {
      const newSocialLink = { name: "", url: "", image: "" }
      const currentSocialLinks = form.getValues(`${langCode}.${index}.socialLinks`) || []
      const newSocialLinks = [...currentSocialLinks, newSocialLink]

      languageIds.forEach((lang) => {
        form.setValue(`${lang}.${index}.socialLinks`, newSocialLinks, {
          shouldDirty: true,
          shouldValidate: true,
        })
      })
      form.trigger(`${langCode}.${index}.socialLinks`)
    }

    const removeSocialLink = (socialLinkIndex: number) => {
      const currentSocialLinks = form.getValues(`${langCode}.${index}.socialLinks`) || []
      const updatedSocialLinks = currentSocialLinks.filter((_: any, i: number) => i !== socialLinkIndex)

      languageIds.forEach((lang) => {
        form.setValue(`${lang}.${index}.socialLinks`, updatedSocialLinks, {
          shouldDirty: true,
          shouldValidate: true,
        })
      })
    }

    const handleSocialLinkChange = (socialLinkIndex: number, field: string, value: string) => {
      languageIds.forEach((lang) => {
        form.setValue(`${lang}.${index}.socialLinks.${socialLinkIndex}.${field}`, value, {
          shouldDirty: true,
          shouldValidate: true,
        })
      })
    }

    const currentQuestion = form.watch(`${langCode}.${index}.question`) || ""
    const currentAnswer = form.watch(`${langCode}.${index}.answer`) || ""

    return (
      <AccordionItem value={`item-${index}`} className="border-0">
        <Card
          className={cn(
            "transition-all duration-300 ease-in-out hover:shadow-md",
            "border-2",
           
          )}
        >
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      isFirstLanguage ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-700",
                    )}
                  >
                    {index + 1}
                  </div>
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <AccordionTrigger
                  className="flex-1 text-left hover:no-underline"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <div className="flex flex-col items-start">
                    <CardTitle className="text-base font-semibold">
                      {currentQuestion || t('faqItem.title', { number: index + 1 })}
                    </CardTitle>
                    {currentAnswer && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1 text-left">
                        {currentAnswer.substring(0, 100)}
                        {currentAnswer.length > 100 ? "..." : ""}
                      </p>
                    )}
                    {socialLinks.length > 0 && isFirstLanguage && (
                      <div className="flex items-center gap-1 mt-1">
                        <ExternalLink className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600">{t('faqItem.socialLinks.linkCount', { count: socialLinks.length })}</span>
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <AccordionContent>
            <CardContent className="p-4 pt-0 space-y-6">
              {/* Question Field */}
              <FormField
                control={form.control}
                name={`${langCode}.${index}.question`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">{t('faqItem.questionLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('faqItem.questionPlaceholder')}
                        className="h-11 hover:border-primary transition-colors focus:ring-2 focus:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Answer Field */}
              <FormField
                control={form.control}
                name={`${langCode}.${index}.answer`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">{t('faqItem.answerLabel')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('faqItem.answerPlaceholder')}
                        className="min-h-[120px] hover:border-primary transition-colors focus:ring-2 focus:ring-primary/20 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Social Links Section - Only for first language */}
              {/* {isFirstLanguage && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-medium">{t('faqItem.socialLinks.title')}</h4>
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                        {t('faqItem.socialLinks.appliesToAll')}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSocialLink}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('faqItem.socialLinks.addButton')}
                    </Button>
                  </div>

                  {socialLinks.length > 0 ? (
                    <div className="space-y-4">
                      {socialLinks.map((link: any, socialLinkIndex: number) => (
                        <Card
                          key={`${langCode}-${index}-social-${socialLinkIndex}`}
                          className="border-2 border-dashed border-blue-200 bg-blue-50/50"
                        >
                          <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                  {socialLinkIndex + 1}
                                </div>
                                <h5 className="text-sm font-medium">{t('faqItem.socialLinks.title')} {socialLinkIndex + 1}</h5>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSocialLink(socialLinkIndex)}
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`${langCode}.${index}.socialLinks.${socialLinkIndex}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">{t('faqItem.socialLinks.platformLabel')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t('faqItem.socialLinks.platformPlaceholder')}
                                        className="h-10 hover:border-primary transition-colors"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e)
                                          handleSocialLinkChange(socialLinkIndex, "name", e.target.value)
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`${langCode}.${index}.socialLinks.${socialLinkIndex}.url`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">{t('faqItem.socialLinks.urlLabel')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={t('faqItem.socialLinks.urlPlaceholder')}
                                        className="h-10 hover:border-primary transition-colors"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(e)
                                          handleSocialLinkChange(socialLinkIndex, "url", e.target.value)
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`${langCode}.${index}.socialLinks.${socialLinkIndex}.image`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">{t('faqItem.socialLinks.imageLabel')}</FormLabel>
                                  <FormControl>
                                    <div className="space-y-3">
                                      {SocialLinkImageUploader ? (
                                        <SocialLinkImageUploader
                                          heroIndex={index}
                                          socialLinkIndex={socialLinkIndex}
                                          langCode={langCode}
                                          onImageChange={(image: string) =>
                                            handleSocialLinkChange(socialLinkIndex, "image", image)
                                          }
                                        />
                                      ) : (
                                        <>
                                          <Input
                                            type="file"
                                            accept="image/*"
                                            className="hover:border-primary transition-colors"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (file) {
                                                const reader = new FileReader()
                                                reader.onload = () => {
                                                  const result = reader.result as string
                                                  field.onChange(result)
                                                  handleSocialLinkChange(socialLinkIndex, "image", result)
                                                }
                                                reader.readAsDataURL(file)
                                              }
                                            }}
                                          />
                                          {field.value && (
                                            <div className="relative inline-block">
                                              <img
                                                src={field.value || "/placeholder.svg"}
                                                alt={`${t('faqItem.socialLinks.title')} ${socialLinkIndex + 1}`}
                                                className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                                              />
                                              <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                                onClick={() => {
                                                  field.onChange("")
                                                  handleSocialLinkChange(socialLinkIndex, "image", "")
                                                }}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </FormControl>
                                  <p className="text-xs text-blue-600 italic">
                                    {t('faqItem.socialLinks.imageNote')}
                                  </p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-2 border-dashed border-gray-200">
                      <CardContent className="text-center py-8 text-gray-500">
                        <ExternalLink className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">{t('faqItem.socialLinks.noLinks')}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('faqItem.socialLinks.noLinksDescription')}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )} */}
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    )
  },
)

FaqItem.displayName = "FaqItem"