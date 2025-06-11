"use client";

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";

interface LanguageCardProps {
  langCode: string;
  form: UseFormReturn<any>;
}

export const TeamLanguageCard = memo(({ langCode, form }: LanguageCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 ml-2 mr-2">
            {langCode}
          </span>
          {t("teamForm.languageCard.teamSectionTitle")}
        </CardTitle>
        <CardDescription>
          {t("teamForm.languageCard.manageContentDescription", { langCode: langCode.toUpperCase() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title Field */}
        <FormField
          control={form.control}
          name={`${langCode}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("teamForm.languageCard.titleLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("teamForm.languageCard.titlePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Job Field */}
        <FormField
          control={form.control}
          name={`${langCode}.job`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("teamForm.languageCard.jobLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("teamForm.languageCard.jobPlaceholder")} {...field} />
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
              <FormLabel>{t("teamForm.languageCard.descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("teamForm.languageCard.descriptionPlaceholder")}
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

TeamLanguageCard.displayName = "TeamLanguageCard";