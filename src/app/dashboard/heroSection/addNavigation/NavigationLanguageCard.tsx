// src/app/dashboard/heroSection/addNavigation/NavigationLanguageCard.tsx

"use client";
import { memo } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useLanguage } from "@/src/context/LanguageContext";
import { NavigationItemCard } from "./NavigationItemCard";

interface NavigationLanguageCardProps {
  langCode: string;
  isFirstLanguage: boolean;
  form: any;
  addNavItem: (langCode: string) => void;
  removeNavItem: (langCode: string, index: number) => void;
  onDeleteStep: (langCode: string, index: number) => void;
  type: 'primary' | 'sub';
}

export const NavigationLanguageCard = memo(({
  langCode,
  isFirstLanguage,
  form,
  addNavItem,
  onDeleteStep,
  type = 'primary',
}: NavigationLanguageCardProps) => {
  const navItems = form.watch(langCode) || [];
  const { t } = useTranslation();
  const { language } = useLanguage();

  const isSubNav = type === 'sub';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase ml-2 font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
            {langCode}
          </span>
          {isSubNav ? "Sub-Navigation Section" : "Primary Navigation Section"}
          {isFirstLanguage && (
            <span className="ml-2 mr-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Primary
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Manage {isSubNav ? "sub-navigation" : "primary navigation"} content for {langCode.toUpperCase()}
          {isFirstLanguage && " (URL settings will apply to all languages)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {navItems.map((_: any, index: number) => (
          <NavigationItemCard
            key={`${langCode}-nav-${index}`}
            langCode={langCode}
            index={index}
            form={form}
            onDelete={(langCodeParam, index) => onDeleteStep(langCodeParam, index)}
            isFirstLanguage={isFirstLanguage}
            type={type}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addNavItem(langCode)}
          className="mt-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isSubNav ? "Add Sub-Navigation Item" : "Add Navigation Item"}
        </Button>
      </CardContent>
    </Card>
  );
});

NavigationLanguageCard.displayName = "NavigationLanguageCard";