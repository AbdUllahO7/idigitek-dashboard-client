// withBaseForm.tsx
"use client"

import { useState, useImperativeHandle, forwardRef, useEffect, ComponentType } from "react"
import { Language } from "@/src/api/types"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useToast } from "@/src/hooks/use-toast"

// Base props that all form components will have
export interface BaseFormProps {
  languageIds: string[]
  activeLanguages: Language[]
  slug: string
  ParentSectionId: string
  onDataChange?: (data: any) => void
  initialData?: any
}

// Create a Higher Order Component for form functionality
export function withBaseForm<P extends BaseFormProps>(WrappedComponent: ComponentType<P>) {
  return forwardRef<any, P>((props, ref) => {
    const { 
      slug, 
      ParentSectionId, 
      onDataChange,
      initialData
    } = props

    const { toast } = useToast()
    const isCreateMode = !slug || slug === ""
    
    // State to track form data and changes
    const [formData, setFormData] = useState<any>({})
    const [initialFormData, setInitialFormData] = useState<any>({})
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    
    // SubSection API hooks
    const { 
      useCreate: useCreateSubSection,
      useUpdate: useUpdateSubSection
    } = useSubSections()
    
    // Mutations for creating and updating subsections
    const createSubSection = useCreateSubSection()
    const updateSubSection = useUpdateSubSection()
    
    // Set initial data
    useEffect(() => {
      if (initialData) {
        setFormData(initialData)
        setInitialFormData(initialData)
      }
    }, [initialData])
    
    // Update form data
    const updateFormData = (newData: any) => {
      setFormData(prev => {
        const updated = { ...prev, ...newData }
        
        // Notify parent of data change
        if (onDataChange) {
          onDataChange(updated)
        }
        
        return updated
      })
    }
    
    // Use useEffect to check for unsaved changes when formData changes
    // This avoids potential circular update issues
    useEffect(() => {
      if (Object.keys(initialFormData).length > 0 || Object.keys(formData).length > 0) {
        const hasChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData)
        setHasUnsavedChanges(hasChanged)
      }
    }, [formData, initialFormData])
    
    // Reset changes
    const resetUnsavedChanges = () => {
      setHasUnsavedChanges(false)
    }
    
    // Get form data for parent component
    const getFormData = async () => {
      return formData
    }
    
    // Save data to the API
    const saveData = async (): Promise<boolean> => {
      try {
        if (!ParentSectionId) {
          console.error("Parent section ID is required")
          toast({
            title: "Error",
            description: "Parent section ID is missing. Cannot save data.",
            variant: "destructive",
          })
          return false
        }
        
        // Prepare payload for saving
        const payload = {
          name: `${slug}`,
          slug: `${slug}`,
          description: JSON.stringify(formData),
          isActive: true,
          parentSectionItem: ParentSectionId,
        }
        
        if (isCreateMode) {
          // Create new subsection
          const result = await createSubSection.mutateAsync(payload)
          console.log("Created subsection:", result)
          
          // Update initial data and reset changes
          if (result.data) {
            setInitialFormData(formData)
            setHasUnsavedChanges(false)
          }
        } else {
          // Update existing subsection
          if (!initialData?._id) {
            throw new Error("Subsection ID is required for update")
          }
          
          const result = await updateSubSection.mutateAsync({
            id: initialData._id,
            data: payload
          })
          console.log("Updated subsection:", result)
          
          // Update initial data and reset changes
          if (result.data) {
            setInitialFormData(formData)
            setHasUnsavedChanges(false)
          }
        }
        
        return true
      } catch (error) {
        console.error("Error saving subsection data:", error)
        toast({
          title: "Error saving data",
          description: "There was an error saving your data. Please try again.",
          variant: "destructive",
        })
        return false
      }
    }
    
    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      getFormData,
      hasUnsavedChanges,
      resetUnsavedChanges,
      saveData
    }))
    
    // Pass all props and form methods to wrapped component
    return (
      <WrappedComponent
        {...props}
        formData={formData}
        updateFormData={updateFormData}
        hasUnsavedChanges={hasUnsavedChanges}
        isCreateMode={isCreateMode}
      />
    )
  })
}