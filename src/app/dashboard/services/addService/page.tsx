"use client"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"

import { Button } from "@/src/components/ui/button"
import { toast } from "@/src/components/ui/use-toast"
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import BenefitsForm from "./Components/forms/benefits-form"
import FeaturesForm from "./Components/forms/features-form"
import ProcessStepsForm from "./Components/forms/process-steps-form"
import FaqForm from "./Components/forms/faq-form"
import { HeroForm } from "./Components/forms/hero-form"

// Define the type for our form data
export type FormData = {
  hero: any
  benefits: any
  features: any
  processSteps: any
  faq: any
}

export default function AdminDashboard() {
  const languages = ["en", "ar", "fr"] as const
  const [activeTab, setActiveTab] = useState("hero")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Define tab order for navigation
  const tabOrder = ["hero", "benefits", "features", "process", "faq"]

  // Create refs for each form
  const heroFormRef = useRef(null)
  const benefitsFormRef = useRef(null)
  const featuresFormRef = useRef(null)
  const processStepsFormRef = useRef(null)
  const faqFormRef = useRef(null)

  // State to store all form data
  const [formData, setFormData] = useState<FormData>({
    hero: {},
    benefits: {},
    features: {},
    processSteps: {},
    faq: {},
  })

  // Function to update form data
  const updateFormData = (section: keyof FormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }))
  }

  // Function to save all data
  const saveAllData = async () => {
    setIsSubmitting(true)

    try {
      // Validate all forms
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

  // Get the current form ref based on active tab
  const getCurrentFormRef = () => {
    switch (activeTab) {
      case "hero":
        return heroFormRef
      case "benefits":
        return benefitsFormRef
      case "features":
        return featuresFormRef
      case "process":
        return processStepsFormRef
      case "faq":
        return faqFormRef
      default:
        return null
    }
  }

  // Function to handle tab change with validation
  const handleTabChange = async (newTab: string) => {
    // If trying to go forward, validate the current form
    const currentIndex = tabOrder.indexOf(activeTab)
    const newIndex = tabOrder.indexOf(newTab)

    if (newIndex > currentIndex) {
      try {
        // Validate current form before proceeding
        const currentFormRef = getCurrentFormRef()
        await currentFormRef?.current?.getFormData()
        setActiveTab(newTab)
      } catch (error) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields before proceeding.",
          variant: "destructive",
        })
      }
    } else {
      // If going backward, no validation needed
      setActiveTab(newTab)
    }
  }

  // Function to navigate to next tab
  const goToNextTab = async () => {
    const currentIndex = tabOrder.indexOf(activeTab)
    if (currentIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentIndex + 1]
      handleTabChange(nextTab)
    }
  }

  // Function to navigate to previous tab
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

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Smart Drive Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your Smart Drive content across multiple languages</p>
        </div>

        <div className="flex flex-col space-y-2">
          <h2 className="text-lg font-medium">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <div key={lang} className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
                {lang.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="process">Process Steps</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-4">
            <HeroForm languages={languages} ref={heroFormRef} onDataChange={(data) => updateFormData("hero", data)} />
          </TabsContent>

          <TabsContent value="benefits" className="space-y-4">
            <BenefitsForm
              languages={languages}
              ref={benefitsFormRef}
              onDataChange={(data) => updateFormData("benefits", data)}
            />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <FeaturesForm
              languages={languages}
              ref={featuresFormRef}
              onDataChange={(data) => updateFormData("features", data)}
            />
          </TabsContent>

          <TabsContent value="process" className="space-y-4">
            <ProcessStepsForm
              languages={languages}
              ref={processStepsFormRef}
              onDataChange={(data) => updateFormData("processSteps", data)}
            />
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <FaqForm languages={languages} ref={faqFormRef} onDataChange={(data) => updateFormData("faq", data)} />
          </TabsContent>
        </Tabs>

        <div className="pt-6 border-t flex justify-between">
          {!isFirstTab && (
            <Button onClick={goToPreviousTab} variant="outline" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}

          <div className="flex-1" />

          {!isLastTab ? (
            <Button onClick={goToNextTab} className="flex items-center">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={saveAllData} disabled={isSubmitting} className="h-12 text-lg" size="lg">
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Save All Content
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
