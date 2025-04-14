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

// Define the multilingual service section type
export interface MultilingualServiceSection {
  id: string
  sectionLabel: {
    lang1: string
    lang2: string
    lang3: string
  }
  sectionTitle: {
    lang1: string
    lang2: string
    lang3: string
  }
  sectionDescription: {
    lang1: string
    lang2: string
    lang3: string
  }
  serviceDetails: {
    lang1: string
    lang2: string
    lang3: string
  }
}

interface ServiceSectionProps {
  serviceSection: MultilingualServiceSection | null
  onSectionChange: (section: MultilingualServiceSection | null) => void
  languageLabels?: {
    lang1: string
    lang2: string
    lang3: string
  }
}

export default function MultilingualServiceSectionComponent({
  serviceSection,
  onSectionChange,
  languageLabels = { lang1: "Language 1", lang2: "Language 2", lang3: "Language 3" },
}: ServiceSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState("lang1")
  const [formErrors, setFormErrors] = useState<{
    [key: string]: boolean
  }>({})
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)

  // Function to validate if a language tab has all fields completed
  const validateTabCompletion = (lang: string): boolean => {
    const fields = ["sectionLabel", "sectionTitle", "sectionDescription", "serviceDetails"]
    return fields.every(
      (field) => formData[field as keyof typeof formData][lang as keyof typeof formData.sectionLabel]?.trim() !== "",
    )
  }
  const [formData, setFormData] = useState<Omit<MultilingualServiceSection, "id">>({
    sectionLabel: {
      lang1: "",
      lang2: "",
      lang3: "",
    },
    sectionTitle: {
      lang1: "",
      lang2: "",
      lang3: "",
    },
    sectionDescription: {
      lang1: "",
      lang2: "",
      lang3: "",
    },
    serviceDetails: {
      lang1: "",
      lang2: "",
      lang3: "",
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const [field, lang] = name.split(".")

    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof prev],
        [lang]: value,
      },
    }))
  }

  const validateAllLanguages = (): boolean => {
    // Check if all fields for all languages have values
    const fields = ["sectionLabel", "sectionTitle", "sectionDescription", "serviceDetails"]
    const languages = ["lang1", "lang2", "lang3"]

    for (const field of fields) {
      for (const lang of languages) {
        const value = formData[field as keyof typeof formData][lang as keyof typeof formData.sectionLabel]
        if (!value || value.trim() === "") {
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all languages have data
    if (!validateAllLanguages()) {
      setValidationDialogOpen(true)
      return
    }

    // Update or create section
    onSectionChange({
      id: serviceSection?.id || Date.now().toString(),
      ...formData,
    })

    // Reset form
    setFormData({
      sectionLabel: {
        lang1: "",
        lang2: "",
        lang3: "",
      },
      sectionTitle: {
        lang1: "",
        lang2: "",
        lang3: "",
      },
      sectionDescription: {
        lang1: "",
        lang2: "",
        lang3: "",
      },
      serviceDetails: {
        lang1: "",
        lang2: "",
        lang3: "",
      },
    })
    setShowForm(false)
  }

  const handleEdit = () => {
    if (serviceSection) {
      // Populate form with current section data
      setFormData({
        sectionLabel: serviceSection.sectionLabel,
        sectionTitle: serviceSection.sectionTitle,
        sectionDescription: serviceSection.sectionDescription,
        serviceDetails: serviceSection.serviceDetails,
      })
      setShowForm(true)
    }
  }

  // Find incomplete languages
  const getIncompleteLanguages = () => {
    const incomplete = []
    if (!validateTabCompletion("lang1")) incomplete.push(languageLabels.lang1)
    if (!validateTabCompletion("lang2")) incomplete.push(languageLabels.lang2)
    if (!validateTabCompletion("lang3")) incomplete.push(languageLabels.lang3)
    return incomplete
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Multilingual Service Section</CardTitle>
          <CardDescription>Manage your service section in multiple languages.</CardDescription>
        </div>
        {!serviceSection && !showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        ) : serviceSection && !showForm ? (
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Section
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
                  <TabsTrigger value="lang1">{languageLabels.lang1}</TabsTrigger>
                  <TabsTrigger value="lang2">{languageLabels.lang2}</TabsTrigger>
                  <TabsTrigger value="lang3">{languageLabels.lang3}</TabsTrigger>
                </TabsList>
              </div>

              {["lang1", "lang2", "lang3"].map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`sectionLabel.${lang}`}>Section Label</Label>
                      <Input
                        id={`sectionLabel.${lang}`}
                        name={`sectionLabel.${lang}`}
                        value={formData.sectionLabel[lang as keyof typeof formData.sectionLabel]}
                        onChange={handleInputChange}
                        placeholder={`Our Services (${languageLabels[lang as keyof typeof languageLabels]})`}
                        required={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`sectionTitle.${lang}`}>Section Title</Label>
                      <Input
                        id={`sectionTitle.${lang}`}
                        name={`sectionTitle.${lang}`}
                        value={formData.sectionTitle[lang as keyof typeof formData.sectionTitle]}
                        onChange={handleInputChange}
                        placeholder={`Comprehensive Technology Solutions (${languageLabels[lang as keyof typeof languageLabels]})`}
                        required={true}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`sectionDescription.${lang}`}>Section Description</Label>
                    <Textarea
                      id={`sectionDescription.${lang}`}
                      name={`sectionDescription.${lang}`}
                      value={formData.sectionDescription[lang as keyof typeof formData.sectionDescription]}
                      onChange={handleInputChange}
                      placeholder={`We provide end-to-end technology solutions... (${languageLabels[lang as keyof typeof languageLabels]})`}
                      required={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`serviceDetails.${lang}`}>Service Details</Label>
                    <Input
                      id={`serviceDetails.${lang}`}
                      name={`serviceDetails.${lang}`}
                      value={formData.serviceDetails[lang as keyof typeof formData.serviceDetails]}
                      onChange={handleInputChange}
                      placeholder={`Service Details (${languageLabels[lang as keyof typeof languageLabels]})`}
                      required={true}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    sectionLabel: { lang1: "", lang2: "", lang3: "" },
                    sectionTitle: { lang1: "", lang2: "", lang3: "" },
                    sectionDescription: { lang1: "", lang2: "", lang3: "" },
                    serviceDetails: { lang1: "", lang2: "", lang3: "" },
                  })
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{serviceSection ? "Update" : "Save"} Section</Button>
            </div>
          </form>
        ) : serviceSection ? (
          <Tabs defaultValue="lang1">
            <div className="flex items-center gap-2 mb-4">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <TabsList>
                <TabsTrigger value="lang1">
                  {languageLabels.lang1}
                  {!validateTabCompletion("lang1") && <span className="ml-1 text-red-500">*</span>}
                </TabsTrigger>
                <TabsTrigger value="lang2">
                  {languageLabels.lang2}
                  {!validateTabCompletion("lang2") && <span className="ml-1 text-red-500">*</span>}
                </TabsTrigger>
                <TabsTrigger value="lang3">
                  {languageLabels.lang3}
                  {!validateTabCompletion("lang3") && <span className="ml-1 text-red-500">*</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            {["lang1", "lang2", "lang3"].map((lang) => (
              <TabsContent key={lang} value={lang}>
                {serviceSection.sectionTitle[lang as keyof typeof serviceSection.sectionTitle] ? (
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {serviceSection.sectionLabel[lang as keyof typeof serviceSection.sectionLabel]}
                          </p>
                          <CardTitle className="text-xl">
                            {serviceSection.sectionTitle[lang as keyof typeof serviceSection.sectionTitle]}
                          </CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleEdit}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {serviceSection.sectionDescription[lang as keyof typeof serviceSection.sectionDescription]}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {serviceSection.serviceDetails[lang as keyof typeof serviceSection.serviceDetails]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No content for {languageLabels[lang as keyof typeof languageLabels]} yet.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No service section added yet. Click the "Add Section" button to create one.
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
            <DialogDescription>Please complete all fields for all three languages before saving.</DialogDescription>
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
                setValidationDialogOpen(false)
                // Optionally switch to the first incomplete tab
                const incompleteLanguages = getIncompleteLanguages()
                if (incompleteLanguages.length > 0) {
                  if (!validateTabCompletion("lang1")) setActiveTab("lang1")
                  else if (!validateTabCompletion("lang2")) setActiveTab("lang2")
                  else if (!validateTabCompletion("lang3")) setActiveTab("lang3")
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
