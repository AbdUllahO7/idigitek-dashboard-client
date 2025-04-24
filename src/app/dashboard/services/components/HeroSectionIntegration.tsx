"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/src/components/ui/card"
import GenericSectionIntegration from "@/src/components/dashboard/GenericSectionIntegration"
import { FieldConfig, MultilingualSectionData } from "@/src/app/types/MultilingualSectionTypes"

// Define the hero section configuration
export const heroSectionConfig = {
  name: "Hero",                // Section name used for display
  slug: "hero-section",        // Section slug used in API calls
  subSectionName: "Hero Section", // Name of the subsection entity
  description: "The main hero section displayed at the top of the page", // Description
  
  // Fields configuration based on your HeroForm
  fields: [
    {
      id: "title",
      label: "Title",
      type: "text",
      placeholder: "Enter title",
      required: true,
      description: "The main heading displayed in the hero section"
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
      required: true,
      description: "The descriptive text below the hero title"
    },
    {
      id: "backLinkText",
      label: "Button Text",
      type: "text",
      placeholder: "Get Started",
      required: true,
      description: "The text displayed on the hero section button"
    },
    {
      id: "backgroundImage",
      label: "Background Image",
      type: "image",
      description: "Upload an image for the hero background (applies to all languages)",
      required: true
    }
  ] as FieldConfig[],
  
  // Mapping of field IDs to content element names for API
  elementsMapping: {
    "title": "HeroTitle",
    "description": "HeroDescription",
    "backLinkText": "HeroButtonText",
    "backgroundImage": "HeroBackgroundImage"
  }
}

// Animation variants
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

interface HeroSectionIntegrationProps {
  onHeroSectionChange?: (sectionData: MultilingualSectionData) => void;
}

export default function HeroSectionIntegration({ onHeroSectionChange }: HeroSectionIntegrationProps) {
  const [heroSection, setHeroSection] = useState<MultilingualSectionData | null>(null)
  
  // Handle hero section change from GenericSectionIntegration
  const handleHeroSectionChange = (sectionData: MultilingualSectionData) => {
    setHeroSection(sectionData)
    
    // Pass the data up to parent component if needed
    if (onHeroSectionChange) {
      onHeroSectionChange(sectionData)
    }
  }
  
  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <GenericSectionIntegration 
              config={heroSectionConfig}
              onSectionChange={handleHeroSectionChange}
              sectionTitle="Hero Section Content"
              sectionDescription="Manage your hero section content in multiple languages."
              addButtonLabel="Add Hero Section"
              editButtonLabel="Edit Hero Section"
              saveButtonLabel="Save Hero Section"
              noDataMessage="No hero section found. Click 'Add Hero Section' to create one."
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}