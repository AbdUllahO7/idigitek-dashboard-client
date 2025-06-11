"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next"; // or your i18n hook
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { BenefitCard } from "./BenefitCard";
import { IconNames } from "@/src/utils/MainSectionComponents";

interface LanguageCardProps {
  langCode: string;
  isFirstLanguage: boolean;
  form: any;
  addBenefit: (langCode: string) => void;
  removeBenefit: (langCode: string, index: number) => void;
  syncIcons: (index: number, iconValue: string) => void;
  availableIcons: readonly IconNames[];
  onDeleteStep: (langCode: any, index: number) => void;
}
  
export const LanguageCard = memo(({ 
  langCode, 
  isFirstLanguage, 
  form, 
  addBenefit, 
  syncIcons, 
  availableIcons,
  onDeleteStep
}: LanguageCardProps) => {
  const { t } = useTranslation(); // i18n hook
  const benefits = form.watch(langCode) || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 ml-2 mr-2">
            {langCode}
          </span>
          {t('benefitsForm.languageCard.title')}
          {isFirstLanguage && (
            <span className="ml-2 text-xs bg-amber-100 text-amber-800 rounded-md px-2 mr-2 py-1">
              {t('benefitsForm.languageCard.primaryLanguageBadge')}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {t('benefitsForm.languageCard.description', { language: langCode.toUpperCase() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {benefits.map((_: any, index: number) => (
          <BenefitCard
            key={`${langCode}-benefit-${index}`}
            langCode={langCode}
            index={index}
            form={form}
            isFirstLanguage={isFirstLanguage}
            syncIcons={syncIcons}
            availableIcons={availableIcons}
            onDelete={(langCodeParam, index) => onDeleteStep(langCodeParam, index)}
          />
        ))}

        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBenefit(langCode)}
          className="mt-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('benefitsForm.languageCard.addButton')}
        </Button>
      </CardContent>
    </Card>
  );
});

LanguageCard.displayName = "LanguageCard";