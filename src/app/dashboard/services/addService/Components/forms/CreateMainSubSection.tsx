"use client"

import { useEffect, useState, useRef } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { Textarea } from "@/src/components/ui/textarea"
import { TabsContent } from "@/src/components/ui/tabs"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements"
import { useLanguages } from "@/src/hooks/webConfiguration/use-language"
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions"
import { ActionButton, CancelButton, ErrorCard, InfoAlert, LanguageSelector, LanguageTabs, LoadingCard, MainFormCard, SuccessCard, WarningAlert, WarningCard } from "./MainSectionComponents"
import { ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Types
interface FieldConfig {
  id: string
  label: string
  type: string
  required: boolean
  description?: string
  placeholder?: string
}

interface CreateMainSubSectionProps {
  sectionId: string
  sectionConfig: {
    type: string,
    name: string
    slug: string
    subSectionName: string
    description: string
    isMain: boolean
    fields: FieldConfig[]
    elementsMapping: Record<string, string>
  }
  onSubSectionCreated?: (subsection: any) => void
  onFormValidityChange?: (isValid: boolean, message?: string) => void
}

export default function CreateMainSubSection({
  sectionId,
  sectionConfig,
  onSubSectionCreated,
  onFormValidityChange
}: CreateMainSubSectionProps) {
  // Hooks
  const { toast } = useToast()
  
  // State
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreatingElements, setIsCreatingElements] = useState(false)
  const [subsectionExists, setSubsectionExists] = useState(false)
  const [subsection, setSubsection] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(true)
  const [contentElements, setContentElements] = useState<any[]>([])
  const [contentTranslations, setContentTranslations] = useState<Record<string, any[]>>({})
  const [formsInitialized, setFormsInitialized] = useState(false)
  const [hasEmptyRequiredFields, setHasEmptyRequiredFields] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const languagesInitialized = useRef(false)
  
  // API Hooks
  const {
    useGetCompleteBySectionId,
    useCreate,
    useUpdate
  } = useSubSections()
  
  const { 
    useCreate: useCreateElement,
    useUpdate: useUpdateElement,
  } = useContentElements()
  
  const { 
    useCreate: useCreateTranslation,
    useUpdate: useUpdateTranslation 
  } = useContentTranslations()
  
  const { useGetAll: useGetAllLanguages } = useLanguages()
  
  // Mutations
  const createMutation = useCreate()
  const updateMutation = useUpdate()
  const createElementMutation = useCreateElement()
  const updateElementMutation = useUpdateElement()
  const createTranslationMutation = useCreateTranslation()
  const updateTranslationMutation = useUpdateTranslation()
  
  // Data fetching
  const {
    data: completeSubsectionsData,
    isLoading: isLoadingCompleteSubsections,
    error: completeSubsectionsError
  } = useGetCompleteBySectionId(sectionId)
  
  const { 
    data: languagesData, 
    isLoading: isLoadingLanguages 
  } = useGetAllLanguages()
  
  // Derived state
  const languages = languagesData?.data?.filter(lang => lang.isActive) || []
  const defaultLanguage = languages.find(lang => lang.isDefault) || (languages.length > 0 ? languages[0] : null)
  
  // Form schema builder
  const buildFormSchema = () => {
    const schemaObj: Record<string, any> = {}
    
    sectionConfig.fields.forEach(field => {
      if (field.required) {
        if (field.type === 'textarea' || field.type === 'text' || field.type === 'badge') {
          schemaObj[field.id] = z.string().min(1, `${field.label} is required`)
        }
      } else {
        if (field.type === 'textarea' || field.type === 'text' || field.type === 'badge') {
          schemaObj[field.id] = z.string().optional()
        }
      }
    })
    
    return z.object(schemaObj)
  }
  
  // Create forms for each language
  const languageForms: Record<string, any> = {}
  languages.forEach(lang => {
    const formSchema = buildFormSchema()
    languageForms[lang.languageID] = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: sectionConfig.fields.reduce((acc, field) => {
        acc[field.id] = ''
        return acc
      }, {} as Record<string, string>),
      mode: "onChange" // Enable validation on change
    })
  })
  
  // Initialize selected languages and active tab
  useEffect(() => {
    if (languages.length > 0 && !languagesInitialized.current) {
      setSelectedLanguages(languages.map(lang => lang._id))
      
      if (defaultLanguage) {
        setActiveTab(defaultLanguage.languageID)
      }
      
      languagesInitialized.current = true
    }
  }, [languages, defaultLanguage])
  
  // Process complete subsection data
  useEffect(() => {
    if (completeSubsectionsData?.data && completeSubsectionsData.data.length > 0) {
      const mainSubsection = completeSubsectionsData.data.find(sub => sub.isMain) || completeSubsectionsData.data[0]
      
      setSubsection(mainSubsection)
      setSubsectionExists(true)
      
      if (mainSubsection.elements && mainSubsection.elements.length > 0) {
        setContentElements(mainSubsection.elements)
        
        // Create translation map
        const translationMap: Record<string, any[]> = {}
        mainSubsection.elements.forEach(element => {
          if (element.translations && element.translations.length > 0) {
            translationMap[element._id] = element.translations
          }
        })
        
        setContentTranslations(translationMap)
        setFormsInitialized(false)
      }
      
      // Notify parent that there's a valid subsection
      if (onFormValidityChange) {
        onFormValidityChange(true);
      }
    } else {
      // No subsection exists yet, forms will be empty
      if (onFormValidityChange) {
        onFormValidityChange(false, "Please enter your main section data!");
      }
    }
  }, [completeSubsectionsData, onFormValidityChange])
  
  // Initialize forms with data
  useEffect(() => {
    if (contentElements.length > 0 && 
        Object.keys(contentTranslations).length > 0 && 
        !formsInitialized && 
        languages.length > 0) {
      
      languages.forEach(lang => {
        const form = languageForms[lang.languageID]
        if (!form) return
        
        const fieldValues: Record<string, string> = {}
        
        // Map content elements and translations to form fields
        sectionConfig.fields.forEach(field => {
          const element = contentElements.find(el => el.name === field.label)
          if (!element) return
          
          const translations = contentTranslations[element._id] || []
          const translation = translations.find(t => 
            (typeof t.language === 'string' && t.language === lang._id) || 
            (t.language && t.language._id === lang._id)
          )
          
          fieldValues[field.id] = translation 
            ? translation.content || '' 
            : element.defaultContent || ''
        })
        
        form.reset(fieldValues)
      })
      
      setFormsInitialized(true)
      checkFormsEmpty();
    }
  }, [contentElements, contentTranslations, languages, sectionConfig.fields, languageForms])
  
  // Check if any required fields are empty in the default language form
  const checkFormsEmpty = () => {
    if (!defaultLanguage || !languageForms[defaultLanguage.languageID]) {
      setHasEmptyRequiredFields(true);
      return;
    }
    
    const form = languageForms[defaultLanguage.languageID];
    const values = form.getValues();
    
    // Check if any required field is empty
    let isEmpty = false;
    sectionConfig.fields.forEach(field => {
      if (field.required && (!values[field.id] || values[field.id].trim() === '')) {
        isEmpty = true;
      }
    });
    
    setHasEmptyRequiredFields(isEmpty);
    
    // Set collapsed state based on whether fields are filled
    setIsExpanded(isEmpty);
    
    // Notify parent component about form validity
    if (onFormValidityChange) {
      onFormValidityChange(
        !isEmpty && subsectionExists, 
        isEmpty ? "Please enter your main section data!" : undefined
      );
    }
  };
  
  // Watch for form changes to validate in real-time
  useEffect(() => {
    if (defaultLanguage && languageForms[defaultLanguage.languageID] && formsInitialized) {
      const form = languageForms[defaultLanguage.languageID];
      
      const subscription = form.watch(() => {
        checkFormsEmpty();
      });
      
      return () => subscription.unsubscribe();
    }
  }, [defaultLanguage, languageForms, formsInitialized]);
  
  // Validate all forms
  const validateAllForms = async () => {
    for (const lang of languages) {
      const form = languageForms[lang.languageID]
      const result = await form.trigger()
      
      if (!result) {
        setActiveTab(lang.languageID)
        toast({
          title: "Validation Error",
          description: `Please check the form for errors in ${lang.name || lang.language}.`,
          variant: "destructive"
        })
        return false
      }
    }
    
    return true
  }
  
  // Create new subsection
  const handleCreateSubsection = async () => {
    if (!(await validateAllForms())) return
    
    try {
      setIsCreating(true)
      
      // Create subsection
      const subSectionData = {
        name: sectionConfig.name,
        description: sectionConfig.description,
        type: sectionConfig.type,
        slug: `${sectionConfig.slug}-main`,
        defaultContent: defaultLanguage ? languageForms[defaultLanguage.languageID].getValues() : {},
        isMain: true,
        isActive: true,
        order: 0,
        section: sectionId,
        languages: selectedLanguages,
        metadata: {
          fields: sectionConfig.fields,
          elementsMapping: sectionConfig.elementsMapping
        }
      }
      
      const response = await createMutation.mutateAsync(subSectionData)
      
      if (response?.data) {
        const createdSubsection = response.data
        setSubsection(createdSubsection)
        setIsCreatingElements(true)
        
        // Create content elements and translations
        await Promise.all(sectionConfig.fields.map(async (field, index) => {
          // Create element
          const elementData = {
            name: field.label,
            defaultContent: languageForms[defaultLanguage.languageID].getValues()[field.id],
            type: field.type === 'textarea' ? 'text' : 'text',
            order: index,
            parent: createdSubsection._id,
            isActive: true
          }
          
          const elementResponse = await createElementMutation.mutateAsync(elementData)
          const createdElement = elementResponse.data
          
          if (!createdElement || !createdElement._id) {
            throw new Error(`Failed to create content element for ${field.label}`)
          }
          
          // Create translations for each language
          await Promise.all(languages.map(async (lang) => {
            const formValues = languageForms[lang.languageID].getValues()
            const translationData = {
              content: formValues[field.id],
              language: lang._id,
              contentElement: createdElement._id,
              isActive: true
            }
            
            return createTranslationMutation.mutateAsync(translationData)
          }))
          
          return createdElement
        }))
        
        setSubsectionExists(true)
        setHasEmptyRequiredFields(false);
        
        // Notify parent components
        if (onSubSectionCreated) {
          onSubSectionCreated(createdSubsection)
        }
        
        if (onFormValidityChange) {
          onFormValidityChange(true);
        }
        
        toast({
          title: "Success",
          description: `Main subsection created with content in ${languages.length} language(s).`
        })
        
        // Collapse the section after successful creation
        setIsExpanded(false);
      }
    } catch (error: any) {
      toast({
        title: "Error creating subsection",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
      setIsCreatingElements(false)
    }
  }
  
  // Update existing subsection
  const handleUpdateSubsection = async () => {
    if (!(await validateAllForms())) return
    
    try {
      setIsUpdating(true)
      
      // Update subsection
      await updateMutation.mutateAsync({
        id: subsection._id,
        data: {
          defaultContent: defaultLanguage ? languageForms[defaultLanguage.languageID].getValues() : {}
        }
      })
      
      // Update content elements and translations
      await Promise.all(contentElements.map(async (element) => {
        const field = sectionConfig.fields.find(f => f.label === element.name)
        if (!field) return
        
        // Update element's default content
        if (defaultLanguage) {
          const defaultContent = languageForms[defaultLanguage.languageID].getValues()[field.id]
          await updateElementMutation.mutateAsync({
            id: element._id,
            data: { defaultContent }
          })
        }
        
        // Update translations for each language
        await Promise.all(languages.map(async (lang) => {
          const formValues = languageForms[lang.languageID].getValues()
          const content = formValues[field.id]
          
          // Find existing translation or create new one
          const existingTranslations = contentTranslations[element._id] || []
          const existingTranslation = existingTranslations.find(t => 
            (typeof t.language === 'string' && t.language === lang._id) || 
            (t.language && t.language._id === lang._id)
          )
          
          if (existingTranslation) {
            await updateTranslationMutation.mutateAsync({
              id: existingTranslation._id,
              data: { content }
            })
          } else {
            await createTranslationMutation.mutateAsync({
              content,
              language: lang._id,
              contentElement: element._id,
              isActive: true
            })
          }
        }))
      }))
      
      // Check if form is now valid
      checkFormsEmpty();
      
      toast({
        title: "Success",
        description: `Subsection updated with content in ${languages.length} language(s).`
      })
      
      setIsEditMode(false)
      
      // Collapse the section after successful update
      setIsExpanded(false);
    } catch (error: any) {
      toast({
        title: "Error updating subsection",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Render form content for each language tab
  const renderLanguageForms = () => {
    return languages.map(lang => (
      <TabsContent key={lang.languageID} value={lang.languageID}>
        <Form {...languageForms[lang.languageID]}>
          <div className="space-y-6">
            {sectionConfig.fields.map((field) => (
              <FormField
                key={`${lang.languageID}-${field.id}`}
                control={languageForms[lang.languageID].control}
                name={field.id}
                render={({ field: formField }) => (
                  <FormItem className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                    <FormLabel className="text-gray-800 dark:text-gray-200 font-medium flex items-center">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                      {field.type === 'textarea' ? (
                        <Textarea
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} for ${lang.name || lang.language}`}
                          {...formField}
                          className="min-h-[120px] border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <Input
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} for ${lang.name || lang.language}`}
                          {...formField}
                          className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </FormControl>
                    {field.description && (
                      <FormDescription className="text-gray-500 dark:text-gray-400 text-sm italic mt-1">
                        {field.description}
                      </FormDescription>
                    )}
                    <FormMessage className="text-red-500 dark:text-red-400 font-medium text-sm mt-1" />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </Form>
      </TabsContent>
    ));
  };
  
  // Display states
  
  // Loading state
  if (isLoadingCompleteSubsections || isLoadingLanguages) {
    return <LoadingCard />
  }
  
  // Error state
  if (completeSubsectionsError) {
    return (
      <ErrorCard
        errorMessage="Could not check if main subsection exists."
        onRetry={() => window.location.reload()}
      />
    )
  }
  
  // No languages available
  if (languages.length === 0) {
    return (
      <WarningCard
        title="No Active Languages Available"
        message="You need to have at least one active language before creating a subsection."
      />
    )
  }
  
  // Subsection exists (view mode)
  if (subsectionExists && subsection && !isEditMode) {
    // Create data object for SuccessCard
    const subsectionData = {
      ...subsection,
      elements: contentElements
    };
    
    // Define fields to display
    const metaFields = [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description', condition: (data) => !!data.description },
      { key: 'slug', label: 'Slug' },
      { key: 'languages', label: 'Languages', condition: (data) => data.languages && data.languages.length > 0 },
      { key: 'elements.length', label: 'Content Elements' }
    ];

    return (
      <SuccessCard
        title="Main Subsection Available"
        description="The main subsection is already set up for this section."
        data={subsectionData}
        metaFields={metaFields}
        onEdit={() => {
          setIsEditMode(true);
          setIsExpanded(true);
        }}
      />
    )
  }
  
  // Create/Edit form with collapsible behavior
  return (
    <MainFormCard
      title={
        <div 
          className="flex items-center justify-between w-full cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{subsectionExists ? "Edit Main Subsection" : "Create Main Subsection"}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.3 }}
            className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full"
          >
            {isExpanded ? 
              <ChevronUp size={18} className="text-gray-600 dark:text-gray-300" /> : 
              <ChevronDown size={18} className="text-gray-600 dark:text-gray-300" />
            }
          </motion.div>
        </div>
      }
      description={
        subsectionExists 
          ? "Update the content for this main subsection across all languages."
          : "Complete the required fields to create the main subsection for this section."
      }
    >
      {/* Status indicators */}
      <div className="mb-4 flex items-center">
        <div className={`w-3 h-3 rounded-full ${!hasEmptyRequiredFields ? 'bg-green-500' : 'bg-amber-500'} mr-2`}></div>
        <span className={`text-sm font-medium ${!hasEmptyRequiredFields ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {!hasEmptyRequiredFields ? 'All required fields completed' : 'Required fields need completion'}
        </span>
      </div>

      {/* Alerts */}
      {hasEmptyRequiredFields && (
        <WarningAlert
          title="Required Information Missing"
          message="Please fill in all required fields in all languages before adding services. Services cannot be added until the main section content is complete."
        />
      )}

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Language tabs and forms */}
            <LanguageTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              languages={languages}
            >
              {renderLanguageForms()}
            </LanguageTabs>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Action buttons - always visible */}
      <div className="mt-8 flex flex-col md:flex-row gap-3">
        {isExpanded ? (
          <>
            <ActionButton
              isLoading={false}
              isCreating={isCreating}
              isCreatingElements={isCreatingElements}
              isUpdating={isUpdating}
              exists={subsectionExists}
              onClick={subsectionExists ? handleUpdateSubsection : handleCreateSubsection}
              className="flex-1"
            />
            
            {subsectionExists && (
              <CancelButton 
                onClick={() => {
                  setIsEditMode(false);
                  setIsExpanded(false);
                }} 
                className="md:w-48"
              />
            )}
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExpanded(true)}
            className="w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-center">
              <ChevronDown size={18} className="mr-2" />
              <span>Show Content Form</span>
            </div>
          </motion.button>
        )}
      </div>
    </MainFormCard>
  )
}