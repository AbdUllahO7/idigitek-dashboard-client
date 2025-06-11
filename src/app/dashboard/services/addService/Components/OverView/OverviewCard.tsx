// OverviewCard Component with i18n Integration
"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next"; // or your i18n hook
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { Textarea } from "@/src/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";

interface OverviewCardProps {
  langCode: string;
  form: UseFormReturn<any>;
}

export const OverviewCard = memo(({ langCode, form }: OverviewCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 ml-2 mr-2">
            {langCode}
          </span>
          {t('overviewForm.overviewCard.title')}
        </CardTitle>
        <CardDescription>
          {t('overviewForm.overviewCard.description', { language: langCode.toUpperCase() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description Field Only */}
        <FormField
          control={form.control}
          name={`${langCode}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('overviewForm.overviewCard.fields.description.label')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('overviewForm.overviewCard.fields.description.placeholder')} 
                  className="min-h-[200px]" 
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

OverviewCard.displayName = "OverviewCard";