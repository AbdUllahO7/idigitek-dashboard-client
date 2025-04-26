// src/components/section-form/SectionFormFields.tsx

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { ImageUploader } from "@/src/components/image-uploader";
import { Language } from "@/src/api/types";

interface SectionFormFieldsProps<T> {
  form: UseFormReturn<T>;
  languageIds: readonly string[];
  activeLanguages: Language[];
  elementDefinitions: {
    type: 'image' | 'text' | 'file' | 'link';
    key: string;
    name: string;
    description?: string;
  }[];
  onImageFileChange?: (file: File | null) => void;
}

export function SectionFormFields<T>({
  form,
  languageIds,
  activeLanguages,
  elementDefinitions,
  onImageFileChange
}: SectionFormFieldsProps<T>) {
  // Get language codes for display
  const languageCodes = activeLanguages.reduce((acc: Record<string, string>, lang) => {
    acc[lang._id] = lang.languageID;
    return acc;
  }, {});

  // Filter element definitions by type
  const imageElements = elementDefinitions.filter(el => el.type === 'image');
  const textElements = elementDefinitions.filter(el => el.type === 'text');

  return (
    <>
      {/* Image fields */}
      {imageElements.length > 0 && (
        <div className="mb-6">
          {imageElements.map(element => (
            <Card key={element.key} className="w-full">
              <CardHeader>
                <CardTitle>{element.name}</CardTitle>
                {element.description && (
                  <CardDescription>{element.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name={element.key as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploader 
                          value={field.value} 
                          onChange={field.onChange} 
                          onFileChange={onImageFileChange} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Text fields organized by language */}
      {textElements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languageIds.map((langId) => {
            const langCode = languageCodes[langId] || langId;
            return (
              <Card key={langId} className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="uppercase font-bold text-sm bg-primary text-primary-foreground rounded-md px-2 py-1 mr-2">
                      {langCode}
                    </span>
                    Content
                  </CardTitle>
                  <CardDescription>Manage content for {langCode.toUpperCase()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {textElements.map(element => {
                    const isTextarea = element.name.toLowerCase().includes('description') || 
                                       element.name.toLowerCase().includes('content');
                    
                    return (
                      <FormField
                        key={element.key}
                        control={form.control}
                        name={`${langCode}.${element.key}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{element.name}</FormLabel>
                            <FormControl>
                              {isTextarea ? (
                                <Textarea 
                                  placeholder={`Enter ${element.name.toLowerCase()}`} 
                                  className="min-h-[100px]" 
                                  {...field} 
                                />
                              ) : (
                                <Input 
                                  placeholder={`Enter ${element.name.toLowerCase()}`} 
                                  {...field} 
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}