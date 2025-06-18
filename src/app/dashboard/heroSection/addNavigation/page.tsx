// src/app/dashboard/heroSection/addNavigation/page.tsx

"use client"

import { useSearchParams } from "next/navigation"
import { Navigation, Menu } from "lucide-react"
import { useLanguages } from "@/src/hooks/webConfiguration/use-language"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { FormShell } from "@/src/components/dashboard/AddSectionlogic/FormShell"
import { useWebsiteContext } from "@/src/providers/WebsiteContext"
import { useTranslation } from "react-i18next"
import NavigationForm from "./NavigationForm"

const FORM_SECTIONS = ["navigation"]

export default function AddNavigation() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  
  // Get URL parameters
  const sectionId = searchParams.get('sectionId') // Hero section ID for primary nav, or primary nav ID for sub-nav
  const sectionItemId = searchParams.get('sectionItemId')
  const mode = searchParams.get('mode') || 'edit'
  const type = (searchParams.get('type') as 'primary' | 'sub') || 'primary'
  const parentId = searchParams.get('parentId') // For sub-navigation
  const isCreateMode = mode === 'create'
  
  // API hooks
  const { useGetByWebsite: useGetAllLanguages } = useLanguages()
  const { useGetById: useGetSectionItemById } = useSectionItems()
  const { useGetBySectionItemId: useGetSubSectionsBySectionItemId } = useSubSections()
  const { websiteId } = useWebsiteContext();

  // Get languages
  const { 
    data: languagesData, 
    isLoading: isLoadingLanguages 
  } = useGetAllLanguages(websiteId)
  
  // Get section item data if in edit mode
  const {
    data: sectionItemData,
    isLoading: isLoadingSectionItem
  } = useGetSectionItemById(
    sectionItemId || '', 
    Boolean(sectionItemId) && !isCreateMode,
    false,
  )
  
  // Get subsections for this navigation if in edit mode
  const {
    data: subsectionsData,
    isLoading: isLoadingSubsections
  } = useGetSubSectionsBySectionItemId(
    sectionItemId || '',
    Boolean(sectionItemId) && !isCreateMode,
    100,
    0,
    false,
  )
  
  // Filter active languages
  const activeLanguages = languagesData?.data?.filter((lang: { isActive: any }) => lang.isActive) || []
  
  // Helper function to find a subsection by slug
  const findSubsection = (baseSlug: string) => {
    if (!subsectionsData?.data) return undefined;
    
    const normalizedBaseSlug = baseSlug.toLowerCase();
    const expectedSlug = `${normalizedBaseSlug}-${sectionItemId}`;
    
    const subsection = subsectionsData.data.find((s: { slug: string }) => 
      s.slug.toLowerCase() === expectedSlug.toLowerCase()
    );
    
    if (subsection) {
      return subsection;
    }
    
    const partialMatch = subsectionsData.data.find((s: { slug: string }) => {
      const lowerSlug = s.slug.toLowerCase();
      return (lowerSlug.includes(normalizedBaseSlug.replace('-', '')) || 
              lowerSlug.includes(normalizedBaseSlug)) && 
              sectionItemId && lowerSlug.includes(sectionItemId.toLowerCase());
    });
    
    return partialMatch;
  };
  
  // Generate proper slugs for subsections
  const getSlug = (baseSlug: string) => {
    if (isCreateMode) return "";
    
    const subsection = findSubsection(baseSlug);
    if (subsection) {
      return subsection.slug;
    }
    
    return `${baseSlug.toLowerCase()}-${sectionItemId}`;
  };
  
  // Define tabs configuration based on type
  const tabs = [
    {
      id: type === 'sub' ? "subNavigationForm" : "primaryNavigationForm",
      label: type === 'sub' ? "Sub-Navigation" : "Primary Navigation",
      icon: type === 'sub' ? <Menu className="h-4 w-4" /> : <Navigation className="h-4 w-4" />,
      component: (
        <NavigationForm
          languageIds={activeLanguages.map((lang: { _id: any }) => lang._id)}
          activeLanguages={activeLanguages}
          slug={getSlug(type === 'sub' ? 'sub-navigation-section' : 'navigation-section')}
          ParentSectionId={isCreateMode ? sectionId || "" : (sectionItemId || "")}
          initialData={findSubsection(type === 'sub' ? 'sub-navigation-section' : 'navigation-section')}
          type={type}
        />
      )
    }
  ]
  
  // Define save handler for the navigation
  const handleSaveNavigation = async (formData: any) => {
    const navigationData = formData.navigation || {}
    
    // Get name from the first available language
    let navigationName = type === 'sub' 
      ? "New Sub-Navigation"
      : "New Primary Navigation"
    let navigationDescription = type === 'sub' 
      ? "Sub-navigation description"
      : "Primary navigation description"
    
    // Loop through languages to find title and description
    for (const langCode in navigationData) {
      if (typeof navigationData[langCode] === 'object' && Array.isArray(navigationData[langCode])) {
        const langValues = navigationData[langCode] as any[]
        if (langValues.length > 0) {
          const firstItem = langValues[0]
          if (type === 'sub' && firstItem?.name) {
            navigationName = firstItem.name
          } else if (type === 'primary' && firstItem?.title) {
            navigationName = firstItem.title
          }
        }
        // Prefer English if available
        if (langCode === 'en') {
          break
        }
      }
    }
    
    // Create the navigation payload
    const navigationPayload = {
      name: navigationName,
      description: navigationDescription,
      isActive: true,
      section: sectionId // This will be hero section ID for primary nav, or primary nav ID for sub-nav
    }
    
    return navigationPayload
  }
  
  // Loading state
  const isLoading = isLoadingLanguages || (!isCreateMode && (isLoadingSectionItem || isLoadingSubsections))
  
  // Determine title and subtitle based on type
  const getTitle = () => {
    if (type === 'sub') {
      return isCreateMode ? "Create Sub-Navigation" : "Edit Sub-Navigation"
    }
    return isCreateMode ? "Create Primary Navigation" : "Edit Primary Navigation"
  }
  
  const getSubtitle = () => {
    if (isCreateMode) {
      return type === 'sub' 
        ? "Create a new sub-navigation item with multilingual support"
        : "Create a new primary navigation item with multilingual support"
    }
    
    const itemName = sectionItemData?.data?.name || (type === 'sub' ? "Sub-Navigation" : "Primary Navigation")
    const suffix = type === 'sub' ? "sub-navigation item" : "primary navigation item"
    
    return `Editing "${itemName}" ${suffix}`
  }
  
  const getBackUrl = () => {
    if (type === 'sub' && parentId) {
      return `/dashboard/heroSection/subNavigation?parentId=${parentId}&sectionId=${sectionId}`
    }
    return `/dashboard/heroSection?sectionId=${sectionId}`
  }
  
  return (
    <FormShell
      title={getTitle()}
      subtitle={getSubtitle()}
      backUrl={getBackUrl()}
      activeLanguages={activeLanguages}
      serviceData={sectionItemData?.data}
      sectionId={sectionId}
      sectionItemId={sectionItemId}
      mode={mode}
      onSave={handleSaveNavigation}
      tabs={tabs}
      formSections={FORM_SECTIONS}
      isLoading={isLoading}
    />
  )
}