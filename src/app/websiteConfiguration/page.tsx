"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Globe, LayoutGrid, Save, ArrowRight } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Label } from "@/src/components/ui/label"
import { useToast } from "@/src/components/ui/use-toast"

// Helper function to set cookies
const setCookie = (name: string, value: string, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  }
  
  export default function ConfigurationPage() {
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
    const [selectedSections, setSelectedSections] = useState<string[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [showSavedMessage, setShowSavedMessage] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
  
    const languages = [
      { id: "en", name: "English" },
      { id: "es", name: "Spanish" },
      { id: "fr", name: "French" },
      { id: "de", name: "German" },
      { id: "zh", name: "Chinese" },
      { id: "ar", name: "Arabic" },
      { id: "ru", name: "Russian" },
      { id: "pt", name: "Portuguese" },
    ]
  
    const sections = [
      { id: "hero", name: "Hero " },
      { id: "features", name: "Features " },
      { id: "service", name: "Service" },
      { id: "blog", name: "Blog" },
      { id: "caseStudiesSection", name: "Case Studies " },
      { id: "clientsSection", name: "Clients " },
      { id: "contactSection", name: "Contact " },
      { id: "ctaSection", name: "Cta" },
      { id: "faqSection", name: "FAQ" },
      { id: "idustrySolutionsSection", name: "Industry Solutions" },
      { id: "newsSection", name: "News " },
      { id: "partnerSection", name: "Partner" },
      { id: "ProcessSection", name: "Process" },
      { id: "projectsSection", name: "Projects" },
      { id: "servicesSection", name: "Services" },
      { id: "teamSection", name: "Team " },
      { id: "technologyStackSection", name: "Technology Stack" },
      { id: "testimonialsSection", name: "Testimonials " },
    ]
  
    // Load saved selections from localStorage and cookies when component mounts
    useEffect(() => {
      // Only run on the client side
      if (typeof window !== "undefined") {
        try {
          // Try to get from localStorage first
          const savedLanguages = localStorage.getItem("selectedLanguages")
          const savedSections = localStorage.getItem("selectedSections")
  
          if (savedLanguages) {
            setSelectedLanguages(JSON.parse(savedLanguages))
          }
  
          if (savedSections) {
            setSelectedSections(JSON.parse(savedSections))
          }
  
          // If localStorage is empty, try to get from cookies
          if (!savedLanguages || !savedSections) {
            const getCookie = (name: string) => {
              const value = `; ${document.cookie}`
              const parts = value.split(`; ${name}=`)
              if (parts.length === 2) {
                const cookieValue = parts.pop()?.split(";").shift()
                return cookieValue ? decodeURIComponent(cookieValue) : null
              }
              return null
            }
  
            const cookieLanguages = getCookie("selectedLanguages")
            const cookieSections = getCookie("selectedSections")
  
            if (cookieLanguages && !savedLanguages) {
              const parsedLanguages = JSON.parse(cookieLanguages)
              setSelectedLanguages(parsedLanguages)
              localStorage.setItem("selectedLanguages", cookieLanguages)
            }
  
            if (cookieSections && !savedSections) {
              const parsedSections = JSON.parse(cookieSections)
              setSelectedSections(parsedSections)
              localStorage.setItem("selectedSections", cookieSections)
            }
          }
        } catch (error) {
          console.error("Error loading saved selections:", error)
        }
      }
    }, [])
  
    // Function to save selections to localStorage and cookies, then proceed to dashboard
    const saveSelectionsAndProceed = () => {
      setIsSaving(true)
  
      try {
        // Validate that at least one language and one section are selected
        if (selectedLanguages.length === 0 || selectedSections.length === 0) {
          toast({
            title: "Selection required",
            description: "Please select at least one language and one section.",
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }
  
        const languagesJson = JSON.stringify(selectedLanguages)
        const sectionsJson = JSON.stringify(selectedSections)
  
        // Save to localStorage
        localStorage.setItem("selectedLanguages", languagesJson)
        localStorage.setItem("selectedSections", sectionsJson)
  
        // Save to cookies for middleware access
        setCookie("selectedLanguages", languagesJson)
        setCookie("selectedSections", sectionsJson)
  
        // Show success message
        setShowSavedMessage(true)
  
        toast({
          title: "Configuration saved",
          description: "Your language and section preferences have been saved.",
        })
  
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } catch (error) {
        toast({
          title: "Error saving configuration",
          description: "There was a problem saving your preferences.",
          variant: "destructive",
        })
        console.error("Error saving selections:", error)
        setIsSaving(false)
      }
    }
  
    // Function to just save without proceeding
    const saveSelections = () => {
      setIsSaving(true)
  
      try {
        const languagesJson = JSON.stringify(selectedLanguages)
        const sectionsJson = JSON.stringify(selectedSections)
  
        // Save to localStorage
        localStorage.setItem("selectedLanguages", languagesJson)
        localStorage.setItem("selectedSections", sectionsJson)
  
        // Save to cookies for middleware access
        setCookie("selectedLanguages", languagesJson)
        setCookie("selectedSections", sectionsJson)
  
        // Show success message
        setShowSavedMessage(true)
        setTimeout(() => setShowSavedMessage(false), 3000)
  
        toast({
          title: "Configuration saved",
          description: "Your language and section preferences have been saved.",
        })
      } catch (error) {
        toast({
          title: "Error saving configuration",
          description: "There was a problem saving your preferences.",
          variant: "destructive",
        })
        console.error("Error saving selections:", error)
      } finally {
        setIsSaving(false)
      }
    }
  
    const toggleLanguage = (id: string) => {
      setSelectedLanguages((prev) => {
        // If already selected, remove it
        if (prev.includes(id)) {
          return prev.filter((item) => item !== id)
        }
        // If not selected and we haven't reached the limit, add it
        if (prev.length < 3) {
          return [...prev, id]
        }
        // If we've reached the limit, don't add it
        return prev
      })
    }
  
    const toggleSection = (id: string) => {
      setSelectedSections((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    }
  
    const isLanguageSelectionDisabled = (id: string) => {
      return selectedLanguages.length >= 3 && !selectedLanguages.includes(id)
    }
  
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
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 300 },
      },
    }
  
    // Check if user has made valid selections
    const hasValidSelections = selectedLanguages.length > 0 && selectedSections.length > 0
  
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl md:text-5xl">
              Website Configuration
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Select the languages and sections you want to include in your website.
            </p>
          </motion.div>
  
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-slate-50">
                  <Globe className="h-5 w-5 text-slate-700" />
                  Languages
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Select the languages your website will support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className={selectedLanguages.length >= 3 ? "text-rose-500 font-medium" : ""}>
                    Select up to 3 languages ({selectedLanguages.length}/3)
                  </span>
                </div>
                <motion.div
                  className="grid grid-cols-2 gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {languages.map((language) => (
                    <motion.div key={language.id} variants={itemVariants}>
                      <div
                        className={`
                          flex items-center space-x-2 rounded-lg border p-3 transition-all
                          ${
                            selectedLanguages.includes(language.id)
                              ? "border-slate-800 bg-slate-50 dark:border-slate-200 dark:bg-slate-700 shadow-sm cursor-pointer"
                              : isLanguageSelectionDisabled(language.id)
                                ? "border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer"
                          }
                        `}
                        onClick={() => !isLanguageSelectionDisabled(language.id) && toggleLanguage(language.id)}
                      >
                        <Checkbox
                          id={`language-${language.id}`}
                          checked={selectedLanguages.includes(language.id)}
                          onCheckedChange={() => !isLanguageSelectionDisabled(language.id) && toggleLanguage(language.id)}
                          disabled={isLanguageSelectionDisabled(language.id)}
                        />
                        <Label
                          htmlFor={`language-${language.id}`}
                          className={`flex-1 ${isLanguageSelectionDisabled(language.id) ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {language.name}
                        </Label>
                        {selectedLanguages.includes(language.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          >
                            <Check className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-slate-500">
                  {selectedLanguages.length === 0 ? (
                    <span className="text-rose-500">Please select at least one language</span>
                  ) : (
                    `${selectedLanguages.length} languages selected`
                  )}
                </div>
              </CardFooter>
            </Card>
  
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-slate-50">
                  <LayoutGrid className="h-5 w-5 text-slate-700" />
                  Sections
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Choose which sections to include in your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="grid grid-cols-2 gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {sections.map((section) => (
                    <motion.div key={section.id} variants={itemVariants}>
                      <div
                        className={`
                          flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-all
                          ${
                            selectedSections.includes(section.id)
                              ? "border-slate-800 bg-slate-50 dark:border-slate-200 dark:bg-slate-700 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }
                        `}
                        onClick={() => toggleSection(section.id)}
                      >
                        <Checkbox
                          id={`section-${section.id}`}
                          checked={selectedSections.includes(section.id)}
                          onCheckedChange={() => toggleSection(section.id)}
                        />
                        <Label htmlFor={`section-${section.id}`} className="flex-1 cursor-pointer">
                          {section.name}
                        </Label>
                        {selectedSections.includes(section.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          >
                            <Check className="h-4 w-4 text-slate-700" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-slate-500">
                  {selectedSections.length === 0 ? (
                    <span className="text-rose-500">Please select at least one section</span>
                  ) : (
                    `${selectedSections.length} sections selected`
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
  
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Your Selections</h2>
  
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Selected Languages:</h3>
                {selectedLanguages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedLanguages.map((id) => (
                      <motion.span
                        key={id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        {languages.find((lang) => lang.id === id)?.name}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No languages selected</p>
                )}
              </div>
  
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Selected Sections:</h3>
                {selectedSections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedSections.map((id) => (
                      <motion.span
                        key={id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-sm font-medium text-slate-800 dark:text-slate-200"
                      >
                        {sections.find((section) => section.id === id)?.name}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No sections selected</p>
                )}
              </div>
            </div>
  
            <div className="mt-6 flex flex-wrap justify-end items-center gap-4">
              <AnimatePresence>
                {showSavedMessage && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-sm text-emerald-600 font-medium"
                  >
                    Configuration saved!
                  </motion.div>
                )}
              </AnimatePresence>
  
              <div className="flex gap-3">
                <Button
                  onClick={saveSelections}
                  disabled={isSaving}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 border-2 border-t-transparent border-slate-800 rounded-full animate-spin"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
  
                <Button
                  onClick={saveSelectionsAndProceed}
                  disabled={isSaving || !hasValidSelections}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
  
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>This configuration will be used to generate your website with your preferred languages and sections.</p>
            <p className="mt-1">Your selections are saved in your browser and will be remembered when you return.</p>
          </div>
        </div>
      </main>
    )
  }
  