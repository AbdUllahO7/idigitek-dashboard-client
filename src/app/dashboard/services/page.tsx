"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Plus, ArrowRight } from "lucide-react"
import Link from "next/link"
import GenericSectionIntegration from "@/src/components/dashboard/GenericSectionIntegration"
import { serviceSectionConfig } from "./serviceSectionConfig"
import { useSearchParams } from "next/navigation"

// Import the generic component and the service configuration

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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

/**
 * Service page component
 * Displays a list of services with their details and service sections
 */
export default function ServicesPage() {
  const [serviceSection, setServiceSection] = useState(null)

  // Handle service section change from ServiceSectionIntegration
  const handleServiceSectionChange = (sectionData) => {
    setServiceSection(sectionData)
  }
  const searchParams = useSearchParams();
  const ParentSectionId = searchParams.get('sectionId');

  return (
    <>
      <motion.div className="space-y-8 p-6" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Page header */}
        <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4" variants={itemVariants}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Services Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage your service inventory and multilingual content</p>
          </div>
          <Button
            className={`group transition-all duration-300 ${
              !serviceSection ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
            }`}
            disabled={!serviceSection}
            asChild
          >
            <Link href={serviceSection ? `services/addService?sectionId=${ParentSectionId}` : "#"}>
              <Plus className="mr-2 h-4 w-4" />
                Add New Service
              <motion.span
                className="ml-1 opacity-0 group-hover:opacity-100 group-hover:ml-2"
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Link>
          </Button>
        </motion.div>
        
        {/* Service Section Integration Component - directly using the generic component */}
        <motion.div variants={itemVariants}>
          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <GenericSectionIntegration 
                config={serviceSectionConfig}
                ParentSectionId = {ParentSectionId || "null"}
                onSectionChange={handleServiceSectionChange}
                sectionTitle="Service Section Content"
                sectionDescription="Manage your service section content in multiple languages."
                addButtonLabel="Add Service Section"
                editButtonLabel="Edit Service Section"
                saveButtonLabel="Save Service Section"
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Toast notifications */}
      {/* <Toaster /> */}
    </>
  )
}