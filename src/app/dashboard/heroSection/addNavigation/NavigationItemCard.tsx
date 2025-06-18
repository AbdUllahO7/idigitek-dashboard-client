// src/app/dashboard/heroSection/addNavigation/NavigationItemCard.tsx

"use client";

import { memo, useState } from "react";
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useLanguage } from "@/src/context/LanguageContext";

interface NavigationItemCardProps {
  langCode: string;
  index: number;
  form: any;
  onDelete: (langCode: string, index: number) => void;
  isFirstLanguage: boolean;
  type: 'primary' | 'sub';
}

export const NavigationItemCard = memo(({
  langCode,
  index,
  form,
  onDelete,
  isFirstLanguage,
  type = 'primary',
}: NavigationItemCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { t } = useTranslation();
  const { language } = useLanguage();

  const handleDelete = () => onDelete(langCode, index);
  const isSubNav = type === 'sub';

  return (
    <Card className="border border-muted" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">
            {isSubNav 
              ? `Sub-Navigation Item ${index + 1}`
              : `Navigation Item ${index + 1}`
            }
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0"
            aria-label="Expand/Collapse"
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
          aria-label={`Delete ${isSubNav ? 'Sub-Navigation' : 'Navigation'} Item`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Title/Name field */}
          <FormField
            control={form?.control}
            name={`${langCode}.${index}.${isSubNav ? 'name' : 'title'}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isSubNav ? "Sub-Navigation Name" : "Navigation Title"}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={
                      isSubNav 
                        ? "Enter sub-navigation name" 
                        : "Enter navigation title"
                    } 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Display Text field (only for primary navigation) */}
          {!isSubNav && (
            <FormField
              control={form?.control}
              name={`${langCode}.${index}.displayText`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Text</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter display text for navigation" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* URL field - only show for first language */}
          {isFirstLanguage && (
            <FormField
              control={form?.control}
              name={`${langCode}.${index}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isSubNav ? "Sub-Navigation URL" : "Navigation URL"} {" "}
                    <span className="text-muted-foreground">
                      (applies to all languages)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com" 
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Order field - only show for first language */}
          {isFirstLanguage && (
            <FormField
              control={form?.control}
              name={`${langCode}.${index}.order`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter display order (0-999)" 
                      type="number"
                      min="0"
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Active status (only for sub-navigation) */}
          {isSubNav && isFirstLanguage && (
            <FormField
              control={form?.control}
              name={`${langCode}.${index}.isActive`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={field.onChange}
                      className="rounded border border-input bg-background"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
});

NavigationItemCard.displayName = "NavigationItemCard";