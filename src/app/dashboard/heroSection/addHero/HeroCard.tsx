"use client";

import { memo, useState } from "react";
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/context/LanguageContext";

interface HeroCardProps {
  index: number;
  form: any;
  onDelete: (index: number) => void;
  languageCodes: Array<{ code: string; label: string }>;
  primaryLanguageCode: string;
  HeroImageUploader?: React.ComponentType<any>;
}

export const HeroCard = memo(({
  index,
  form,
  onDelete,
  languageCodes,
  primaryLanguageCode,
  HeroImageUploader,
}: HeroCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguage();

  const handleDelete = () => onDelete(index);

  const exploreButtonType = form?.watch ? form.watch(`${primaryLanguageCode}.${index}.exploreButtonType`) || "default" : "default";

  return (
    <Card className="border border-muted" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">
            {t("heroCard.sectionTitle", { index: index + 1 })}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0"
            aria-label={t("heroCard.expandCollapse")}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={handleDelete}
          aria-label={t("heroCard.deleteHero")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="p-4 pt-0 space-y-6">
          {/* Title - Multiple Languages */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t("heroCard.titleLabel")}</h3>
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              {languageCodes.map(({ code, label }) => (
                <FormField
                  key={`title-${code}`}
                  control={form?.control}
                  name={`${code}.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase text-muted-foreground">
                        {label}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("heroCard.titlePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Description - Multiple Languages */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t("heroCard.descriptionLabel")}</h3>
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              {languageCodes.map(({ code, label }) => (
                <FormField
                  key={`description-${code}`}
                  control={form?.control}
                  name={`${code}.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase text-muted-foreground">
                        {label}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("heroCard.descriptionPlaceholder")}
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Explore Button Text - Multiple Languages */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t("heroCard.exploreButtonTextLabel")}</h3>
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              {languageCodes.map(({ code, label }) => (
                <FormField
                  key={`exploreButton-${code}`}
                  control={form?.control}
                  name={`${code}.${index}.exploreButton`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase text-muted-foreground">
                        {label}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t("heroCard.exploreButtonPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Button Type and URL - Applies to all languages */}
          <div className="space-y-3 border-t pt-4">
            <FormField
              control={form?.control}
              name={`${primaryLanguageCode}.${index}.exploreButtonType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("heroCard.exploreButtonLinkTypeLabel")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field?.onChange}
                      defaultValue={field?.value || "default"}
                      className="flex flex-row space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id={`explore-default-${index}`} />
                        <Label htmlFor={`explore-default-${index}`}>
                          {t("heroCard.defaultOption")}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="special" id={`explore-special-${index}`} />
                        <Label htmlFor={`explore-special-${index}`}>
                          {t("heroCard.specialLinkOption")}
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show URL field only if special link is selected */}
            {exploreButtonType === "special" && (
              <FormField
                control={form?.control}
                name={`${primaryLanguageCode}.${index}.exploreButtonUrl`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("heroCard.exploreButtonUrlLabel")} {" "}
                      <span className="text-muted-foreground">
                        {t("heroCard.optionalText")}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("heroCard.urlPlaceholder")}
                        type="url"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Image Section - Applies to all languages */}
          <div className="border-t pt-4">
            {HeroImageUploader && (
              <HeroImageUploader featureIndex={index} langCode={primaryLanguageCode} />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
});

HeroCard.displayName = "HeroCard";