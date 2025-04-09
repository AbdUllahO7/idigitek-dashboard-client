"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { Check } from "lucide-react"
import { useServiceData } from "@/src/hooks/use-service-data"
import { validateServiceData } from "@/src/lib/service-validator"
import { ServiceHeader } from "./components/service-header"
import { ImportDataDialog } from "./components/import-data-dialog"
import { HeroSection } from "./components/hero-section"
import { BenefitsSection } from "./components/benefits-section"
import { FeaturesSection } from "./components/features-section"
import { ProcessSection } from "./components/process-section"
import { FaqSection } from "./components/faq-section"


export default function ServiceDashboard() {
  const [activeLanguage, setActiveLanguage] = useState("en")
  const [activeTab, setActiveTab] = useState("hero")
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

  const { serviceData, setServiceData, loadSampleData } = useServiceData()

  // Show notification
  const showNotification = (type: string, message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle form submission with validation
  const handleSubmit = () => {
    // Validate the data
    const { isValid, errors } = validateServiceData(serviceData)

    if (!isValid) {
      setValidationErrors(errors)
      showNotification("error", "Please fix the validation errors before saving")
      return
    }

    // Clear any previous validation errors
    setValidationErrors({})

    // Here you would typically send the data to your API
    console.log("Submitting service data:", serviceData)

    // Show success notification
    showNotification("success", "Service data saved successfully!")
  }

  // Handle sample data loading
  const handleLoadSampleData = () => {
    loadSampleData()
    setValidationErrors({})
    showNotification("info", "Sample data loaded successfully!")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <ServiceHeader activeLanguage={activeLanguage} setActiveLanguage={setActiveLanguage} onSubmit={handleSubmit} />

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              className={`${
                notification.type === "success"
                  ? "bg-green-50 border-green-200"
                  : notification.type === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-blue-50 border-blue-200"
              }`}
            >
              <AlertDescription
                className={`${
                  notification.type === "success"
                    ? "text-green-800"
                    : notification.type === "error"
                      ? "text-red-800"
                      : "text-blue-800"
                } flex items-center gap-2`}
              >
                {notification.type === "success" ? <Check className="h-4 w-4" /> : null}
                {notification.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Data Dialog */}
      {/* <ImportDataDialog onLoadSampleData={handleLoadSampleData} /> */}

      {/* Main Content */}
      <Tabs defaultValue="hero" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-6">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="process">Process Steps</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Hero Section Tab */}
        <TabsContent value="hero" className="space-y-4">
          <HeroSection
            activeLanguage={activeLanguage}
            serviceData={serviceData}
            setServiceData={setServiceData}
            errors={validationErrors.hero || {}}
          />
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-4">
          <BenefitsSection
            activeLanguage={activeLanguage}
            serviceData={serviceData}
            setServiceData={setServiceData}
            errors={validationErrors.benefits || {}}
          />
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <FeaturesSection
            activeLanguage={activeLanguage}
            serviceData={serviceData}
            setServiceData={setServiceData}
            errors={validationErrors.features || {}}
          />
        </TabsContent>

        {/* Process Steps Tab */}
        <TabsContent value="process" className="space-y-4">
          <ProcessSection
            activeLanguage={activeLanguage}
            serviceData={serviceData}
            setServiceData={setServiceData}
            errors={validationErrors.processSteps || {}}
          />
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          <FaqSection
            activeLanguage={activeLanguage}
            serviceData={serviceData}
            setServiceData={setServiceData}
            errors={validationErrors.faq || {}}
          />
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => {
            const tabs = ["hero", "benefits", "features", "process", "faq"]
            const currentIndex = tabs.indexOf(activeTab)
            if (currentIndex > 0) {
              setActiveTab(tabs[currentIndex - 1])
            }
          }}
          disabled={activeTab === "hero"}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            const tabs = ["hero", "benefits", "features", "process", "faq"]
            const currentIndex = tabs.indexOf(activeTab)
            if (currentIndex < tabs.length - 1) {
              setActiveTab(tabs[currentIndex + 1])
            }
          }}
          disabled={activeTab === "faq"}
          className="gap-2"
        >
          Next <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
