"use client"

import { useState, useRef, useEffect, JSX } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Button } from "@/src/components/ui/button"
import { toast } from "@/src/components/ui/use-toast"
import { Loader2, ArrowLeft, ArrowRight, Save, Globe, Layout, Sparkles, ListChecks, HelpCircle } from "lucide-react"
import HeroForm from "./Components/forms/hero-form"
import BenefitsForm from "./Components/forms/benefits-form"
import FeaturesForm from "./Components/forms/features-form"
import ProcessStepsForm from "./Components/forms/process-steps-form"
import FaqForm from "./Components/forms/faq-form"
import { Card, CardContent } from "@/src/components/ui/card"
import { useLanguages } from "@/src/hooks/webConfiguration/use-language"
import { Language } from "@/src/api/types/languagesTypes"
import { MultilingualSectionData } from "@/src/app/types/MultilingualSectionTypes"

// Define the type for our form data
export type FormData = {
  hero: MultilingualSectionData | {}
  benefits: any
  features: any
  processSteps: any
  faq: any
}

// Define the type for form refs
interface FormRef {
  getFormData: () => Promise<any>;
  hasUnsavedChanges: boolean;
  resetUnsavedChanges?: () => void;
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
    transition: { type: "spring", stiffness: 100, damping: 10 },
  },
}

export default function AddService() {
  const [activeTab, setActiveTab] = useState("hero")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  // Define tab order for navigation
  const tabOrder = ["hero", "benefits", "features", "process", "faq"]
  const tabIcons: Record<string, JSX.Element> = {
    hero: <Layout className="h-4 w-4" />,
    benefits: <Sparkles className="h-4 w-4" />,
    features: <ListChecks className="h-4 w-4" />,
    process: <ArrowRight className="h-4 w-4" />,
    faq: <HelpCircle className="h-4 w-4" />,
  }

  // Create refs for each form
  const heroFormRef = useRef<FormRef | null>(null)
  const benefitsFormRef = useRef<FormRef | null>(null)
  const featuresFormRef = useRef<FormRef | null>(null)
  const processStepsFormRef = useRef<FormRef | null>(null)
  const faqFormRef = useRef<FormRef | null>(null)

  // State to store all form data
  const [formData, setFormData] = useState<FormData>({
    hero: {},
    benefits: {},
    features: {},
    processSteps: {},
    faq: {},
  })

  // Add this state to track if any form has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Get languages from API
  const { 
    useGetAll: useGetAllLanguages
  } = useLanguages();

  const { 
    data: languagesData, 
    isLoading: isLoadingLanguages,
  } = useGetAllLanguages();

  // Filter active languages from API data
  const activeLanguages = languagesData?.data?.filter((lang: Language) => lang.isActive) || [];
  
  // Convert activeLanguages to an array of language codes for form components
  const languageCodes = activeLanguages.map((lang: { languageID: any }) => lang.languageID);
  const languageIds = activeLanguages.map((lang: Language) => lang._id);

  // Function to update hero section data
  const handleHeroSectionChange = (data: MultilingualSectionData) => {
    updateFormData("hero", data)
  }

  // Function to update form data
  const updateFormData = (section: keyof FormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }))

    // Check if any form has unsaved changes
    checkUnsavedChanges()
  }

  // Add this function to check if any form has unsaved changes
  const checkUnsavedChanges = () => {
    const heroHasChanges = heroFormRef.current?.hasUnsavedChanges || false
    const benefitsHasChanges = benefitsFormRef.current?.hasUnsavedChanges || false
    const featuresHasChanges = featuresFormRef.current?.hasUnsavedChanges || false
    const processStepsHasChanges = processStepsFormRef.current?.hasUnsavedChanges || false
    const faqHasChanges = faqFormRef.current?.hasUnsavedChanges || false

    setHasUnsavedChanges(
      heroHasChanges || benefitsHasChanges || featuresHasChanges || processStepsHasChanges || faqHasChanges,
    )
  }

  // Calculate progress
  useEffect(() => {
    const calculateProgress = () => {
      const totalSections = 5 // hero, benefits, features, process, faq
      let completedSections = 0

      // Check if each section has data
      if (Object.keys(formData.hero).length > 0) completedSections++
      if (Object.keys(formData.benefits).length > 0) completedSections++
      if (Object.keys(formData.features).length > 0) completedSections++
      if (Object.keys(formData.processSteps).length > 0) completedSections++
      if (Object.keys(formData.faq).length > 0) completedSections++

      return (completedSections / totalSections) * 100
    }

    setProgress(calculateProgress())
  }, [formData])

  // Function to save all data
  const saveAllData = async () => {
    setIsSubmitting(true)
    try {
      // Validate all forms (except hero which is handled by GenericSectionIntegration)
      try {
        if (heroFormRef.current) {
          await heroFormRef.current.getFormData()
        }
        if (benefitsFormRef.current) {
          await benefitsFormRef.current.getFormData()
        }
        if (featuresFormRef.current) {
          await featuresFormRef.current.getFormData()
        }
        if (processStepsFormRef.current) {
          await processStepsFormRef.current.getFormData()
        }
        if (faqFormRef.current) {
          await faqFormRef.current.getFormData()
        }

        // If all validations pass, use the collected form data
        console.log("All data saved:", formData)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast({
          title: "All data saved successfully",
          description: "Your Smart Drive content has been updated across all sections and languages.",
        })
      } catch (error) {
        console.error("Form validation error:", error)
        toast({
          title: "Validation Error",
          description: "Please make sure all required fields are filled correctly.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving data:", error)
      toast({
        title: "Error saving data",
        description: "There was an error saving your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modified to allow free tab navigation without validation
  const handleTabChange = (newTab: string) => {
    // Set the active tab without validation
    setActiveTab(newTab)
  }

  // Modified to allow free navigation to next tab
  const goToNextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab)
    if (currentIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentIndex + 1]
      setActiveTab(nextTab)
    }
  }

  // Modified to allow free navigation to previous tab
  const goToPreviousTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab)
    if (currentIndex > 0) {
      const prevTab = tabOrder[currentIndex - 1]
      setActiveTab(prevTab)
    }
  }

  // Check if current tab is the last one
  const isLastTab = activeTab === tabOrder[tabOrder.length - 1]
  const isFirstTab = activeTab === tabOrder[0]
  
  // Show loading state while fetching languages
  if (isLoadingLanguages) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }
  
  // If no languages available, show message
  if (activeLanguages.length === 0) {
    return (
      <div className="container py-10">
        <Card className="shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardContent className="p-6">
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No active languages found. Please activate at least one language in settings.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div className="container py-10" initial="hidden" animate="visible" variants={containerVariants}>
      <div className="flex flex-col space-y-8">
        <motion.div className="flex flex-col space-y-2" variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Smart Drive Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your Smart Drive content across multiple languages</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <h2 className="text-lg font-medium">Languages</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Completion:</span>
                    <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeLanguages.map((lang: Language) => (
                    <div
                      key={lang.languageID}
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      {lang.language}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full p-0 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 rounded-none">
              {tabOrder.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none"
                >
                  <div className="flex items-center gap-2">
                    {tabIcons[tab]}
                    <span className="capitalize">{tab}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="hero" className="mt-0">
                      <HeroForm
                        languageIds={languageIds}
                        activeLanguages={activeLanguages}
                        ref={heroFormRef}
                        onDataChange={(data) => updateFormData("hero", data)}
                        slug="hero-section"
                      />
                  </TabsContent>

                  <TabsContent value="benefits" className="mt-0">
                    <BenefitsForm
                      languageIds={languageIds}
                      activeLanguages={activeLanguages}
                      slug="benefits"
                      ref={benefitsFormRef}
                      onDataChange={(data) => updateFormData("benefits", data)}
                    />
                  </TabsContent>

                  <TabsContent value="features" className="mt-0">
                    <FeaturesForm
                       languageIds={languageIds}
                       activeLanguages={activeLanguages}
                      ref={featuresFormRef}
                      slug="features"
                      onDataChange={(data) => updateFormData("features", data)}
                    />
                  </TabsContent>

                  <TabsContent value="process" className="mt-0">
                    <ProcessStepsForm
                      languageIds={languageIds}
                      activeLanguages={activeLanguages}
                      ref={processStepsFormRef}
                      slug="process-Steps"
                      onDataChange={(data) => updateFormData("processSteps", data)}
                    />
                  </TabsContent>

                  <TabsContent value="faq" className="mt-0">
                    <FaqForm
                      languageIds={languageIds}
                      activeLanguages={activeLanguages}
                      ref={faqFormRef}
                      slug="faq-section"
                      
                      onDataChange={(data) => updateFormData("faq", data)}
                    />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>

        <motion.div variants={itemVariants} className="pt-6 border-t flex justify-between">
          {!isFirstTab && (
            <Button
              onClick={goToPreviousTab}
              variant="outline"
              className="flex items-center border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}

          <div className="flex-1" />

          {!isLastTab ? (
            <Button
              onClick={goToNextTab}
              className="flex items-center bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={saveAllData}
              disabled={isSubmitting}
              className="h-12 text-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save All Content
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}