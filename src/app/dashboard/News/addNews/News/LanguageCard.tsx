"use client"

import { memo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useLanguage } from "@/src/context/LanguageContext"

interface LanguageCardProps {
  langCode: string
  form: UseFormReturn<any>
}

export const LanguageCard = memo(({ langCode, form }: LanguageCardProps) => {
  const { t, i18n } = useTranslation() // Use the newsLanguageCard namespace
  const {language} = useLanguage()
  // Sync i18next language with langCode


  return (
    <Card className="h-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase ml-2 font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
            {langCode}
          </span>
          {t("newsLanguageCard.cardTitle")}
        </CardTitle>
        <CardDescription>{t("newsLanguageCard.cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title Field */}
        <FormField
          control={form.control}
          name={`${langCode}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("newsLanguageCard.titleLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("newsLanguageCard.titlePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name={`${langCode}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("newsLanguageCard.descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("newsLanguageCard.descriptionPlaceholder")} className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Button Text Field */}
        <FormField
          control={form.control}
          name={`${langCode}.backLinkText`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("newsLanguageCard.buttonTextLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("newsLanguageCard.buttonTextPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
})

LanguageCard.displayName = "LanguageCard"