"use client";

import React, { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import type { UseFormReturn } from "react-hook-form";
import { Separator } from "@/src/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/src/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/context/LanguageContext";

interface LanguageCardProps {
  langCode: string;
  form: UseFormReturn<any>;
  isFirstLanguage?: boolean;
}

export const MoreInfoLanguageCard = memo(({ langCode, form, isFirstLanguage = false }: LanguageCardProps) => {
  const { t } = useTranslation();
  const {language} = useLanguage()
  const [openSections, setOpenSections] = React.useState({
    client: false, 
    industry: false, 
    year: false, 
    technologies: false, 
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Card className="h-full" dir={language === 'ar' ? "rtl"  :'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="uppercase ml-2 font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
            {langCode}
          </span>
          {t('projectMoreInfoLanguageCard.projectSection', 'Project Section')}
        </CardTitle>
        <CardDescription>
          {t('projectMoreInfoLanguageCard.manageContent', 'Manage project content for {{langCode}}', { 
            langCode: langCode.toUpperCase() 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Field Group */}
        <Collapsible open={openSections.client} onOpenChange={() => toggleSection("client")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between items-center">
              <span className="text-lg font-semibold">
                {t('projectMoreInfoLanguageCard.client', 'Client')}
              </span>
              {openSections.client ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <FormField
              control={form.control}
              name={`${langCode}.clientName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projectMoreInfoLanguageCard.clientCustomName', 'Client Custom Name')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('projectMoreInfoLanguageCard.clientCustomNamePlaceholder', 'Enter custom name for client')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${langCode}.client`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projectMoreInfoLanguageCard.clientValue', 'Client Value')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('projectMoreInfoLanguageCard.clientValuePlaceholder', 'Enter client name')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Industry Field Group */}
        <Collapsible open={openSections.industry} onOpenChange={() => toggleSection("industry")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between items-center">
              <span className="text-lg font-semibold">
                {t('projectMoreInfoLanguageCard.industry', 'Industry')}
              </span>
              {openSections.industry ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <FormField
              control={form.control}
              name={`${langCode}.industryName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projectMoreInfoLanguageCard.industryCustomName', 'Industry Custom Name')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('projectMoreInfoLanguageCard.industryCustomNamePlaceholder', 'Enter custom name for industry')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${langCode}.industry`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projectMoreInfoLanguageCard.industryValue', 'Industry Value')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('projectMoreInfoLanguageCard.industryValuePlaceholder', 'Enter industry')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Year Field Group */}
        <Collapsible open={openSections.year} onOpenChange={() => toggleSection("year")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between items-center">
              <span className="text-lg font-semibold">
                {t('projectMoreInfoLanguageCard.year', 'Year')}
              </span>
              {openSections.year ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <FormField
              control={form.control}
              name={`${langCode}.yearName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projectMoreInfoLanguageCard.yearCustomName', 'Year Custom Name')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('projectMoreInfoLanguageCard.yearCustomNamePlaceholder', 'Enter custom name for year')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${langCode}.year`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projectMoreInfoLanguageCard.yearValue', 'Year Value')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('projectMoreInfoLanguageCard.yearValuePlaceholder', 'Enter year')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Technologies Field Group */}
        <Collapsible open={openSections.technologies} onOpenChange={() => toggleSection("technologies")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between items-center">
              <span className="text-lg font-semibold">
                {t('projectMoreInfoLanguageCard.technologies', 'Technologies')}
              </span>
              {openSections.technologies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <FormField
              control={form.control}
              name={`${langCode}.technologiesName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projectMoreInfoLanguageCard.technologiesCustomName', 'Technologies Custom Name')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('projectMoreInfoLanguageCard.technologiesCustomNamePlaceholder', 'Enter custom name for technologies')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${langCode}.technologies`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('projectMoreInfoLanguageCard.technologiesValue', 'Technologies Value')}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('projectMoreInfoLanguageCard.technologiesValuePlaceholder', 'Enter technologies')} 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
});

MoreInfoLanguageCard.displayName = "MoreInfoLanguageCard";