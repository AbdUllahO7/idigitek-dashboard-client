"use client";

import { forwardRef, useEffect, useState, useRef, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections";
import { useContentElements } from "@/src/hooks/webConfiguration/use-content-elements";
import { useToast } from "@/src/hooks/use-toast";
import { Loader2, Save, Trash2 } from "lucide-react";
import { LoadingDialog } from "@/src/utils/MainSectionComponents";
import { ContentElement, ContentTranslation } from "@/src/api/types/hooks/content.types";
import { SubSection } from "@/src/api/types/hooks/section.types";
import { useWebsiteContext } from "@/src/providers/WebsiteContext";
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-content-translations";
import { createContactInformationDefaultValues, createLanguageCodeMap } from "@/src/app/dashboard/services/addService/Utils/Language-default-values";
import { processAndLoadData } from "@/src/app/dashboard/services/addService/Utils/load-form-data";
import { createFormRef } from "@/src/app/dashboard/services/addService/Utils/Expose-form-data";
import { ContactFormProps } from "@/src/api/types/sections/contact/contactSection.type";
import { ContactInformationFormLanguageCard } from "./ContactInformationFormLanguageCard";
import { createContactInformationInfoSchema } from "@/src/app/dashboard/services/addService/Utils/language-specific-schemas";
import { DeleteConfirmationDialog } from "@/src/components/DeleteConfirmationDialog";
import { useSubsectionDeleteManager } from "@/src/hooks/DeleteSubSections/useSubsectionDeleteManager";
import { useTranslation } from "react-i18next";

const ContactInformationForm = forwardRef<any, ContactFormProps>((props, ref) => {
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
  const formSchema = createContactInformationInfoSchema(languageIds, activeLanguages);
  const defaultValues = createContactInformationDefaultValues(languageIds, activeLanguages);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange" 
  });

  // State management
  const [state, setState] = useState({
    isLoadingData: !!slug, // Fixed: should be true if slug exists initially
    dataLoaded: !slug,
    hasUnsavedChanges: false,
    existingSubSectionId: null as string | null,
    contentElements: [] as ContentElement[],
    isSaving: false,
    isRefreshingAfterDelete: false,
  });

  // Use object state update for better performance and readability
  const updateState = useCallback((newState: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  // Extract state variables for readability
  const { 
    isLoadingData, 
    dataLoaded, 
    hasUnsavedChanges, 
    existingSubSectionId, 
    contentElements, 
    isSaving,
    isRefreshingAfterDelete
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


  // Process contact data from API
  const processContactData = useCallback((subsectionData: SubSection | null) => {
    processAndLoadData(
      subsectionData,
      form,
      languageIds,
      activeLanguages,
      {
        groupElements: (elements) => ({
          'contact': elements.filter(el => el.type === 'text' || (el.name === 'Background Image' && el.type === 'image'))
        }),
        processElementGroup: (groupId, elements, langId, getTranslationContent) => {
          const elementKeyMap: Record<string, keyof typeof result> = {
            Title: "title",
            Description: "description",
            Location: "location", 
            PhoneText: "phoneText",
            PhoneTextValue: "phoneTextValue",
            Email: "email",
            EmailValue: "emailValue",
            Office: "office",
            OfficeValue: "officeValue",
          };

          const result = {
            title: "",
            description: "",
            location: "",
            phoneText: "",
            phoneTextValue: "",
            email: "",
            emailValue: "",
            office: "",
            officeValue: "",
          };

          elements
            .filter((el) => el.type === "text")
            .forEach((element) => {
              const key = elementKeyMap[element.name];
              if (key) {
                result[key] = getTranslationContent(element, "") || "";
              }
            });

          return result;
        },
        getDefaultValue: () => ({
          title: '',
          description: '', 
          location: '',
          phoneText: '',
          phoneTextValue: '', 
          email: '',
          emailValue: '', 
          office: '',
          officeValue: '', 
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

  // Delete functionality using the delete manager
  const deleteManager = useSubsectionDeleteManager({
    subsectionId: existingSubSectionId,
    websiteId,
    slug,
    sectionName: t('contactInformationForm.deleteManager.sectionName', 'contact information section'),
    contentElements,
    customWarnings: [
      t('contactInformationForm.deleteManager.warning1', 'All contact information will be lost'),
      t('contactInformationForm.deleteManager.warning2', 'Phone and email details will be removed'),
      t('contactInformationForm.deleteManager.warning3', 'Office location data will be deleted')
    ],
    shouldRefetch: !!slug,
    refetchFn: refetch,
    resetForm: () => {
      form.reset(defaultValues);
    },
    resetState: () => {
      updateState({
        existingSubSectionId: null,
        contentElements: [],
        hasUnsavedChanges: false,
        dataLoaded: !slug,
      });
      dataProcessed.current = false;
    },
    onDataChange,
    onDeleteSuccess: async () => {
      // Custom success handling after deletion
      updateState({ isRefreshingAfterDelete: true });
      
      if (slug) {
        try {
          const result = await refetch();
          if (result.data?.data) {
            updateState({ isLoadingData: true });
            await processContactData(result.data.data);
            updateState({ isLoadingData: false });
            dataProcessed.current = true;
          } else {
            updateState({ 
              dataLoaded: true,
              isLoadingData: false 
            });
          }
        } catch (refetchError) {
          updateState({ 
            dataLoaded: true,
            isLoadingData: false 
          });
        }
      }
      
      updateState({ isRefreshingAfterDelete: false });
    },
  });

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
  }, [initialData, dataLoaded, defaultLangCode, form, updateState]);

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
      processContactData(completeSubsectionData.data);
      updateState({ 
        dataLoaded: true,
        isLoadingData: false
      });
      dataProcessed.current = true;
    }
  }, [completeSubsectionData, isLoadingSubsection, slug, processContactData, updateState]);

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

  // Save handler with optimized process
  const handleSave = useCallback(async () => {
    const isValid = await form.trigger();
    const allFormValues = form.getValues();

    if (!isValid) {
      toast({
        title: t('contactInformationForm.validation.error', 'Validation Error'),
        description: t('contactInformationForm.validation.fillRequired', 'Please fill all required fields correctly'),
        variant: "destructive"
      });
      return false;
    }

    updateState({ isSaving: true });

    try {
      let sectionId = existingSubSectionId;
      if (!sectionId) {
        if (!ParentSectionId) {
          throw new Error("Parent section ID is required to create a subsection");
        }

        const subsectionData = {
          name: t('contactInformationForm.subsection.name', 'Contact Information Section'),
          slug: slug || `contact-information-section-${Date.now()}`,
          description: "",
          isActive: true,
          isMain: false,
          order: 0,
          defaultContent: 'contact section',
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
        throw new Error("Failed to create or retrieve subsection ID");
      }

      const langCodeToIdMap = activeLanguages.reduce<Record<string, string>>((acc, lang) => {
        acc[lang.languageID] = lang._id;
        return acc;
      }, {});

    if (contentElements.length > 0) {
  const textElements = contentElements.filter((e) => e.type === "text");
  const translations: (Omit<ContentTranslation, "_id"> & { id?: string; })[] = [];
  const elementNameToKeyMap: Record<string, keyof typeof allFormValues[string]> = {
    'Title': 'title',
    'Description': 'description', 
    'Location': 'location',
    'PhoneText': 'phoneText',
    'PhoneTextValue': 'phoneTextValue',
    'Email': 'email',
    'EmailValue': 'emailValue', 
    'Office': 'office',
    'OfficeValue': 'officeValue', 
  };

  Object.entries(allFormValues).forEach(([langCode, values]) => {
    const langId = langCodeToIdMap[langCode];
    if (!langId) return;

    textElements.forEach((element) => {
      const key = elementNameToKeyMap[element.name];
      if (key && values && typeof values === "object" && key in values) {
        const content = values[key];
        
        // ✅ FIX: Only create translation if content is not empty
        if (content && typeof content === 'string' && content.trim() !== '') {
          translations.push({
            content: content.trim(),
            language: langId,
            contentElement: element._id,
            isActive: true
          });
        }
      }
    });
  });

  if (translations.length > 0) {
    await bulkUpsertTranslations.mutateAsync(translations);
  }
} else {
        const elementTypes = [
          { type: "text", key: "title", name: "Title" },
          { type: "text", key: "description", name: "Description" }, 
          { type: "text", key: "location", name: "Location" }, 
          { type: "text", key: "phoneText", name: "PhoneText" },
          { type: "text", key: "phoneTextValue", name: "PhoneTextValue" }, 
          { type: "text", key: "email", name: "Email" },
          { type: "text", key: "emailValue", name: "EmailValue" }, 
          { type: "text", key: "office", name: "Office" },
          { type: "text", key: "officeValue", name: "OfficeValue" }, 
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

      toast({
        title: existingSubSectionId 
          ? t('contactInformationForm.success.updated', 'Contact information updated successfully!')
          : t('contactInformationForm.success.created', 'Contact information created successfully!'),
        description: t('contactInformationForm.success.saved', 'All content has been saved.')
      });

      updateState({ hasUnsavedChanges: false });

      if (slug) {
        const result = await refetch();
        if (result.data?.data) {
          updateState({ dataLoaded: false });
          await processContactData(result.data.data);
        }
      }

      return true;
    } catch (error) {
      console.error("Operation failed:", error);
      toast({
        title: existingSubSectionId 
          ? t('contactInformationForm.error.updating', 'Error updating contact information')
          : t('contactInformationForm.error.creating', 'Error creating contact information'),
        variant: "destructive",
        description: error instanceof Error ? error.message : t('contactInformationForm.error.unknown', 'Unknown error occurred')
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
    processContactData,
    refetch,
    updateState,
    updateSubSection,
    activeLanguages,
    websiteId
  ]);

  // Create form ref for parent component
  createFormRef(ref, {
    form,
    hasUnsavedChanges,
    setHasUnsavedChanges: (value) => updateState({ hasUnsavedChanges: value }),
    existingSubSectionId,
    contentElements,
    componentName: 'ContactInformation',
    extraMethods: {
      saveData: handleSave,
      deleteData: deleteManager.handleDelete,
    },
    extraData: {
      existingSubSectionId
    }
  });

  const languageCodes = createLanguageCodeMap(activeLanguages);

  return (
    <div className="space-y-6">
      {/* Loading Dialogs */}
      <LoadingDialog 
        isOpen={isSaving} 
        title={existingSubSectionId 
          ? t('contactInformationForm.loading.updating', 'Updating Contact Information')
          : t('contactInformationForm.loading.creating', 'Creating Contact Information')
        }
        description={t('contactInformationForm.loading.saveDescription', 'Please wait while we save your changes...')}
      />
      
      <LoadingDialog
        isOpen={deleteManager.isDeleting}
        title={t('contactInformationForm.loading.deleting', 'Deleting Contact Information')}
        description={t('contactInformationForm.loading.deleteDescription', 'Please wait while we delete the contact information...')}
      />

      <LoadingDialog
        isOpen={isRefreshingAfterDelete}
        title={t('contactInformationForm.loading.refreshing', 'Refreshing Data')}
        description={t('contactInformationForm.loading.refreshDescription', 'Updating the interface after deletion...')}
      />

      {/* Delete Confirmation Dialog */}
      {/* <DeleteConfirmationDialog
        {...deleteManager.confirmationDialogProps}
        title={t('contactInformationForm.delete.title', 'Delete Contact Information')}
        description={t('contactInformationForm.delete.description', 'Are you sure you want to delete this contact information section? This action cannot be undone.')}
      /> */}

      <Form {...form}>
        {/* Language Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languageIds.map((langId, index) => {
            const langCode = languageCodes[langId] || langId;
            return (
              <ContactInformationFormLanguageCard 
                key={langId}
                langCode={langCode}
                form={form}
                isFirstLanguage={index === 0}
              />
            );
          })}
        </div>
      </Form>

      {/* Action Buttons */}
      <div className="flex justify-end items-center mt-6">
        {/* Delete Button - Only show if there's an existing subsection */}
        {/* {existingSubSectionId && (
          <Button
            type="button"
            variant="destructive"
            onClick={deleteManager.openDeleteDialog}
            disabled={isLoadingData || isSaving || deleteManager.isDeleting || isRefreshingAfterDelete}
            className="flex items-center"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('contactInformationForm.button.delete', 'Delete Contact Information')}
          </Button>
        )} */}

        {/* Save Button */}
        <div className={existingSubSectionId ? "" : "ml-auto"}>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={isSaving || deleteManager.isDeleting || isRefreshingAfterDelete}
            className="flex items-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('contactInformationForm.button.saving', 'Saving...')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {existingSubSectionId 
                  ? t('contactInformationForm.button.update', 'Update Contact Information')
                  : t('contactInformationForm.button.save', 'Save Contact Information')
                }
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

ContactInformationForm.displayName = "ContactInformationForm";
export default ContactInformationForm;