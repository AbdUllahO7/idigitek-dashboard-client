// src/app/dashboard/heroSection/addNavigation/NavigationForm.tsx

"use client";
import {
  forwardRef,
  useEffect,
  useState,
  useRef,
  useCallback,
  Key,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Save, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Form } from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/hooks/use-toast";
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections";
import { useContentElements } from "@/src/hooks/webConfiguration/use-content-elements";
import { LoadingDialog } from "@/src/utils/MainSectionComponents";
import { ContentElement, ContentTranslation } from "@/src/api/types/hooks/content.types";
import { SubSection } from "@/src/api/types/hooks/section.types";
import { useWebsiteContext } from "@/src/providers/WebsiteContext";
import DeleteSectionDialog from "@/src/components/DeleteSectionDialog";
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-content-translations";
import { useLanguage } from "@/src/context/LanguageContext";
import { createNavigationSchema } from "../../services/addService/Utils/language-specific-schemas";
import { createLanguageCodeMap, createNavigationDefaultValues } from "../../services/addService/Utils/Language-default-values";
import { NavigationLanguageCard } from "./NavigationLanguageCard";

interface FormData {
  [key: string]: Array<{
    title?: string;
    displayText?: string;
    name?: string;
    url: string;
    order: number;
    isActive?: boolean;
    id?: string;
  }>;
}

interface NavigationFormProps {
  languageIds: string[];
  activeLanguages: any[];
  onDataChange?: (data: FormData) => void;
  slug?: string;
  ParentSectionId: string;
  type?: 'primary' | 'sub';
  initialData?: any;
}

interface NavigationFormRef {
  form: any;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  existingSubSectionId: string | null;
  contentElements: ContentElement[];
  componentName: string;
}

interface NavigationFormState {
  isLoadingData: boolean;
  dataLoaded: boolean;
  hasUnsavedChanges: boolean;
  navigationCountMismatch: boolean;
  existingSubSectionId: string | null;
  contentElements: ContentElement[];
  isSaving: boolean;
}

interface StepToDelete {
  langCode: string;
  index: number;
}

const NavigationForm = forwardRef<NavigationFormRef, NavigationFormProps>(
  ({ languageIds, activeLanguages, onDataChange, slug, ParentSectionId, type = 'primary', initialData }, ref) => {
    const { websiteId } = useWebsiteContext();
    const { t } = useTranslation();
    const formSchema = createNavigationSchema(languageIds, activeLanguages, type);
    const defaultValues = createNavigationDefaultValues(languageIds, activeLanguages, type);
    const { language } = useLanguage();

    const form = useForm<FormData>({
      resolver: zodResolver(formSchema),
      defaultValues,
      mode: "onChange",
    });

    const [state, setState] = useState<NavigationFormState>({
      isLoadingData: !!slug,
      dataLoaded: !slug,
      hasUnsavedChanges: false,
      navigationCountMismatch: false,
      existingSubSectionId: null,
      contentElements: [],
      isSaving: false,
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [stepToDelete, setStepToDelete] = useState<StepToDelete | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const updateState = useCallback(
      (newState: Partial<NavigationFormState>) => {
        setState((prev) => ({ ...prev, ...newState }));
      },
      []
    );

    const { toast } = useToast();
    const primaryLanguageRef = useRef<string | null>(null);
    const onDataChangeRef = useRef(onDataChange);

    const { useCreate: useCreateSubSection } = useSubSections();
    const {
      useCreate: useCreateContentElement,
      useUpdate: useUpdateContentElement,
      useDelete: useDeleteContentElement,
    } = useContentElements();
    const { useBulkUpsert: useBulkUpsertTranslations } = useContentTranslations();

    const createSubSection = useCreateSubSection();
    const createContentElement = useCreateContentElement();
    const updateContentElement = useUpdateContentElement();
    const deleteContentElement = useDeleteContentElement();
    const bulkUpsertTranslations = useBulkUpsertTranslations();

    useEffect(() => {
      onDataChangeRef.current = onDataChange;
    }, [onDataChange]);

    // Set primary language code
    useEffect(() => {
      if (languageIds.length > 0) {
        const primaryLangCode = activeLanguages.find(lang => lang._id === languageIds[0])?.languageID || languageIds[0];
        primaryLanguageRef.current = primaryLangCode;
      }
    }, [languageIds, activeLanguages]);

    // Track syncing to prevent infinite loops
    const isSyncing = useRef(false);

    // URL Field Syncing Effect
    useEffect(() => {
      if (!primaryLanguageRef.current) return;
      
      const subscription = form.watch((value, { name }) => {
        if (isSyncing.current) return;
        
        if (name && name.startsWith(primaryLanguageRef.current)) {
          const isUrlField = name.includes('url') || name.includes('order');
          
          if (isUrlField) {
            const matches = name.match(new RegExp(`${primaryLanguageRef.current}\\.(\\d+)\\.(.*)`));
            if (matches) {
              const [, index, fieldName] = matches;
              const newValue = value[primaryLanguageRef.current]?.[parseInt(index)]?.[fieldName];
              
              isSyncing.current = true;
              
              try {
                Object.keys(form.getValues()).forEach((langCode) => {
                  if (langCode !== primaryLanguageRef.current) {
                    form.setValue(`${langCode}.${index}.${fieldName}`, newValue, {
                      shouldDirty: false,
                      shouldValidate: false,
                    });
                  }
                });
              } finally {
                setTimeout(() => {
                  isSyncing.current = false;
                }, 10);
              }
            }
          }
        }
      });

      return () => subscription.unsubscribe();
    }, [form]);

    const validateFormNavigationCounts = useCallback(() => {
      const values = form.getValues();
      const counts = Object.values(values).map((items) => 
        Array.isArray(items) ? items.length : 0
      );
      
      if (counts.length === 0) return false;
      
      const firstCount = counts[0];
      const isValid = counts.every(count => count === firstCount);
      updateState({ navigationCountMismatch: !isValid });
      return isValid;
    }, [form, updateState]);

    const addNavigation = useCallback(
      (langCode: string) => {
        const newNavigationId = `navigation-${Date.now()}`;
        const newNavigation = {
          id: newNavigationId,
          ...(type === 'sub' ? {
            name: "",
          } : {
            title: "",
            displayText: "",
          }),
          url: "",
          order: 0,
          ...(type === 'sub' ? { isActive: true } : {})
        };

        Object.keys(form.getValues()).forEach((lang) => {
          const currentNavigations = form.getValues()[lang] || [];
          
          // For non-primary languages, sync URL from primary language
          if (lang !== primaryLanguageRef.current && currentNavigations.length > 0) {
            const primaryNavigations = form.getValues()[primaryLanguageRef.current] || [];
            const navIndex = currentNavigations.length;
            
            if (primaryNavigations[navIndex]) {
              newNavigation.url = primaryNavigations[navIndex].url || "";
              newNavigation.order = primaryNavigations[navIndex].order || 0;
            }
          }
          
          form.setValue(lang, [...currentNavigations, newNavigation], {
            shouldDirty: true,
            shouldValidate: true,
          });
        });

        validateFormNavigationCounts();
        updateState({ hasUnsavedChanges: true });
        toast({
          title: "Navigation Added",
          description: "New navigation item has been added to all languages.",
        });
      },
      [form, validateFormNavigationCounts, updateState, toast, primaryLanguageRef, type]
    );

    const confirmDeleteStep = useCallback((langCode: string, index: number) => {
      const currentNavigations = form.getValues()[langCode] || [];
      if (currentNavigations.length <= 1) {
        toast({
          title: "Cannot Remove",
          description: "You need at least one navigation item.",
          variant: "destructive",
        });
        return;
      }
      setStepToDelete({ langCode, index });
      setDeleteDialogOpen(true);
    }, [form, toast]);

    const removeNavigationStep = useCallback(async () => {
      if (!stepToDelete) return;

      const { langCode, index } = stepToDelete;
      setIsDeleting(true);

      try {
        Object.keys(form.getValues()).forEach((langCode) => {
          const updatedSteps = [...(form.getValues()[langCode] || [])];
          updatedSteps.splice(index, 1);
          form.setValue(langCode, updatedSteps, { shouldDirty: true, shouldValidate: true });
        });

        toast({
          title: "Navigation Removed",
          description: "Navigation item has been removed successfully.",
        });

        validateFormNavigationCounts();
        updateState({ hasUnsavedChanges: true });
      } catch (error) {
        console.error("Error removing navigation item:", error);
        toast({
          title: "Error Removing",
          description: "There was an error removing the navigation item.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
        setDeleteDialogOpen(false);
        setStepToDelete(null);
      }
    }, [stepToDelete, form, toast, validateFormNavigationCounts, updateState]);

    // Form watch effect
    useEffect(() => {
      if (state.isLoadingData || !state.dataLoaded) return;

      const subscription = form.watch((value) => {
        if (isSyncing.current) return;
        
        updateState({ hasUnsavedChanges: true });
        validateFormNavigationCounts();
        
        if (onDataChangeRef.current) {
          onDataChangeRef.current(value as FormData);
        }
      });

      return () => subscription.unsubscribe();
    }, [form, state.isLoadingData, state.dataLoaded, validateFormNavigationCounts, updateState]);

    const handleSave = useCallback(async () => {
      const isValid = await form.trigger();
      const hasEqualNavigationCounts = validateFormNavigationCounts();

      if (!hasEqualNavigationCounts) {
        toast({
          title: "Validation Error",
          description: "All languages must have the same number of navigation items.",
          variant: "destructive",
        });
        return;
      }

      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      updateState({ isSaving: true });

      try {
        const allFormValues = form.getValues();
        let sectionId = state.existingSubSectionId;

        if (!sectionId) {
          if (!ParentSectionId) {
            throw new Error("Parent section ID is required.");
          }

          const subsectionData = {
            name: type === 'sub' 
              ? "Sub Navigation Section"
              : "Navigation Section",
            slug: slug || `${type}-navigation-section-${Date.now()}`,
            description: type === 'sub' 
              ? "Sub navigation section for managing sub-navigation items"
              : "Navigation section for managing navigation items",
            defaultContent: "",
            isActive: true,
            order: 0,
            sectionItem: ParentSectionId,
            languages: languageIds,
            WebSiteId: websiteId,
          };

          const newSubSection = await createSubSection.mutateAsync(subsectionData);
          sectionId = newSubSection.data._id;
          updateState({ existingSubSectionId: sectionId });
        }

        if (!sectionId) {
          throw new Error("Failed to create subsection.");
        }

        const langCodeToIdMap = activeLanguages.reduce((acc: Record<string, string>, lang: { languageID: string; _id: string }) => {
          acc[lang.languageID] = lang._id;
          return acc;
        }, {});

        const firstLangKey = Object.keys(allFormValues)[0];
        const navigationCount = Array.isArray(allFormValues[firstLangKey]) ? allFormValues[firstLangKey].length : 0;
        const translations: ContentTranslation[] = [];

        for (let i = 0; i < navigationCount; i++) {
          const navigationIndex = i + 1;
          const elementNames = type === 'sub' ? {
            name: `SubNav ${navigationIndex} Name`,
            url: `SubNav ${navigationIndex} URL`,
            order: `SubNav ${navigationIndex} Order`,
            isActive: `SubNav ${navigationIndex} Active`,
          } : {
            title: `Navigation ${navigationIndex} Title`,
            displayText: `Navigation ${navigationIndex} Display Text`,
            url: `Navigation ${navigationIndex} URL`,
            order: `Navigation ${navigationIndex} Order`,
          };

          const elements: Record<string, ContentElement | null> = {};
          
          Object.keys(elementNames).forEach(key => {
            elements[key] = state.contentElements.find((el) => el.name === elementNames[key as keyof typeof elementNames]) ?? null;
          });

          const elementTypes = type === 'sub' ? [
            { type: "text", key: "name", name: elementNames.name },
            { type: "text", key: "url", name: elementNames.url },
            { type: "number", key: "order", name: elementNames.order },
            { type: "boolean", key: "isActive", name: elementNames.isActive },
          ] : [
            { type: "text", key: "title", name: elementNames.title },
            { type: "text", key: "displayText", name: elementNames.displayText },
            { type: "text", key: "url", name: elementNames.url },
            { type: "number", key: "order", name: elementNames.order },
          ];

          for (const { type: elType, key, name } of elementTypes) {
            if (!elements[key]) {
              const newElement = await createContentElement.mutateAsync({
                name,
                type: elType,
                parent: sectionId,
                isActive: true,
                order: i * elementTypes.length + elementTypes.findIndex((t) => t.key === key),
                defaultContent: elType === "number" ? "0" : elType === "boolean" ? "true" : "",
              });
              elements[key] = newElement.data;
              updateState({
                contentElements: [...state.contentElements, newElement.data],
              });
            }
          }

          Object.entries(allFormValues).forEach(([langCode, navigations]) => {
            if (!Array.isArray(navigations) || !navigations[i]) return;
            const langId = langCodeToIdMap[langCode];
            if (!langId) return;

            const navigation = navigations[i];
            
            // Standard text fields for all languages
            if (type === 'sub') {
              if (elements.name) {
                translations.push({
                  _id: "",
                  content: navigation.name || "",
                  language: langId,
                  contentElement: elements.name._id,
                  isActive: true,
                });
              }
            } else {
              if (elements.title) {
                translations.push({
                  _id: "",
                  content: navigation.title || "",
                  language: langId,
                  contentElement: elements.title._id,
                  isActive: true,
                });
              }
              if (elements.displayText) {
                translations.push({
                  _id: "",
                  content: navigation.displayText || "",
                  language: langId,
                  contentElement: elements.displayText._id,
                  isActive: true,
                });
              }
            }

            // URL and order fields - only save from primary language
            const primaryLangCode = activeLanguages[0]?.languageID;
            if (langCode === primaryLangCode) {
              if (elements.url && navigation.url && navigation.url.trim() !== "") {
                translations.push({
                  _id: "",
                  content: navigation.url.trim(),
                  language: langId,
                  contentElement: elements.url._id,
                  isActive: true,
                });
              }
              
              if (elements.order) {
                translations.push({
                  _id: "",
                  content: navigation.order?.toString() || "0",
                  language: langId,
                  contentElement: elements.order._id,
                  isActive: true,
                });
              }

              if (type === 'sub' && elements.isActive) {
                translations.push({
                  _id: "",
                  content: navigation.isActive ? "true" : "false",
                  language: langId,
                  contentElement: elements.isActive._id,
                  isActive: true,
                });
              }
            }
          });
        }

        if (translations.length > 0) {
          const batchSize = 20;
          for (let i = 0; i < translations.length; i += batchSize) {
            const batch = translations.slice(i, i + batchSize);
            await bulkUpsertTranslations.mutateAsync(batch);
          }
        }

        toast({
          title: state.existingSubSectionId 
            ? "Navigation Updated Successfully" 
            : "Navigation Created Successfully",
          description: "All navigation content has been saved successfully.",
          duration: 5000,
        });

        updateState({ hasUnsavedChanges: false, isLoadingData: false });
      } catch (error) {
        console.error("Save operation failed:", error);
        toast({
          title: state.existingSubSectionId 
            ? "Error Updating Navigation" 
            : "Error Creating Navigation",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        updateState({ isSaving: false });
      }
    }, [
      form,
      validateFormNavigationCounts,
      state.existingSubSectionId,
      ParentSectionId,
      slug,
      state.contentElements,
      activeLanguages,
      languageIds,
      createSubSection,
      createContentElement,
      bulkUpsertTranslations,
      toast,
      updateState,
      type,
    ]);

    const languageCodes = createLanguageCodeMap(activeLanguages);



    return (
      <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <LoadingDialog
          isOpen={state.isSaving}
          title={state.existingSubSectionId 
            ? "Updating Navigation" 
            : "Creating Navigation"}
          description="Please wait while we save your navigation items..."
        />

        <Form {...form}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {languageIds.map((langId: Key | null | undefined, langIndex: number) => {
              const langCode = String(langId) in languageCodes ? languageCodes[String(langId)] : String(langId);
              const isFirstLanguage = langIndex === 0;

              return (
                <NavigationLanguageCard
                  key={langId}
                  langCode={langCode}
                  isFirstLanguage={isFirstLanguage}
                  form={form}
                  addNavItem={addNavigation}
                  removeNavItem={confirmDeleteStep}
                  onDeleteStep={confirmDeleteStep}
                  type={type}
                />
              );
            })}
          </div>
        </Form>

        <div className="flex justify-end mt-6">
          {state.navigationCountMismatch && (
            <div className="flex items-center text-amber-500 mr-4">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm">All languages must have the same number of navigation items</span>
            </div>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={state.navigationCountMismatch || state.isSaving}
            className="flex items-center"
          >
            {state.isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {state.existingSubSectionId 
                  ? "Update Navigation" 
                  : "Save Navigation"}
              </>
            )}
          </Button>
        </div>

        <DeleteSectionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          serviceName={stepToDelete ? `Navigation Item ${stepToDelete.index + 1}` : ""}
          onConfirm={removeNavigationStep}
          isDeleting={isDeleting}
          title="Delete Navigation Item"
          confirmText="Delete Navigation"
        />
      </div>
    );
  }
);

NavigationForm.displayName = "NavigationForm";
export default NavigationForm;