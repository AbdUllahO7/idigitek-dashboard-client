"use client";

import { forwardRef, useEffect, useState, useRef, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections";
import { useContentElements } from "@/src/hooks/webConfiguration/use-content-elements";
import { useToast } from "@/src/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { LoadingDialog } from "@/src/utils/MainSectionComponents";
import { ContentElement, ContentTranslation } from "@/src/api/types/hooks/content.types";
import { SubSection } from "@/src/api/types/hooks/section.types";
import { useWebsiteContext } from "@/src/providers/WebsiteContext";
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-content-translations";
import { ProjectFormProps } from "@/src/api/types/sections/project/porjectSection.type";
import { createLanguageCodeMap, createProjectDefaultValues } from "@/src/app/dashboard/services/addService/Utils/Language-default-values";
import { processAndLoadData } from "@/src/app/dashboard/services/addService/Utils/load-form-data";
import { createFormRef } from "@/src/app/dashboard/services/addService/Utils/Expose-form-data";
import { createProjectMoreInfoInfoSchema } from "@/src/app/dashboard/services/addService/Utils/language-specific-schemas";
import { MoreInfoLanguageCard } from "./MoreInfoLanguageCard";
import { useTranslation } from "react-i18next";

const MoreInfoForm = forwardRef<any, ProjectFormProps>((props, ref) => {
  const { 
    languageIds, 
    activeLanguages, 
    onDataChange, 
    slug, 
    ParentSectionId, 
    initialData 
  } = props;

  const { websiteId } = useWebsiteContext();
  const { t } = useTranslation();

  // Setup form with schema validation
  const formSchema = createProjectMoreInfoInfoSchema(languageIds, activeLanguages);
  const defaultValues = createProjectDefaultValues(languageIds, activeLanguages);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange"
  });

  // State management
  const [state, setState] = useState({
    isLoadingData: !slug,
    dataLoaded: !slug,
    hasUnsavedChanges: false,
    existingSubSectionId: null as string | null,
    contentElements: [] as ContentElement[],
    isSaving: false
  });

  const updateState = useCallback((newState: { isLoadingData?: boolean; dataLoaded?: boolean; hasUnsavedChanges?: boolean; existingSubSectionId?: string | null; contentElements?: any[]; isSaving?: boolean; }) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  const { 
    isLoadingData, 
    dataLoaded, 
    hasUnsavedChanges, 
    existingSubSectionId, 
    contentElements, 
    isSaving 
  } = state;

  // Hooks
  const { toast } = useToast();
  const dataProcessed = useRef(false);
  const onDataChangeRef = useRef(onDataChange);
  const defaultLangCode = activeLanguages[0]?.languageID || 'en';
  
  // Services
  const { 
    useCreate: useCreateSubSection, 
    useGetCompleteBySlug, 
    useUpdate: useUpdateSubSection 
  } = useSubSections();
  
  const { useCreate: useCreateContentElement } = useContentElements();
  const { useBulkUpsert: useBulkUpsertTranslations } = useContentTranslations();
  
  const createSubSection = useCreateSubSection();
  const updateSubSection = useUpdateSubSection();
  const createContentElement = useCreateContentElement();
  const bulkUpsertTranslations = useBulkUpsertTranslations();

  // Data fetching from API
  const { 
    data: completeSubsectionData, 
    isLoading: isLoadingSubsection, 
    refetch 
  } = useGetCompleteBySlug(slug || '', Boolean(slug));


  // Update reference when onDataChange changes
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  // Process initial data from parent
  const processInitialData = useCallback(() => {
    if (initialData && !dataLoaded) {
      if (initialData.description) {
        form.setValue(`${defaultLangCode}.description`, initialData.description);
      }
      
      updateState({ 
        dataLoaded: true, 
        hasUnsavedChanges: false 
      });
    }
  }, [initialData, dataLoaded, defaultLangCode, form]);

  // Process project data from API - SAME AS BASIC FORM
  const processProjectData = useCallback((subsectionData: SubSection | null) => {
    processAndLoadData(
      subsectionData,
      form,
      languageIds,
      activeLanguages,
      {
        groupElements: (elements) => ({
          'project': elements.filter(el => el.type === 'text')
        }),
        processElementGroup: (groupId, elements, langId, getTranslationContent) => {
          const elementKeyMap: Record<string, keyof typeof result> = {
            'Client': 'client',
            'ClientName': 'clientName',
            'Industry': 'industry',
            'IndustryName': 'industryName',
            'Year': 'year',
            'YearName': 'yearName',
            'Technologies': 'technologies',
            'TechnologiesName': 'technologiesName',
          };
          
          const result = {
            client: '',
            clientName: '',
            industry: '',
            industryName: '',
            year: '',
            yearName: '',
            technologies: '',
            technologiesName: '',
          };
          
          elements.filter(el => el.type === 'text').forEach(element => {
            const key = elementKeyMap[element.name];
            if (key) {
              result[key] = getTranslationContent(element, '');
            }
          });
          
          return result;
        },
        getDefaultValue: () => ({
          client: '',
          clientName: '',
          industry: '',
          industryName: '',
          year: '',
          yearName: '',
          technologies: '',
          technologiesName: '',
        })
      },
      {
        setExistingSubSectionId: (id) => updateState({ existingSubSectionId: id }),
        setContentElements: (elements) => updateState({ contentElements: elements }),
        setDataLoaded: (loaded) => updateState({ dataLoaded: loaded }),
        setHasUnsavedChanges: (hasChanges) => updateState({ hasUnsavedChanges: hasChanges }),
        setIsLoadingData: (loading) => updateState({ isLoadingData: loading })
      }
    );
  }, [form, languageIds, activeLanguages, updateState]);

  // Process initial data effect
  useEffect(() => {
    if (!dataLoaded && initialData) {
      processInitialData();
    }
  }, [initialData, dataLoaded, processInitialData]);

  // Process API data effect
  useEffect(() => {
    if (!slug || isLoadingSubsection || dataProcessed.current) return;
    
    if (completeSubsectionData?.data) {
      updateState({ isLoadingData: true });
      processProjectData(completeSubsectionData.data);
      updateState({ 
        dataLoaded: true,
        isLoadingData: false
      });
      dataProcessed.current = true;
    }
  }, [completeSubsectionData, isLoadingSubsection, slug, processProjectData]);

  // Form watch effect for unsaved changes
  useEffect(() => {
    if (isLoadingData || !dataLoaded) return;
    
    const subscription = form.watch((value) => {
      updateState({ hasUnsavedChanges: true });
      if (onDataChangeRef.current) {
        onDataChangeRef.current(value);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, isLoadingData, dataLoaded, updateState]);

  // Save handler with optimized process - SAME AS BASIC FORM
  const handleSave = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: t('projectMoreInfo.validationError', 'Validation Error'),
        description: t('projectMoreInfo.fillAllFields', 'Please fill all required fields correctly'),
        variant: "destructive"
      });
      return false;
    }

    updateState({ isSaving: true });

    try {
      const allFormValues = form.getValues();

      // Step 1: Create or update subsection
      let sectionId = existingSubSectionId;
      if (!sectionId) {
        if (!ParentSectionId) {
          throw new Error(t('projectMoreInfo.parentSectionRequired', 'Parent section ID is required to create a subsection'));
        }

        const subsectionData = {
          name: t('projectMoreInfo.projectSection', 'Project Section'),
          slug: slug || `project-moreinfo-section-${Date.now()}`,
          description: "",
          isActive: true,
          isMain: false,
          order: 0,
          defaultContent: '',
          sectionItem: ParentSectionId,
          languages: languageIds,
          WebSiteId: websiteId
        };

        const newSubSection = await createSubSection.mutateAsync(subsectionData);
        sectionId = newSubSection.data._id;
        updateState({ existingSubSectionId: sectionId });
      } else {
        const updateData = {
          isActive: true,
          isMain: false,
          languages: languageIds
        };

        await updateSubSection.mutateAsync({
          id: sectionId,
          data: updateData
        });
      }

      if (!sectionId) {
        throw new Error(t('projectMoreInfo.failedToCreateSection', 'Failed to create or retrieve subsection ID'));
      }

      // Step 2: Map language codes to IDs
      const langCodeToIdMap = activeLanguages.reduce<Record<string, string>>((acc, lang) => {
        acc[lang.languageID] = lang._id;
        return acc;
      }, {});

      // Step 3: Handle existing content or create new content
      if (contentElements.length > 0) {
        // Update translations for text elements
        const textElements = contentElements.filter((e) => e.type === "text");
        const translations: (Omit<ContentTranslation, "_id"> & { id?: string; })[] = [];
        const elementNameToKeyMap: Record<string, 'client' | 'clientName' | 'industry' | 'industryName' | 'year' | 'yearName' | 'technologies' | 'technologiesName'> = {
          'Client': 'client',
          'ClientName': 'clientName',
          'Industry': 'industry',
          'IndustryName': 'industryName',
          'Year': 'year',
          'YearName': 'yearName',
          'Technologies': 'technologies',
          'TechnologiesName': 'technologiesName',
        };

        Object.entries(allFormValues).forEach(([langCode, values]) => {
          const langId = langCodeToIdMap[langCode];
          if (!langId) return;

          textElements.forEach((element) => {
            const key = elementNameToKeyMap[element.name];
            if (key && values && typeof values === "object" && key in values) {
              translations.push({
                content: values[key],
                language: langId,
                contentElement: element._id,
                isActive: true
              });
            }
          });
        });

        if (translations.length > 0) {
          await bulkUpsertTranslations.mutateAsync(translations);
        }
      } else {
        // Create new content elements
        const elementTypes = [
          { type: "text", key: "client", name: "Client" },
          { type: "text", key: "clientName", name: "ClientName" }, 
          { type: "text", key: "industry", name: "Industry" },
          { type: "text", key: "industryName", name: "IndustryName" }, 
          { type: "text", key: "year", name: "Year" },
          { type: "text", key: "yearName", name: "YearName" }, 
          { type: "text", key: "technologies", name: "Technologies" },
          { type: "text", key: "technologiesName", name: "TechnologiesName" }, 
        ];

        const createdElements = [];
        for (const [index, el] of elementTypes.entries()) {
          let defaultContent = "";
          if (el.type === "text" && typeof allFormValues[defaultLangCode] === "object") {
            const langValues = allFormValues[defaultLangCode];
            defaultContent = langValues && typeof langValues === "object" && el.key in langValues
              ? langValues[el.key]
              : "";
          }

          const elementData = {
            name: el.name,
            type: el.type,
            parent: sectionId,
            isActive: true,
            order: index,
            defaultContent: defaultContent
          };

          const newElement = await createContentElement.mutateAsync(elementData);
          createdElements.push({ ...newElement.data, key: el.key });
        }

        updateState({ contentElements: createdElements.map((e) => ({ ...e, translations: [] })) });

        // Create translations for new elements
        const textElements = createdElements.filter((e) => e.key !== "backgroundImage");
        const translations: (Omit<ContentTranslation, "_id"> & { id?: string; })[] = [];

        Object.entries(allFormValues).forEach(([langCode, langValues]) => {
          const langId = langCodeToIdMap[langCode];
          if (!langId) return;

          for (const element of textElements) {
            if (langValues && typeof langValues === "object" && element.key in langValues) {
              translations.push({
                content: langValues[element.key],
                language: langId,
                contentElement: element._id,
                isActive: true
              });
            }
          }
        });

        if (translations.length > 0) {
          await bulkUpsertTranslations.mutateAsync(translations);
        }
      }

      // Show success message
      toast({
        title: existingSubSectionId 
          ? t('projectMoreInfo.sectionUpdatedSuccess', 'Project section updated successfully!')
          : t('projectMoreInfo.sectionCreatedSuccess', 'Project section created successfully!'),
        description: t('projectMoreInfo.allContentSaved', 'All content has been saved.')
      });

      updateState({ hasUnsavedChanges: false });

      // Update form state with saved data
      if (slug) {
        const result = await refetch();
        if (result.data?.data) {
          updateState({ dataLoaded: false });
          await processProjectData(result.data.data);
        }
      } else {
        // For new subsections, manually update form
        const updatedData = {
          ...allFormValues
        };
        
        Object.entries(updatedData).forEach(([key, value]) => {
          Object.entries(value).forEach(([field, content]) => {
            form.setValue(`${key}.${field}`, content, { shouldDirty: false });
          });
        });
      }

      return true;
    } catch (error) {
      console.error("Operation failed:", error);
      toast({
        title: existingSubSectionId 
          ? t('projectMoreInfo.errorUpdatingSection', 'Error updating project section')
          : t('projectMoreInfo.errorCreatingSection', 'Error creating project section'),
        variant: "destructive",
        description: error instanceof Error ? error.message : t('projectMoreInfo.unknownError', 'Unknown error occurred')
      });
      return false;
    } finally {
      updateState({ isSaving: false });
    }
  }, [
    existingSubSectionId,
    form,
    ParentSectionId,
    slug,
    toast,
    t,
    bulkUpsertTranslations,
    contentElements,
    createContentElement,
    createSubSection,
    defaultLangCode,
    languageIds,
    processProjectData,
    refetch,
    updateState,
    updateSubSection,
    activeLanguages
  ]);

  // Create form ref for parent component
  createFormRef(ref, {
    form,
    hasUnsavedChanges,
    setHasUnsavedChanges: (value) => updateState({ hasUnsavedChanges: value }),
    existingSubSectionId,
    contentElements,
    componentName: 'Project',
    extraMethods: {
      saveData: handleSave
    },
    extraData: {
      existingSubSectionId
    }
  });

  const languageCodes = createLanguageCodeMap(activeLanguages);

  // Loading state
  if (slug && (isLoadingData || isLoadingSubsection) && !dataLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">
          {t('projectMoreInfo.loadingData', 'Loading project section data...')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LoadingDialog 
        isOpen={isSaving} 
        title={existingSubSectionId 
          ? t('projectMoreInfo.savingUpdate', 'Updating Project Section')
          : t('projectMoreInfo.savingCreate', 'Creating Project Section')
        }
        description={t('projectMoreInfo.savingDescription', 'Please wait while we save your changes...')}
      />
      
      <Form {...form}>
        {/* Language Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {languageIds.map((langId, index) => {
          const langCode = languageCodes[langId] || langId;
          return (
            <MoreInfoLanguageCard 
              key={langId}
              langCode={langCode}
              form={form}
              isFirstLanguage={index === 0}
            />
          );
        })}
      </div>
      </Form>
      
      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <Button 
          type="button" 
          onClick={handleSave} 
          disabled={isLoadingData || isSaving}
          className="flex items-center"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('projectMoreInfo.saving', 'Saving...')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {existingSubSectionId 
                ? t('projectMoreInfo.updateContent', 'Update Project Content')
                : t('projectMoreInfo.saveContent', 'Save Project Content')
              }
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

MoreInfoForm.displayName = "MoreInfoForm";
export default MoreInfoForm;