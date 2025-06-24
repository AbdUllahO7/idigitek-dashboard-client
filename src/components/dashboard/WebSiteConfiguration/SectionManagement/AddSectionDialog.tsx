"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Loader2, Check, AlertCircle, Globe, Languages } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Badge } from "@/src/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { cn } from "@/src/lib/utils"
import type { PredefinedSection } from "@/src/api/types/management/SectionManagement.type"
import type { TFunction } from "i18next"

// 🎯 NEW: Multilingual interfaces
interface MultilingualName {
  en: string
  ar: string
  tr: string
}

interface MultilingualErrors {
  en?: string
  ar?: string
  tr?: string
}

interface AddSectionDialogProps {
  isOpen: boolean
  onClose: () => void
  section: PredefinedSection | null
  onConfirm: (section: PredefinedSection, customNames: MultilingualName) => void // 🎯 UPDATED: Use multilingual names
  isLoading: boolean
  t: TFunction
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1,
      duration: 0.3,
    },
  },
}

export const AddSectionDialog = ({ isOpen, onClose, section, onConfirm, isLoading, t }: AddSectionDialogProps) => {
  // 🎯 UPDATED: Multilingual state
  const [customNames, setCustomNames] = useState<MultilingualName>({
    en: "",
    ar: "",
    tr: "",
  })
  const [nameErrors, setNameErrors] = useState<MultilingualErrors>({})
  const [activeTab, setActiveTab] = useState("en")

  // 🎯 NEW: Language configuration
  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  ] as const

  // Reset form when dialog opens/closes or section changes
  useEffect(() => {
    if (isOpen && section) {
      // Set default names from translated section name
      const defaultName = section.nameKey.split(".").pop() || section.subName
      setCustomNames({
        en: defaultName,
        ar: defaultName,
        tr: defaultName,
      })
      setNameErrors({})
      setActiveTab("en")
    } else if (!isOpen) {
      setCustomNames({ en: "", ar: "", tr: "" })
      setNameErrors({})
      setActiveTab("en")
    }
  }, [isOpen, section])

  // 🎯 UPDATED: Validation for multilingual names
  const validateName = (name: string, language: string) => {
    if (!name.trim()) {
      return t("sectionManagement.addDialog.validation.nameRequired", "Section name is required")
    }
    if (name.trim().length < 2) {
      return t("sectionManagement.addDialog.validation.nameMinLength", "Section name must be at least 2 characters")
    }
    if (name.trim().length > 50) {
      return t("sectionManagement.addDialog.validation.nameMaxLength", "Section name must be less than 50 characters")
    }
    return ""
  }

  // 🎯 NEW: Validate all languages
  const validateAllNames = () => {
    const errors: MultilingualErrors = {}
    let hasErrors = false

    languages.forEach(({ code }) => {
      const error = validateName(customNames[code], code)
      if (error) {
        errors[code] = error
        hasErrors = true
      }
    })

    setNameErrors(errors)
    return !hasErrors
  }

  // 🎯 UPDATED: Handle individual name changes
  const handleNameChange = (language: "en" | "ar" | "tr", value: string) => {
    setCustomNames((prev) => ({
      ...prev,
      [language]: value,
    }))

    // Clear error for this language
    if (nameErrors[language]) {
      setNameErrors((prev) => ({
        ...prev,
        [language]: undefined,
      }))
    }
  }

  // 🎯 UPDATED: Handle form submission
  const handleConfirm = () => {
    if (!section) return

    if (!validateAllNames()) {
      return
    }

    // Trim all names
    const trimmedNames: MultilingualName = {
      en: customNames.en.trim(),
      ar: customNames.ar.trim(),
      tr: customNames.tr.trim(),
    }

    onConfirm(section, trimmedNames)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && Object.keys(nameErrors).length === 0) {
      handleConfirm()
    }
  }

  if (!section) return null

  const translatedName = t(section.nameKey, section.nameKey.split(".").pop() || "")
  const translatedDescription = t(section.descriptionKey, "")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-2xl p-0 overflow-hidden">
        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit">
          {/* Header with Section Preview */}
          <DialogHeader className="p-4 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-start gap-4">
              {/* Section Icon */}
              <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-lg flex-shrink-0", section.color)}>
                <div className="text-white text-lg">{section.icon}</div>
              </div>

              {/* Section Info */}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t("sectionManagement.addDialog.title", "Add Section to Website")}
                </DialogTitle>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        section.category === "layout"
                          ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                          : "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
                      )}
                    >
                      {t(`sectionManagement.categories.${section.category}`, section.category)}
                    </Badge>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{translatedName}</span>
                  </div>
                  {translatedDescription && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{translatedDescription}</p>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <motion.div variants={contentVariants} initial="hidden" animate="visible" className="p-4">
            <div className="space-y-3">
              {/* Section Preview Image */}
              {section.image && (
                <div className="relative h-20 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden">
                  <img
                    src={section.image || "/placeholder.svg"}
                    alt={translatedName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.style.display = "none"
                    }}
                  />
                  {/* Fallback content */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center bg-gradient-to-br opacity-30",
                      section.bgColor || section.color,
                    )}
                  >
                    <div className="text-4xl text-slate-300 dark:text-slate-600">{section.icon}</div>
                  </div>
                </div>
              )}

              {/* 🎯 UPDATED: Multilingual Name Input with Tabs */}
              <div className="space-y-4">
                <Label
                  htmlFor="sectionNames"
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"
                >
                  <Languages className="h-4 w-4 text-blue-500" />
                  {t("sectionManagement.addDialog.multilingualName", "Section Names (All Languages)")}
                </Label>

                {/* Language Inputs - Compact Grid */}
                <div className="space-y-3">
                  {languages.map(({ code, name, flag }) => (
                    <div key={code} className="space-y-1.5">
                      {/* Compact Language Header */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-lg">{flag}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <Globe className="h-3 w-3 text-slate-500" />
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{name}</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {code.toUpperCase()}
                          </Badge>
                        </div>
                        {nameErrors[code] && <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                      </div>

                      {/* Compact Input Field */}
                      <div className="pl-2">
                        <Input
                          id={`name-${code}`}
                          type="text"
                          value={customNames[code]}
                          onChange={(e) => handleNameChange(code as "en" | "ar" | "tr", e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={t(
                            `sectionManagement.addDialog.namePlaceholder${code.toUpperCase()}`,
                            `Enter ${name} name...`,
                          )}
                          className={cn(
                            "w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-colors shadow-sm h-9",
                            // RTL support for Arabic
                            code === "ar" && "text-right",
                            nameErrors[code] &&
                              "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500",
                          )}
                          disabled={isLoading}
                          dir={code === "ar" ? "rtl" : "ltr"}
                        />
                        {nameErrors[code] && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-1"
                          >
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>{nameErrors[code]}</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compact validation summary */}
                {Object.keys(nameErrors).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2"
                  >
                    <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium">
                        {t(
                          "sectionManagement.addDialog.validation.completAllLanguages",
                          "Please complete all language fields",
                        )}
                      </span>
                    </div>
                  </motion.div>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    💡{" "}
                    {t(
                      "sectionManagement.addDialog.multilingualHint",
                      "Names will be displayed based on user's selected language.",
                    )}
                  </span>
                </p>
              </div>

              {/* Compact Features Preview */}
              <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-green-500" />
                  {t("sectionManagement.addDialog.whatYouGet", "What you'll get")}
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span>{t("sectionManagement.features.fullyCustomizable", "Fully customizable")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span>{t("sectionManagement.features.mobileResponsive", "Mobile responsive")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span>{t("sectionManagement.features.modernDesign", "Modern styling")}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <DialogFooter className="p-4 pt-0 gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {t("sectionManagement.addDialog.cancel", "Cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                isLoading ||
                Object.keys(nameErrors).length > 0 ||
                !customNames.en.trim() ||
                !customNames.ar.trim() ||
                !customNames.tr.trim()
              }
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("sectionManagement.addDialog.adding", "Adding...")}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {t("sectionManagement.addDialog.addSection", "Add Section")}
                </>
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
