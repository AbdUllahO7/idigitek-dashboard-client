"use client"

import { useSearchParams } from "next/navigation"
import { Layout, Sparkles, ListChecks, ArrowRight, HelpCircle } from "lucide-react"
import { useLanguages } from "@/src/hooks/webConfiguration/use-language"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { FormData } from "@/src/api/types/sections/service/serviceSections.types"
import { FormShell } from "@/src/components/dashboard/AddSectionlogic/FormShell"
import { useWebsiteContext } from "@/src/providers/WebsiteContext"
import { useTranslation } from "react-i18next"
import FormBasicForm from "./basic/FormBasicForm"
import SpecialFormBasicForm from "./specailLinks/FormBasicForm"
import { ClickableImage } from "@/src/components/ClickableImage"

// Form sections to collect data from
const FORM_SECTIONS = ["footer"]

export default function AddFooter() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  
  // Get URL parameters
  const sectionId = searchParams.get('sectionId')
  const sectionItemId = searchParams.get('sectionItemId')
  const mode = searchParams.get('mode') || 'edit'
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
    Boolean(sectionItemId) && !isCreateMode, // Only fetch in edit mode
    false,
  )
  
  // Get subsections for this service if in edit mode
  const {
    data: subsectionsData,
    isLoading: isLoadingSubsections
  } = useGetSubSectionsBySectionItemId(
    sectionItemId || '',
    Boolean(sectionItemId) && !isCreateMode, // Only fetch in edit mode
    100,
    0,
    false,
  )
  
  // Filter active languages
  const activeLanguages = languagesData?.data?.filter((lang: { isActive: any }) => lang.isActive) || []
  
  // Helper function to find a subsection by slug - FIXED to be case-insensitive
  const findSubsection = (baseSlug: string) => {
    if (!subsectionsData?.data) return undefined;
    
    // Normalize the baseSlug to lowercase and handle special cases
    const normalizedBaseSlug = baseSlug.toLowerCase();
    
    // Create a mapping for known slug patterns
    const slugMappings: Record<string, string> = {
      'footer-section': 'footer-section',
    };
    
    // Get the normalized version of the slug
    const normalizedSlug = slugMappings[normalizedBaseSlug] || normalizedBaseSlug;
    
    // Expected pattern is: normalizedSlug-sectionItemId
    const expectedSlug = `${normalizedSlug}-${sectionItemId}`;
    
    // Find subsection that matches in a case-insensitive way
    const subsection = subsectionsData.data.find((s: { slug: string }) => 
      s.slug.toLowerCase() === expectedSlug.toLowerCase()
    );
    
    if (subsection) {
      return subsection;
    }
    
    // If no exact match, try partial matching (containing both the base slug and section ID)
    const partialMatch = subsectionsData.data.find((s: { slug: string }) => {
      const lowerSlug = s.slug.toLowerCase();
      // Check both with hyphen and without
      return (lowerSlug.includes(normalizedSlug.replace('-', '')) || 
              lowerSlug.includes(normalizedSlug)) && 
              sectionItemId && lowerSlug.includes(sectionItemId.toLowerCase());
    });
    
    if (partialMatch) {
      return partialMatch;
    }
    
      return undefined;
  };
  
  // Generate proper slugs for subsections
  const getSlug = (baseSlug: string) => {
    if (isCreateMode) return "";
    
    // Find the subsection
    const subsection = findSubsection(baseSlug);
    
    // If found, use its actual slug
    if (subsection) {
      return subsection.slug;
    }
    
    // Default fallback - construct the expected slug format
    return `${baseSlug.toLowerCase()}-${sectionItemId}`;
  };
  
  // Define tabs configuration with translations
  const tabs = [
    {
      id: "footer",
      label: t('addFooter.tabs.footer', 'Footer'),
      icon: <Layout className="h-4 w-4" />,
      component: (
        <>
          <ClickableImage
            imageSrc="/assets/PartsOfSections/footer-basic.png"
            imageAlt={t('servicesPage.title', 'Services Section')}
            size="large"
            title={t('servicesPage.title', 'Services Section')}
            subtitle={t('servicesPage.description', 'Click to view full size')}
            t={t}
            priority
            className="w-full"
            previewClassName="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 shadow-2xl h-64 md:h-80 lg:h-96"
          />
           <FormBasicForm
          languageIds={activeLanguages.map((lang: { _id: any }) => lang._id)}
          activeLanguages={activeLanguages}
          slug={getSlug('footer-section')}
          ParentSectionId={isCreateMode ? sectionId || "" : (sectionItemId || "")}
          initialData={findSubsection('footer-section')}
        />
        </>
      )
    },
     {
      id: "specialLinks",
      label: t('addFooter.tabs.specialLinks', 'Special Links'),
      icon: <Layout className="h-4 w-4" />,
      component: (
        <>
            <ClickableImage
            imageSrc="/assets/PartsOfSections/footer-info.png"
            imageAlt={t('servicesPage.title', 'Services Section')}
            size="large"
            title={t('servicesPage.title', 'Services Section')}
            subtitle={t('servicesPage.description', 'Click to view full size')}
            t={t}
            priority
            className="w-full"
            previewClassName="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 shadow-2xl h-64 md:h-80 lg:h-96"
          />

        <SpecialFormBasicForm
          languageIds={activeLanguages.map((lang: { _id: any }) => lang._id)}
          activeLanguages={activeLanguages}
          slug={getSlug('footer-section-specialLinks')}
          ParentSectionId={isCreateMode ? sectionId || "" : (sectionItemId || "")}
          initialData={findSubsection('footer-section-specialLinks')}
        />
        </>
      )
    }
  ]
  
  // Define save handler for the service
  const handleSaveFooter = async (formData: FormData) => {
    // Extract service info from footer data for title/description
    const footerData = formData.hero || {}
    
    // Get English title and description values or fallback to the first language
    let serviceName = t('addFooter.form.defaultName', 'New Footer')
    let serviceDescription = ""
    
    // Loop through languages to find title and description
    for (const langCode in footerData) {
      if (langCode !== 'backgroundImage' && typeof footerData[langCode] === 'object') {
        const langValues = footerData[langCode] as Record<string, any>
        if (langValues?.title) {
          serviceName = langValues.title
        }
        if (langValues?.description) {
          serviceDescription = langValues.description
        }
        // Prefer English if available
        if (langCode === 'en') {
          break
        }
      }
    }
    
    // Create the service payload
    const servicePayload = {
      name: serviceName,
      description: serviceDescription,
      image: footerData.backgroundImage || null,
      isActive: true,
      section: sectionId
    }
    
    // Return data for saving
    return servicePayload
  }
  
  // Get translated title and subtitle
  const getTitle = () => {
    return isCreateMode 
      ? t('addFooter.title.create', 'Create New Footer')
      : t('addFooter.title.edit', 'Edit Footer')
  }
  
  const getSubtitle = () => {
    return isCreateMode 
      ? t('addFooter.subtitle.create', 'Create a new footer with multilingual content')
      : t('addFooter.subtitle.edit', 'Editing "{name}" content across multiple languages', {
          name: sectionItemData?.data?.name || 'Footer'
        })
  }
  
  // Loading state
  const isLoading = isLoadingLanguages || (!isCreateMode && (isLoadingSectionItem || isLoadingSubsections))
  
  return (
   <>
    <ClickableImage
                  imageSrc="/assets/sections/footer.png"
                  imageAlt={t('HeroManagement.tabLabel', 'Hero Section')}
                  size="large"
                  title={t('HeroManagement.tabLabel', 'Hero Section')}
                  subtitle={t('HeroManagement.createSubtitle', 'Click to view full size')}
                  t={t}
                  priority
                  className="w-full"
                  previewClassName="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-2xl h-64 md:h-80 lg:h-96"
                />
    <FormShell
      title={getTitle()}
      subtitle={getSubtitle()}
      backUrl={`/dashboard/footer?sectionId=${sectionId}`}
      activeLanguages={activeLanguages}
      serviceData={sectionItemData?.data}
      sectionId={sectionId}
      sectionItemId={sectionItemId}
      mode={mode}
      onSave={handleSaveFooter}
      tabs={tabs}
      formSections={FORM_SECTIONS}
      isLoading={isLoading}
    />
   </>
  )
}