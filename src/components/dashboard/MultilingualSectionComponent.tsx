"use client"

import type React from "react"
import { useState } from "react"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Edit, Plus, Languages, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { FieldConfig, MultilingualSectionProps } from "@/src/app/types/MultilingualSectionTypes"



export default function MultilingualSectionComponent({
  sectionTitle,
  sectionDescription = "Manage this section in multiple languages.",
  fields,
  languages,
  sectionData,
  onSectionChange,
  addButtonLabel = "Add Section",
  editButtonLabel = "Edit Section",
  saveButtonLabel = "Save Section",
  cancelButtonLabel = "Cancel",
  noDataMessage = "No content added yet. Click the 'Add Section' button to create one.",
}: MultilingualSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState(languages[0]?.id || "")
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)

  // Create initial form data structure based on fields and languages
  const createInitialFormData = () => {
    const initialData: any = { id: "" };
    
    fields.forEach(field => {
      initialData[field.id] = {};
      languages.forEach(lang => {
        initialData[field.id][lang.id] = "";
      });
    });
    
    return initialData;
  };

  const [formData, setFormData] = useState<any>(createInitialFormData());

  // Function to validate if a language tab has all required fields completed
  const validateTabCompletion = (langId: string): boolean => {
    return fields
      .filter(field => field.required !== false)
      .every(field => formData[field.id][langId]?.trim() !== "");
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const [fieldId, langId] = name.split(".");

    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        [langId]: value,
      },
    }));
  }

  const validateAllLanguages = (): boolean => {
    // Check if all required fields for all languages have values
    for (const field of fields) {
      if (field.required === false) continue;
      
      for (const lang of languages) {
        const value = formData[field.id][lang.id];
        if (!value || value.trim() === "") {
          return false;
        }
      }
    }

    return true;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all languages have data
    if (!validateAllLanguages()) {
      setValidationDialogOpen(true);
      return;
    }

    // Update or create section
    onSectionChange({
      id: sectionData?.id || Date.now().toString(),
      ...formData,
    });

    // Reset form
    setFormData(createInitialFormData());
    setShowForm(false);
  }

  const handleEdit = () => {
    if (sectionData) {
      // Populate form with current section data
      setFormData(sectionData);
      setShowForm(true);
    }
  }

  // Find incomplete languages
  const getIncompleteLanguages = () => {
    return languages
      .filter(lang => !validateTabCompletion(lang.id))
      .map(lang => lang.label);
  }

  // Render the field based on its type
  const renderField = (field: FieldConfig, langId: string) => {
    const value = formData[field.id]?.[langId] || "";
    const commonProps = {
      id: `${field.id}.${langId}`,
      name: `${field.id}.${langId}`,
      value: value,
      onChange: handleInputChange,
      placeholder: field.placeholder ? `${field.placeholder} (${languages.find(l => l.id === langId)?.label})` : undefined,
      required: field.required !== false,
    };

    switch (field.type) {
      case "textarea":
        return <Textarea {...commonProps} />;
      case "text":
      default:
        return <Input {...commonProps} />;
    }
  };

  // Render the value in view mode based on field type
  const renderFieldValue = (field: FieldConfig, langId: string) => {
    const value = sectionData?.[field.id]?.[langId];
    
    if (!value) return null;
    
    switch (field.type) {
      case "badge":
        return <Badge variant="outline">{value}</Badge>;
      case "textarea":
        return <p className="text-sm text-muted-foreground mb-2">{value}</p>;
      case "text":
      default:
        return <p className="text-sm">{value}</p>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{sectionTitle}</CardTitle>
          <CardDescription>{sectionDescription}</CardDescription>
        </div>
        {!sectionData && !showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {addButtonLabel}
          </Button>
        ) : sectionData && !showForm ? (
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            {editButtonLabel}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center gap-2 mb-4">
                <Languages className="h-5 w-5 text-muted-foreground" />
                <TabsList>
                  {languages.map(lang => (
                    <TabsTrigger key={lang.id} value={lang.id}>
                      {lang.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {languages.map(lang => (
                <TabsContent key={lang.id} value={lang.id} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.slice(0, 2).map(field => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`${field.id}.${lang.id}`}>{field.label}</Label>
                        {renderField(field, lang.id)}
                      </div>
                    ))}
                  </div>
                  
                  {fields.slice(2).map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`${field.id}.${lang.id}`}>{field.label}</Label>
                      {renderField(field, lang.id)}
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData(createInitialFormData());
                }}
              >
                {cancelButtonLabel}
              </Button>
              <Button type="submit">{sectionData ? "Update" : saveButtonLabel}</Button>
            </div>
          </form>
        ) : sectionData ? (
          <Tabs defaultValue={languages[0]?.id || ""}>
            <div className="flex items-center gap-2 mb-4">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <TabsList>
                {languages.map(lang => (
                  <TabsTrigger key={lang.id} value={lang.id}>
                    {lang.label}
                    {!validateTabCompletion(lang.id) && <span className="ml-1 text-red-500">*</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {languages.map(lang => (
              <TabsContent key={lang.id} value={lang.id}>
                {sectionData[fields[0]?.id]?.[lang.id] ? (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          {fields[0] && sectionData[fields[0].id]?.[lang.id] && (
                            <p className="text-sm text-muted-foreground">
                              {sectionData[fields[0].id][lang.id]}
                            </p>
                          )}
                          {fields[1] && sectionData[fields[1].id]?.[lang.id] && (
                            <CardTitle className="text-xl">
                              {sectionData[fields[1].id][lang.id]}
                            </CardTitle>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleEdit}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {fields.slice(2).map(field => (
                        <div key={field.id} className="mb-2">
                          {renderFieldValue(field, lang.id)}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No content for {lang.label} yet.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {noDataMessage}
          </div>
        )}
      </CardContent>

      {/* Validation Dialog */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Incomplete Information
            </DialogTitle>
            <DialogDescription>
              Please complete all required fields for all languages before saving.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-medium">Missing information in:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {getIncompleteLanguages().map((lang, index) => (
                  <li key={index} className="text-sm">
                    {lang}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setValidationDialogOpen(false);
                // Optionally switch to the first incomplete tab
                const incompleteLanguages = languages.filter(lang => !validateTabCompletion(lang.id));
                if (incompleteLanguages.length > 0) {
                  setActiveTab(incompleteLanguages[0].id);
                }
              }}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}