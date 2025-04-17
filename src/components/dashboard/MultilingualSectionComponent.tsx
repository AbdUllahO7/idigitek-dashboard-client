"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Edit, Plus, Languages, AlertCircle, Info, ArrowRight, CheckCircle2, Globe, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import type { FieldConfig, MultilingualSectionProps } from "@/src/app/types/MultilingualSectionTypes"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 10 },
  },
}

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
  sectionName = "",
  noDataMessage = "No content added yet. Click the 'Add Section' button to create one.",
}: MultilingualSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState(languages[0]?.id || "")
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)

  // Create initial form data structure based on fields and languages
  const createInitialFormData = () => {
    const initialData: any = { id: "" }

    fields.forEach((field) => {
      initialData[field.id] = {}
      languages.forEach((lang) => {
        initialData[field.id][lang.id] = ""
      })
    })

    return initialData
  }

  const [formData, setFormData] = useState<any>(createInitialFormData())

  // Function to validate if a language tab has all required fields completed
  const validateTabCompletion = (langId: string): boolean => {
    return fields
      .filter((field) => field.required !== false)
      .every((field) => formData[field.id][langId]?.trim() !== "")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const [fieldId, langId] = name.split(".")

    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        [langId]: value,
      },
    }))
  }

  const validateAllLanguages = (): boolean => {
    // Check if all required fields for all languages have values
    for (const field of fields) {
      if (field.required === false) continue

      for (const lang of languages) {
        const value = formData[field.id][lang.id]
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
      id: sectionData?.id || Date.now().toString(),
      ...formData,
    })

    // Reset form
    setFormData(createInitialFormData())
    setShowForm(false)
  }

  const handleEdit = () => {
    if (sectionData) {
      // Populate form with current section data
      setFormData(sectionData)
      setShowForm(true)
    }
  }

  // Find incomplete languages
  const getIncompleteLanguages = () => {
    return languages.filter((lang) => !validateTabCompletion(lang.id)).map((lang) => lang.label)
  }

  // Render the field based on its type
  const renderField = (field: FieldConfig, langId: string) => {
    const value = formData[field.id]?.[langId] || ""
    const commonProps = {
      id: `${field.id}.${langId}`,
      name: `${field.id}.${langId}`,
      value: value,
      onChange: handleInputChange,
      placeholder: field.placeholder
        ? `${field.placeholder} (${languages.find((l) => l.id === langId)?.label})`
        : undefined,
      required: field.required !== false,
      className: "transition-all duration-200 focus-visible:ring-teal-500 focus-visible:border-teal-500",
    }

    switch (field.type) {
      case "textarea":
        return <Textarea {...commonProps} className={`${commonProps.className} min-h-[120px] resize-y`} />
      case "text":
      default:
        return <Input {...commonProps} />
    }
  }

  // Render the value in view mode based on field type
  const renderFieldValue = (field: FieldConfig, langId: string) => {
    const value = sectionData?.[field.id]?.[langId]

    if (!value) return null

    switch (field.type) {
      case "badge":
        return (
          <Badge
            variant="outline"
            className="bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800"
          >
            {value}
          </Badge>
        )
      case "textarea":
        return <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{value}</p>
      case "text":
      default:
        return <p className="text-sm">{value}</p>
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="rounded-xl overflow-hidden">
     
      <motion.div variants={itemVariants}>
        <Card className="shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-b border-slate-200 dark:border-slate-700">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                {sectionTitle}
              </CardTitle>
              <CardDescription>{sectionDescription}</CardDescription>
            </div>
            {!sectionData && !showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addButtonLabel}
              </Button>
            ) : sectionData && !showForm ? (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="border-teal-200 hover:border-teal-300 hover:bg-teal-50 dark:border-teal-800 dark:hover:border-teal-700 dark:hover:bg-teal-900/30"
              >
                <Edit className="mr-2 h-4 w-4" />
                {editButtonLabel}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 mb-6 p-6 border rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                >
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center gap-2 mb-6">
                      <Languages className="h-5 w-5 text-teal-500" />
                      <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
                        {languages.map((lang) => (
                          <TabsTrigger
                            key={lang.id}
                            value={lang.id}
                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-sm"
                          >
                            {lang.label}
                            {!validateTabCompletion(lang.id) && <span className="ml-1 text-rose-500">*</span>}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {languages.map((lang) => (
                      <TabsContent key={lang.id} value={lang.id} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {fields.slice(0, 2).map((field) => (
                            <div key={field.id} className="space-y-2">
                              <Label htmlFor={`${field.id}.${lang.id}`} className="text-sm font-medium">
                                {field.label}
                                {field.required !== false && <span className="text-rose-500 ml-1">*</span>}
                              </Label>
                              {renderField(field, lang.id)}
                            </div>
                          ))}
                        </div>

                        {fields.slice(2).map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={`${field.id}.${lang.id}`} className="text-sm font-medium">
                              {field.label}
                              {field.required !== false && <span className="text-rose-500 ml-1">*</span>}
                            </Label>
                            {renderField(field, lang.id)}
                          </div>
                        ))}
                      </TabsContent>
                    ))}
                  </Tabs>

                  <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setFormData(createInitialFormData())
                      }}
                      className="border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600"
                    >
                      <X className="mr-2 h-4 w-4" />
                      {cancelButtonLabel}
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {sectionData ? "Update" : saveButtonLabel}
                    </Button>
                  </div>
                </motion.form>
              ) : sectionData ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Tabs defaultValue={languages[0]?.id || ""}>
                    <div className="flex items-center gap-2 mb-6">
                      <Languages className="h-5 w-5 text-teal-500" />
                      <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
                        {languages.map((lang) => (
                          <TabsTrigger
                            key={lang.id}
                            value={lang.id}
                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-sm"
                          >
                            {lang.label}
                            {!validateTabCompletion(lang.id) && <span className="ml-1 text-rose-500">*</span>}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {languages.map((lang) => (
                      <TabsContent key={lang.id} value={lang.id}>
                        {sectionData[fields[0]?.id]?.[lang.id] ? (
                          <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 pb-4 border-b border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between items-start">
                                <div>
                                  {fields[0] && sectionData[fields[0].id]?.[lang.id] && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      {sectionData[fields[0].id][lang.id]}
                                    </p>
                                  )}
                                  {fields[1] && sectionData[fields[1].id]?.[lang.id] && (
                                    <CardTitle className="text-xl mt-1 text-slate-800 dark:text-slate-200">
                                      {sectionData[fields[1].id][lang.id]}
                                    </CardTitle>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleEdit}
                                  className="h-8 w-8 rounded-full hover:bg-teal-100 hover:text-teal-700 dark:hover:bg-teal-900/50 dark:hover:text-teal-400"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                              {fields.slice(2).map((field) => (
                                <div key={field.id} className="mb-4">
                                  {renderFieldValue(field, lang.id)}
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                            No content for {lang.label} yet.
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-16 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700"
                >
                  <Globe className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  {noDataMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Validation Dialog */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
              <AlertCircle className="h-5 w-5" />
              Incomplete Information
            </DialogTitle>
            <DialogDescription>Please complete all required fields for all languages before saving.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4">
              <h4 className="mb-2 font-medium text-rose-700 dark:text-rose-400">Missing information in:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {getIncompleteLanguages().map((lang, index) => (
                  <li key={index} className="text-sm text-rose-600 dark:text-rose-400">
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
                const incompleteLanguages = languages.filter((lang) => !validateTabCompletion(lang.id))
                if (incompleteLanguages.length > 0) {
                  setActiveTab(incompleteLanguages[0].id)
                }
              }}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
