"use client"

import { forwardRef, useImperativeHandle, useEffect, useState, useRef } from "react"
import StyledGenericSectionIntegration from "@/src/components/dashboard/StyledGenericSectionIntegration"
import { MultilingualSectionData } from "@/src/app/types/MultilingualSectionTypes"
import { heroSectionConfig } from "../../../components/SectionConfig"

interface HeroFormProps {
  languages: readonly string[]
  onDataChange?: (data: any) => void
}

// Use forward ref to expose methods to parent component
const HeroForm = forwardRef<any, HeroFormProps>(({ languages, onDataChange }, ref) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const sectionIntegrationRef = useRef<any>(null)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      if (sectionIntegrationRef.current) {
        return sectionIntegrationRef.current.getFormData()
      }
      throw new Error("Hero form has validation errors")
    },
    hasUnsavedChanges: hasUnsavedChanges,
    resetUnsavedChanges: () => setHasUnsavedChanges(false),
  }))

  // Handle section data change
  const handleSectionChange = (data: MultilingualSectionData) => {
    setHasUnsavedChanges(true)
    
    // Pass data to parent component
    if (onDataChange) {
      onDataChange(data)
    }
  }

  return (
    <StyledGenericSectionIntegration
      config={heroSectionConfig}
      onSectionChange={handleSectionChange}
      ref={sectionIntegrationRef}
    />
  )
})

HeroForm.displayName = "HeroForm"

export default HeroForm