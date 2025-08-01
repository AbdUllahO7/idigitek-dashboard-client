"use client";

import { forwardRef, useEffect, useState, useRef, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next"; // or your i18n hook
import { Form } from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections";
import { useContentElements } from "@/src/hooks/webConfiguration/use-content-elements";
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-content-translations";
import { useToast } from "@/src/hooks/use-toast";
import { createLanguageCodeMap } from "../../Utils/language-utils";
import { processAndLoadData } from "../../Utils/load-form-data";
import { Loader2, Save, Trash2 } from "lucide-react";
import { LoadingDialog } from "@/src/utils/MainSectionComponents";
import { OverviewCard } from "./OverviewCard";
import { useWebsiteContext } from "@/src/providers/WebsiteContext";
import { ContentElement, ContentTranslation } from "@/src/api/types/hooks/content.types";
import { SubSection } from "@/src/api/types/hooks/section.types";
import { DeleteConfirmationDialog } from "@/src/components/DeleteConfirmationDialog";
import { useSubsectionDeleteManager } from "@/src/hooks/DeleteSubSections/useSubsectionDeleteManager";

interface OverviewFormProps {
    languageIds: string[];
    activeLanguages: Array<{ _id: string; languageID: string; }>;
    onDataChange?: (data: any) => void;
    slug?: string;
    ParentSectionId?: string;
    initialData?: {
        description?: string;
    };
}

const OverviewForm = forwardRef<any, OverviewFormProps>((props, ref) => {
    const { t } = useTranslation(); // i18n hook
    const { 
        languageIds, 
        activeLanguages, 
        onDataChange, 
        slug, 
        ParentSectionId,
        initialData 
    } = props;

    const { websiteId } = useWebsiteContext();

    // Create language code mapping first
    const languageCodes = createLanguageCodeMap(activeLanguages);

    // Create schema for overview form (description only)
    const createOverviewSchema = (langIds: string[], activeLangs: any[]) => {
        const { z } = require("zod");
        
        const languageSchema = z.object({
            description: z.string().min(1, t('overviewForm.overviewCard.fields.description.label') + " is required")
        });

        const schemaObject: Record<string, any> = {};
        
        // Use languageCodes mapping to ensure consistency
        langIds.forEach(langId => {
            const langCode = languageCodes[langId] || langId;
            schemaObject[langCode] = languageSchema;
        });

        return z.object(schemaObject);
    };

    // Create default values for all languages
    const createDefaultValues = () => {
        const defaultValues: Record<string, any> = {};
        languageIds.forEach(langId => {
            const langCode = languageCodes[langId] || langId;
            defaultValues[langCode] = {
                description: ""
            };
        });
        return defaultValues;
    };

    // Setup form with schema validation and default values
    const formSchema = createOverviewSchema(languageIds, activeLanguages);
    
    const form = useForm({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: createDefaultValues()
    });

    // Enhanced state management with delete-related states
    const [state, setState] = useState({
        isLoadingData: !!slug, // Fixed: should be true if slug exists initially
        dataLoaded: !slug,
        hasUnsavedChanges: false,
        existingSubSectionId: null as string | null,
        contentElements: [] as ContentElement[],
        isSaving: false,
        isRefreshingAfterDelete: false,
    });

    const updateState = useCallback((newState: Partial<typeof state>) => {
        setState(prev => ({ ...prev, ...newState }));
    }, []);

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

    // Process overview data from API
    const processOverviewData = useCallback((subsectionData: SubSection | null) => {
        processAndLoadData(
            subsectionData,
            form,
            languageIds,
            activeLanguages,
            {
                groupElements: (elements) => ({
                    'overview': elements.filter(el => el.type === 'text')
                }),
                processElementGroup: (groupId, elements, langId, getTranslationContent) => {
                    const result = {
                        description: ''
                    };
                    
                    elements.filter(el => el.type === 'text').forEach(element => {
                        if (element.name === 'Description') {
                            result.description = getTranslationContent(element, '');
                        }
                    });
                    
                    return result;
                },
                getDefaultValue: () => ({
                    description: ''
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
        sectionName: t('overviewForm.deleteDialog.title'),
        contentElements,
        customWarnings: [
            "All overview descriptions will be permanently deleted",
            "Overview content for all languages will be removed",
            "This may affect the main description on your website"
        ],
        shouldRefetch: !!slug,
        refetchFn: refetch,
        resetForm: () => {
            form.reset(createDefaultValues());
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
                        await processOverviewData(result.data.data);
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
                // Set for the default language first
                const defaultLangCodeMapped = languageCodes[activeLanguages[0]?._id] || defaultLangCode;
                form.setValue(`${defaultLangCodeMapped}.description`, initialData.description);
            }
            
            updateState({ 
                dataLoaded: true, 
                hasUnsavedChanges: false 
            });
        }
    }, [initialData, dataLoaded, defaultLangCode, form, languageCodes, activeLanguages, updateState]);

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
            processOverviewData(completeSubsectionData.data);
            updateState({ 
                dataLoaded: true,
                isLoadingData: false
            });
            dataProcessed.current = true;
        }
    }, [completeSubsectionData, isLoadingSubsection, slug, processOverviewData, updateState]);

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

    // Save handler
    const handleSave = useCallback(async () => {
        try {
            const allFormValues = form.getValues();
            
            const isValid = await form.trigger();
            
            // Check if all required fields have values
            const hasEmptyFields = Object.entries(allFormValues).some(([langCode, values]) => {
                return !values || typeof values !== "object" || !values.description || values.description.trim() === "";
            });

            if (!isValid || hasEmptyFields) {
                toast({
                    title: t('overviewForm.validation.error.title'), 
                    description: t('overviewForm.validation.error.description'),
                    variant: "destructive"
                });
                return false;
            }

            updateState({ isSaving: true });
            
            // Step 1: Create or update subsection
            let sectionId = existingSubSectionId;
            if (!sectionId) {
                if (!ParentSectionId) {
                    throw new Error(t('overviewForm.errors.parentSectionRequired'));
                }
                
                const subsectionData = {
                    name: "Overview Section",
                    slug: slug || `overview-section-${Date.now()}`,
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
                throw new Error(t('overviewForm.errors.failedToCreateSection'));
            }

            // Step 2: Map language codes to IDs (reverse mapping)
            const langCodeToIdMap = activeLanguages.reduce<Record<string, string>>((acc, lang) => {
                const langCode = languageCodes[lang._id] || lang.languageID;
                acc[langCode] = lang._id;
                return acc;
            }, {});

            // Step 3: Handle existing content or create new content
            if (contentElements.length > 0) {
                // Update translations for existing text elements
                const textElements = contentElements.filter((e) => e.type === "text");
                const translations: (Omit<ContentTranslation, "_id"> & { id?: string; })[] = [];

                Object.entries(allFormValues).forEach(([langCode, values]) => {
                    const langId = langCodeToIdMap[langCode];
                    if (!langId) return;
                    
                    textElements.forEach((element) => {
                        if (element.name === 'Description' && values && typeof values === "object" && 'description' in values) {
                            translations.push({
                                content: values.description,
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
                // Create new content element for description
                const defaultLangCodeMapped = languageCodes[activeLanguages[0]?._id] || activeLanguages[0]?.languageID || 'en';
                const defaultContent = typeof allFormValues[defaultLangCodeMapped] === "object" && allFormValues[defaultLangCodeMapped]
                    ? allFormValues[defaultLangCodeMapped].description || ""
                    : "";

                const elementData = {
                    name: "Description",
                    type: "text",
                    parent: sectionId,
                    isActive: true,
                    order: 0,
                    defaultContent: defaultContent
                };

                const newElement = await createContentElement.mutateAsync(elementData);
                const createdElement = { ...newElement.data, key: "description" };

                updateState({ contentElements: [{ ...createdElement, translations: [] }] });

                // Create translations for new element
                const translations: (Omit<ContentTranslation, "_id"> & { id?: string; })[] = [];
                
                Object.entries(allFormValues).forEach(([langCode, langValues]) => {
                    const langId = langCodeToIdMap[langCode];
                    if (!langId) return;
                    
                    if (langValues && typeof langValues === "object" && 'description' in langValues) {
                        translations.push({
                            content: langValues.description,
                            language: langId,
                            contentElement: createdElement._id,
                            isActive: true
                        });
                    }
                });

                if (translations.length > 0) {
                    await bulkUpsertTranslations.mutateAsync(translations);
                }
            }

            // Show success message
            const successMessage = existingSubSectionId 
                ? t('overviewForm.toasts.success.updated')
                : t('overviewForm.toasts.success.created');

            toast({
                title: successMessage,
                description: t('overviewForm.toasts.success.description')
            });

            updateState({ hasUnsavedChanges: false });

            // Update form state with saved data
            if (slug) {
                const result = await refetch();
                if (result.data?.data) {
                    updateState({ dataLoaded: false });
                    await processOverviewData(result.data.data);
                }
            } else {
                // For new subsections, manually update form
                Object.entries(allFormValues).forEach(([key, value]) => {
                    if (typeof value === "object" && value && 'description' in value) {
                        form.setValue(`${key}.description`, value.description, { shouldDirty: false });
                    }
                });
            }

            return true;
        } catch (error) {
            console.error("Save operation failed:", error);
            const errorMessage = existingSubSectionId 
                ? t('overviewForm.toasts.error.updated')
                : t('overviewForm.toasts.error.created');

            toast({
                title: errorMessage,
                variant: "destructive",
                description: error instanceof Error ? error.message : t('overviewForm.errors.unknownError')
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
        processOverviewData, 
        refetch, 
        updateState, 
        updateSubSection, 
        activeLanguages,
        websiteId,
        languageCodes
    ]);

    // Create form ref for parent component
    const createFormRef = (refToSet: any, config: any) => {
        if (refToSet) {
            if (typeof refToSet === 'function') {
                refToSet(config);
            } else {
                refToSet.current = config;
            }
        }
    };

    createFormRef(ref, {
        form,
        hasUnsavedChanges,
        setHasUnsavedChanges: (value: boolean) => updateState({ hasUnsavedChanges: value }),
        existingSubSectionId,
        contentElements,
        componentName: 'Overview',
        extraMethods: {
            saveData: handleSave,
            deleteData: deleteManager.handleDelete,
        },
        extraData: {
            existingSubSectionId
        }
    });

    return (
        <div className="space-y-6">
            {/* Loading Dialogs */}
            <LoadingDialog 
                isOpen={isSaving} 
                title={existingSubSectionId 
                    ? t('overviewForm.loadingDialogs.updating.title')
                    : t('overviewForm.loadingDialogs.creating.title')
                }
                description={existingSubSectionId 
                    ? t('overviewForm.loadingDialogs.updating.description')
                    : t('overviewForm.loadingDialogs.creating.description')
                }
            />
            
            <LoadingDialog
                isOpen={deleteManager.isDeleting}
                title={t('overviewForm.loadingDialogs.deleting.title')}
                description={t('overviewForm.loadingDialogs.deleting.description')}
            />

            <LoadingDialog
                isOpen={isRefreshingAfterDelete}
                title={t('overviewForm.loadingDialogs.refreshing.title')}
                description={t('overviewForm.loadingDialogs.refreshing.description')}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                {...deleteManager.confirmationDialogProps}
                title={t('overviewForm.deleteDialog.title')}
                description={t('overviewForm.deleteDialog.description')}
            />
            
            <Form {...form}>
                {/* Language Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {languageIds.map((langId) => {
                        const langCode = languageCodes[langId] || langId;
                        return (
                            <OverviewCard 
                                key={langId}
                                langCode={langCode}
                                form={form}
                            />
                        );
                    })}
                </div>
            </Form>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
                {/* Delete Button - Only show if there's an existing subsection */}
                {existingSubSectionId && (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={deleteManager.openDeleteDialog}
                        disabled={isLoadingData || isSaving || deleteManager.isDeleting || isRefreshingAfterDelete}
                        className="flex items-center"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('overviewForm.buttons.delete')}
                    </Button>
                )}

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
                                {t('overviewForm.buttons.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {existingSubSectionId 
                                    ? t('overviewForm.buttons.update')
                                    : t('overviewForm.buttons.save')
                                }
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
});

OverviewForm.displayName = "OverviewForm";
export default OverviewForm;