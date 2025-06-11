"use client";
import { memo } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { HeroCard } from "./HeroCard";
import { useLanguage } from "@/src/context/LanguageContext";

interface LanguageCardProps {
  langCode: string;
  isFirstLanguage: boolean;
  form: any;
  addHero: (langCode: string) => void;
  removeHero: (langCode: string, index: number) => void;
  onDeleteStep: (langCode: string, index: number) => void;
  HeroImageUploader: React.ComponentType<any>;
}

export const LanguageCard = memo(({
  langCode,
  isFirstLanguage,
  form,
  addHero,
  onDeleteStep,
  HeroImageUploader,
}: LanguageCardProps) => {
  const hero = form.watch(langCode) || [];
  const { t } = useTranslation();
  const {language} = useLanguage()
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase ml-2 font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
            {langCode}
          </span>
          {t("HeroLanguageCard.heroSection")}
          {isFirstLanguage && (
            <span className="ml-2 mr-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {t("HeroLanguageCard.primaryBadge")}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {t("HeroLanguageCard.manageContentPrefix")} {langCode.toUpperCase()}
          {isFirstLanguage && ` ${t("HeroLanguageCard.urlSettingsNote")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {hero.map((_: any, index: number) => (
          <HeroCard
            key={`${langCode}-hero-${index}`}
            langCode={langCode}
            index={index}
            form={form}
            onDelete={(langCodeParam, index) => onDeleteStep(langCodeParam, index)}
            isFirstLanguage={isFirstLanguage}
            HeroImageUploader={HeroImageUploader}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addHero(langCode)}
          className="mt-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("HeroLanguageCard.addHeroButton")}
        </Button>
      </CardContent>
    </Card>
  );
});

LanguageCard.displayName = "LanguageCard";