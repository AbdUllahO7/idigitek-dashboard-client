"use client";

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
// Import your translation hook - adjust the import path as needed

interface LanguageCardProps {
  langCode: string;
  form: UseFormReturn<any>;
}

export const IndustryLanguageCard = memo(({ langCode, form }: LanguageCardProps) => {
  // Get translation function
  const { t } = useTranslation(); // Adjust based on your translation hook

  // Replace langCode placeholder in description
  const cardDescription = t("industryLanguageCard.cardDescription").replace("{langCode}", langCode.toUpperCase());

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase font-bold text-sm bg-primary  ml-2 text-primary-foreground rounded-md px-2 py-1 mr-2">
            {langCode}
          </span>
          {t("industryLanguageCard.sectionTitle")}
        </CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title Field */}
        <FormField
          control={form.control}
          name={`${langCode}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("industryLanguageCard.titleLabel")}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t("industryLanguageCard.titlePlaceholder")}
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
              <FormLabel>{t("industryLanguageCard.descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t("industryLanguageCard.descriptionPlaceholder")}
                  className="min-h-[100px]" 
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

IndustryLanguageCard.displayName = "IndustryLanguageCard";