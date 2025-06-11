"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next"; // or your i18n hook
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";

interface LanguageCardProps {
  langCode: string;
  form: UseFormReturn<any>;
}

export const LanguageCard = memo(({ langCode, form }: LanguageCardProps) => {
  const { t } = useTranslation(); // i18n hook

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 ml-2 mr-2">
            {langCode}
          </span>
          {t('heroForm.languageCard.title')}
        </CardTitle>
        <CardDescription>
          {t('heroForm.languageCard.description', { language: langCode.toUpperCase() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title Field */}
        <FormField
          control={form.control}
          name={`${langCode}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('heroForm.languageCard.fields.title.label')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('heroForm.languageCard.fields.title.placeholder')} 
                  {...field} 
                />
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
              <FormLabel>{t('heroForm.languageCard.fields.description.label')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('heroForm.languageCard.fields.description.placeholder')} 
                  className="min-h-[100px]" 
                  {...field} 
                />
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
              <FormLabel>{t('heroForm.languageCard.fields.backLinkText.label')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('heroForm.languageCard.fields.backLinkText.placeholder')} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
});

LanguageCard.displayName = "LanguageCard";