"use client"

import { forwardRef, useImperativeHandle, useState, useRef } from "react"
import StyledGenericSectionIntegration from "@/src/components/dashboard/StyledGenericSectionIntegration"
import { MultilingualSectionData } from "@/src/app/types/MultilingualSectionTypes"
import { benefitsSectionConfig } from "../../../components/SectionConfig"

interface BenefitsFormProps {
  languages: readonly string[]
  onDataChange?: (data: MultilingualSectionData) => void
}

// Use forward ref to expose methods to parent component
const BenefitsForm = forwardRef<any, BenefitsFormProps>(({ languages, onDataChange }, ref) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const sectionIntegrationRef = useRef<any>(null)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getFormData: async () => {
      if (sectionIntegrationRef.current) {
        return sectionIntegrationRef.current.getFormData()
      }
      throw new Error("Benefits form has validation errors")
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
      config={benefitsSectionConfig}
      onSectionChange={handleSectionChange}
      ref={sectionIntegrationRef}
    />
  )
})

BenefitsForm.displayName = "BenefitsForm"

export default BenefitsForm