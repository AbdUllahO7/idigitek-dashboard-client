"use client";

import { forwardRef, useEffect, useState, useRef, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, AlertTriangle, Loader2 } from "lucide-react";
import { Form } from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections";
import { useContentElements } from "@/src/hooks/webConfiguration/use-conent-elements";
import { useContentTranslations } from "@/src/hooks/webConfiguration/use-conent-translitions";
import { useToast } from "@/src/hooks/use-toast";
import { createBenefitsSchema } from "../../Utils/language-specifi-schemas";
import { createBenefitsDefaultValues } from "../../Utils/Language-default-values";
import { createFormRef, getAvailableIcons, getBenefitCountsByLanguage, getSafeIconValue, useForceUpdate, validateBenefitCounts } from "../../Utils/Expose-form-data";
import { processAndLoadData } from "../../Utils/load-form-data";
import { createLanguageCodeMap } from "../../Utils/language-utils";
import { ValidationDialog } from "./ValidationDialog";
import { LanguageCard } from "./LanguageCard";
import { LoadingDialog } from "@/src/utils/MainSectionComponents";
import DeleteServiceDialog from "@/src/components/DeleteServiceDialog";




/**
 * BenefitsForm Component - Improved version with better performance and component structure
 */
interface BenefitsFormProps {
  languageIds: string[];
  activeLanguages: { languageID: string; _id: string }[];
  onDataChange?: (data: any) => void;
  slug?: string;
  ParentSectionId?: string;
}

const BenefitsForm = forwardRef<any, BenefitsFormProps>((props, ref) => {
  const { 
    languageIds, 
    activeLanguages, 
    onDataChange, 
    slug, 
    ParentSectionId 
  } = props;

  // Setup form with schema validation
  const formSchema = createBenefitsSchema(languageIds, activeLanguages);
  const defaultValues = createBenefitsDefaultValues(languageIds, activeLanguages);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange" // Enable validation on change for better UX
  });

  // State management using a single state object for better maintenance
  const [state, setState] = useState({
    isLoadingData: !slug,
    dataLoaded: !slug,
    hasUnsavedChanges: false,
    isValidationDialogOpen: false,
    benefitCountMismatch: false,
    existingSubSectionId: null,
    contentElements: [],
    isSaving: false
  });
    // State for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stepToDelete, setStepToDelete] = useState<{ langCode: string, index: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


  // Use object state update for better performance
  const updateState = useCallback((newState) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  // Extract state variables for readability
  const { 
    isLoadingData, 
    dataLoaded, 
    hasUnsavedChanges, 
    isValidationDialogOpen,
    benefitCountMismatch,
    existingSubSectionId, 
    contentElements, 
    isSaving 
  } = state;

  

  // Hooks
  const { toast } = useToast();
  const forceUpdate = useForceUpdate();
  const primaryLanguageRef = useRef<string | null>(null);
  const onDataChangeRef = useRef(onDataChange);
  
  // API hooks
  const { useCreate: useCreateSubSection, useGetCompleteBySlug } = useSubSections();
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

  // Query for complete subsection data by slug if provided
  const {
    data: completeSubsectionData,
    isLoading: isLoadingSubsection,
    refetch,
  } = useGetCompleteBySlug(slug || "", Boolean(slug));

  // Update reference when onDataChange changes
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  // Set primary language when languageIds change
  useEffect(() => {
    if (languageIds.length > 0) {
      primaryLanguageRef.current = languageIds[0];
    }
  }, [languageIds]);

  // Function to synchronize icon changes from the first language to all other languages
  const syncIcons = useCallback((index: number, iconValue: any) => {
    const formValues = form.getValues();
    const allLanguages = Object.keys(formValues);
    const primaryLang = allLanguages[0]; // First language is primary
    
    allLanguages.forEach(lang => {
      if (lang !== primaryLang) {
        if (formValues[lang] && Array.isArray(formValues[lang]) && formValues[lang].length > index) {
          form.setValue(`${lang}.${index}.icon`, iconValue);
        }
      }
    });
  }, [form]);

  // Check if all languages have the same number of benefits
  const validateFormBenefitCounts = useCallback(() => {
    const values = form.getValues();
    const isValid = validateBenefitCounts(values);
    updateState({ benefitCountMismatch: !isValid });
    return isValid;
  }, [form, updateState]);

  // Function to process and load data into the form
  const processBenefitsData = useCallback((subsectionData) => {
    console.log("Processing benefits data:", subsectionData);
    
    processAndLoadData(
      subsectionData,
      form,
      languageIds,
      activeLanguages,
      {
        // Group elements by benefit number
        groupElements: (elements) => {
          const benefitGroups: { [key: number]: any[] } = {};
          elements.forEach((element) => {
            const match = element.name.match(/Benefit (\d+)/i);
            if (match) {
              const benefitNumber = parseInt(match[1], 10);
              if (!benefitGroups[benefitNumber]) {
                benefitGroups[benefitNumber] = [];
              }
              benefitGroups[benefitNumber].push(element);
            }
          });
          return benefitGroups;
        },
        
        // Process a benefit group for a language
        processElementGroup: (benefitNumber, elements, langId, getTranslationContent) => {
          const iconElement = elements.find(el => el.name.includes("Icon"));
          const titleElement = elements.find(el => el.name.includes("Title"));
          const descriptionElement = elements.find(el => el.name.includes("Description"));
          
          if (titleElement && descriptionElement) {
            const title = getTranslationContent(titleElement, "");
            const description = getTranslationContent(descriptionElement, "");
            const icon = iconElement?.defaultContent || "Clock";
            
            return { icon, title, description };
          }
          
          return { icon: "Clock", title: "", description: "" };
        },
        
        // Default value for benefits
        getDefaultValue: () => [{
          icon: "Clock",
          title: "",
          description: ""
        }]
      },
      {
        setExistingSubSectionId: (id) => updateState({ existingSubSectionId: id }),
        setContentElements: (elements) => updateState({ contentElements: elements }),
        setDataLoaded: (loaded) => updateState({ dataLoaded: loaded }),
        setHasUnsavedChanges: (hasChanges) => updateState({ hasUnsavedChanges: hasChanges }),
        setIsLoadingData: (loading) => updateState({ isLoadingData: loading }),
        validateCounts: validateFormBenefitCounts
      }
    );
  }, [form, languageIds, activeLanguages, updateState, validateFormBenefitCounts]);

  // Effect to populate form with existing data from complete subsection
  useEffect(() => {
    // Skip this effect entirely if no slug is provided
    if (!slug) {
      return;
    }

    if (dataLoaded || isLoadingSubsection || !completeSubsectionData?.data) {
      return;
    }

    updateState({ isLoadingData: true });
    processBenefitsData(completeSubsectionData.data);
  }, [completeSubsectionData, isLoadingSubsection, dataLoaded, slug, processBenefitsData]);

  // Track form changes, but only after initial data is loaded
  useEffect(() => {
    if (isLoadingData || !dataLoaded) return;

    const subscription = form.watch((value) => {
      updateState({ hasUnsavedChanges: true });
      validateFormBenefitCounts();
      if (onDataChangeRef.current) {
        onDataChangeRef.current(value);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, isLoadingData, dataLoaded, validateFormBenefitCounts, updateState]);

  // Function to add a new benefit
  const addBenefit = useCallback((langCode: string | readonly string[] | undefined) => {
    const currentBenefits = form.getValues()[langCode] || [];
    
    // Add to the specified language
    form.setValue(langCode, [
      ...currentBenefits,
      {
        icon: "Clock",
        title: "",
        description: "",
      },
    ]);
    
    // If this is the first language, add to all languages to maintain consistency
    const formValues = form.getValues();
    const allLanguages = Object.keys(formValues);
    const firstLang = allLanguages[0];
    
    if (langCode === firstLang) {
      // Add to all other languages too
      allLanguages.forEach(lang => {
        if (lang !== firstLang) {
          const otherLangBenefits = formValues[lang] || [];
          form.setValue(lang, [
            ...otherLangBenefits,
            {
              icon: "Clock",
              title: "",
              description: "",
            },
          ]);
        }
      });
    }
    
    // Force update the form to ensure React re-renders
    form.trigger(langCode);
    forceUpdate();
    
    // Force immediate validation after adding a benefit
    setTimeout(() => {
      const isValid = validateFormBenefitCounts();
      console.log(`Added benefit to ${langCode}, mismatch: ${!isValid}`);
      updateState({ benefitCountMismatch: !isValid });
    }, 0);
  }, [form, forceUpdate, validateFormBenefitCounts, updateState]);

  // Function to remove a benefit
  const removeBenefit = useCallback(async (langCode, index) => {
    const currentBenefits = form.getValues()[langCode] || [];
    if (currentBenefits.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one benefit",
        variant: "destructive",
      });
      return;
    }

    // Get all languages
    const formValues = form.getValues();
    const allLanguages = Object.keys(formValues);
    const firstLang = allLanguages[0];
    const isFirstLanguage = langCode === firstLang;

    // If we have existing content elements and a subsection ID, delete the elements from the database
    if (existingSubSectionId && contentElements.length > 0) {
      try {
        // Find the benefit number (1-based index)
        const benefitNumber = index + 1;

        // Find elements associated with this benefit
        const benefitElements = contentElements.filter((element) => {
          const match = element.name.match(/Benefit (\d+)/i);
          return match && Number.parseInt(match[1]) === benefitNumber;
        });

        if (benefitElements.length > 0) {
          // Delete each element
          for (const element of benefitElements) {
            try {
              await deleteContentElement.mutateAsync(element._id);
              console.log(`Deleted content element: ${element.name}`);
            } catch (error) {
              console.error(`Failed to delete content element ${element.name}:`, error);
            }
          }

          // Update the contentElements state to remove the deleted elements
          updateState({
            contentElements: contentElements.filter((element) => {
              const match = element.name.match(/Benefit (\d+)/i);
              return !(match && Number.parseInt(match[1]) === benefitNumber);
            })
          });

          toast({
            title: "Benefit deleted",
            description: `Benefit ${benefitNumber} has been deleted from the database`,
          });
        }

        // Renumber the remaining benefit elements in the database
        const remainingElements = contentElements.filter((element) => {
          const match = element.name.match(/Benefit (\d+)/i);
          return match && Number.parseInt(match[1]) > benefitNumber;
        });

        // Update the names and orders of the remaining elements
        for (const element of remainingElements) {
          const match = element.name.match(/Benefit (\d+)/i);
          if (match) {
            const oldNumber = Number.parseInt(match[1]);
            const newNumber = oldNumber - 1;
            const newName = element.name.replace(`Benefit ${oldNumber}`, `Benefit ${newNumber}`);
            const newOrder = element.order - 3; // Assuming icon, title, and description are consecutive

            try {
              await updateContentElement.mutateAsync({
                id: element._id,
                data: {
                  name: newName,
                  order: newOrder,
                },
              });
              console.log(`Updated element ${element.name} to ${newName}`);
            } catch (error) {
              console.error(`Failed to update element ${element.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error removing benefit elements:", error);
        toast({
          title: "Error removing benefit",
          description: "There was an error removing the benefit from the database",
          variant: "destructive",
        });
      }
    }

    // If removing from first language, remove from all languages
    if (isFirstLanguage) {
      allLanguages.forEach(lang => {
        const langBenefits = form.getValues()[lang] || [];
        if (langBenefits.length > index) {
          const updatedBenefits = [...langBenefits];
          updatedBenefits.splice(index, 1);
          form.setValue(lang, updatedBenefits);
          form.trigger(lang);
        }
      });
    } else {
      // Just remove from this specific language
      const updatedBenefits = [...currentBenefits];
      updatedBenefits.splice(index, 1);
      form.setValue(langCode, updatedBenefits);
      form.trigger(langCode);
    }
    
    forceUpdate();
    
    // Force immediate validation after removing a benefit
    setTimeout(() => {
      const isValid = validateFormBenefitCounts();
      console.log(`Removed benefit from ${langCode}, mismatch: ${!isValid}`);
      updateState({ benefitCountMismatch: !isValid });
    }, 0);
  }, [form, existingSubSectionId, contentElements, deleteContentElement, updateContentElement, toast, forceUpdate, validateFormBenefitCounts, updateState]);

  // Save handler with optimized process
  const handleSave = useCallback(async () => {
    const isValid = await form.trigger();
    const hasEqualBenefitCounts = validateFormBenefitCounts();
  
    if (!hasEqualBenefitCounts) {
      updateState({ isValidationDialogOpen: true });
      return;
    }
  
    if (!isValid) return;
  
    updateState({ isSaving: true, isLoadingData: true });
    try {
      const allFormValues = form.getValues();
      console.log("Form values at save:", allFormValues);
  
      // Step 1: Create or update subsection
      let sectionId = existingSubSectionId;
      if (!sectionId) {
        if (!ParentSectionId) {
          throw new Error("Parent section ID is required to create a subsection");
        }
        
        const subsectionData = {
          name: "Benefits Section",
          slug: slug || `benefits-section-${Date.now()}`,
          description: "Benefits section for the website",
          isActive: true,
          order: 0,
          sectionItem: ParentSectionId,
          languages: languageIds,
        };
  
        const newSubSection = await createSubSection.mutateAsync(subsectionData);
        sectionId = newSubSection.data._id;
        updateState({ existingSubSectionId: sectionId });
      }
  
      if (!sectionId) {
        throw new Error("Failed to create or retrieve subsection ID");
      }
  
      // Step 2: Map language codes to IDs
      const langCodeToIdMap = activeLanguages.reduce((acc, lang) => {
        acc[lang.languageID] = lang._id;
        return acc;
      }, {});
  
      // Step 3: Process benefits
      const firstLangKey = Object.keys(allFormValues)[0];
      const benefitCount = Array.isArray(allFormValues[firstLangKey]) ? allFormValues[firstLangKey].length : 0;
      const translations = [];
  
      for (let i = 0; i < benefitCount; i++) {
        const benefitIndex = i + 1;
        const iconElementName = `Benefit ${benefitIndex} - Icon`;
        const titleElementName = `Benefit ${benefitIndex} - Title`;
        const descElementName = `Benefit ${benefitIndex} - Description`;
  
        // Get a safe icon value with fallbacks
        const iconValue = getSafeIconValue(allFormValues, i);
  
        // Find or create icon element
        let iconElement = contentElements.find((el) => el.name === iconElementName);
        if (!iconElement) {
          const newElement = await createContentElement.mutateAsync({
            name: iconElementName,
            type: "text",
            parent: sectionId,
            isActive: true,
            order: i * 3,
            defaultContent: iconValue,
          });
          iconElement = newElement.data;
          updateState({ contentElements: [...contentElements, iconElement] });
        } else {
          await updateContentElement.mutateAsync({
            id: iconElement._id,
            data: { defaultContent: iconValue },
          });
        }
  
        // Find or create title element
        let titleElement = contentElements.find((el) => el.name === titleElementName);
        if (!titleElement) {
          const newElement = await createContentElement.mutateAsync({
            name: titleElementName,
            type: "text",
            parent: sectionId,
            isActive: true,
            order: i * 3 + 1,
            defaultContent: "",
          });
          titleElement = newElement.data;
          updateState({ contentElements: [...contentElements, titleElement] });
        }
  
        // Find or create description element
        let descElement = contentElements.find((el) => el.name === descElementName);
        if (!descElement) {
          const newElement = await createContentElement.mutateAsync({
            name: descElementName,
            type: "text",
            parent: sectionId,
            isActive: true,
            order: i * 3 + 2,
            defaultContent: "",
          });
          descElement = newElement.data;
          updateState({ contentElements: [...contentElements, descElement] });
        }
  
        // Collect translations for all languages
        Object.entries(allFormValues).forEach(([langCode, benefits]) => {
          if (!Array.isArray(benefits) || !benefits[i]) return;
          const langId = langCodeToIdMap[langCode];
          if (!langId) return;
  
          const benefit = benefits[i];
          if (titleElement) {
            translations.push({
              content: benefit.title,
              language: langId,
              contentElement: titleElement._id,
              isActive: true,
            });
          }
          if (descElement) {
            translations.push({
              content: benefit.description,
              language: langId,
              contentElement: descElement._id,
              isActive: true,
            });
          }
          // Note: Icon translations are not typically needed since it's a default content
        });
      }

  
      // Bulk upsert translations
      if (translations.length > 0) {
        console.log(`Upserting ${translations.length} translations`);
        await bulkUpsertTranslations.mutateAsync(translations);
      }
  
      toast({
        title: existingSubSectionId
          ? "Benefits section updated successfully!"
          : "Benefits section created successfully!",
      });
  
      // Refresh data after save
      if (slug) {
        try {
          // Reset form states to trigger a fresh load
          updateState({ isLoadingData: true, dataLoaded: false });
          
          // Refetch data from the server
          const result = await refetch();
          
          // Process the refreshed data if available
          if (result.data?.data) {
            console.log("Refreshed data retrieved:", result.data.data);
            processBenefitsData(result.data.data);
          } else {
            console.error("No data returned from refetch");
            updateState({ isLoadingData: false });
          }
        } catch (error) {
          console.error("Error refreshing data:", error);
          updateState({ isLoadingData: false });
        }
      } else {
        // For new forms, just mark as not having unsaved changes
        updateState({ hasUnsavedChanges: false, isLoadingData: false });
      }
    } catch (error) {
      console.error("Operation failed:", error);
      toast({
        title: existingSubSectionId ? "Error updating benefits section" : "Error creating benefits section",
        variant: "destructive",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      updateState({ isLoadingData: false });
    } finally {
      updateState({ isSaving: false });
    }
  }, [
    form, 
    validateFormBenefitCounts, 
    existingSubSectionId, 
    ParentSectionId, 
    slug, 
    contentElements, 
    activeLanguages, 
    languageIds, 
    createSubSection, 
    createContentElement, 
    updateContentElement, 
    bulkUpsertTranslations, 
    toast, 
    refetch, 
    processBenefitsData, 
    updateState
  ]);

  // Create form ref for parent component
  createFormRef(ref, {
    form,
    hasUnsavedChanges,
    setHasUnsavedChanges: (value) => updateState({ hasUnsavedChanges: value }),
    existingSubSectionId,
    contentElements,
    componentName: 'Benefits'
  });

  // Get language codes for display
  const languageCodes = createLanguageCodeMap(activeLanguages);

  // Force validation whenever the form is changed
  useEffect(() => {
    const subscription = form.watch(() => {
      if (dataLoaded && !isLoadingData) {
        validateFormBenefitCounts();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [dataLoaded, isLoadingData, form, validateFormBenefitCounts]);

  // Loading state
  if (slug && (isLoadingData || isLoadingSubsection) && !dataLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p className="text-muted-foreground">Loading benefits section data...</p>
      </div>
    );
  }

   // Function to remove a process step after confirmation
   const removeProcessStep = async () => {
    if (!stepToDelete) return;
    
    const { langCode, index } = stepToDelete;
    setIsDeleting(true);
    
    const currentSteps = form.getValues()[langCode] || [];
    if (currentSteps.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one process step",
        variant: "destructive",
      });
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      return;
    }

    if (existingSubSectionId && contentElements.length > 0) {
      try {
        const stepNumber = index + 1;
        // Filter elements related to this step
        const stepElements = contentElements.filter((element) => {
          const match = element.name.match(/Step (\d+)/i);
          return match && Number.parseInt(match[1]) === stepNumber;
        });

        // Delete step elements from DB
        if (stepElements.length > 0) {
          await Promise.all(stepElements.map(async (element) => {
            try {
              await deleteContentElement.mutateAsync(element._id);
              console.log(`Deleted content element: ${element.name}`);
            } catch (error) {
              console.error(`Failed to delete content element ${element.name}:`, error);
            }
          }));

          setContentElements((prev) =>
            prev.filter((element) => {
              const match = element?.name?.match(/Step (\d+)/i);
              return !(match && Number.parseInt(match[1]) === stepNumber);
            }),
          );

          toast({
            title: "Step deleted",
            description: `Step ${stepNumber} has been deleted from the database`,
          });
        }

        // Update remaining elements (renumber)
        const remainingElements = contentElements.filter((element) => {
          const match = element.name.match(/Step (\d+)/i);
          return match && Number.parseInt(match[1]) > stepNumber;
        });

        await Promise.all(remainingElements.map(async (element) => {
          const match = element.name.match(/Step (\d+)/i);
          if (match) {
            const oldNumber = Number.parseInt(match[1]);
            const newNumber = oldNumber - 1;
            const newName = element.name.replace(`Step ${oldNumber}`, `Step ${newNumber}`);
            const newOrder = element.order - 3;

            try {
              await updateContentElement.mutateAsync({
                id: element._id,
                data: {
                  name: newName,
                  order: newOrder,
                },
              });
              console.log(`Updated element ${element.name} to ${newName}`);
            } catch (error) {
              console.error(`Failed to update element ${element.name}:`, error);
            }
          }
        }));
      } catch (error) {
        console.error("Error removing process step elements:", error);
        toast({
          title: "Error removing step",
          description: "There was an error removing the step from the database",
          variant: "destructive",
        });
      }
    }

    // Update form values for all languages
    Object.keys(form.getValues()).forEach((langCode) => {
      const updatedSteps = [...(form.getValues()[langCode] || [])];
      updatedSteps.splice(index, 1);
      form.setValue(langCode, updatedSteps);
    });
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    validateFormBenefitCounts();
  };

          // Function to trigger delete confirmation dialog
    const confirmDeleteStep = (langCode: string, index: number) => {
      setStepToDelete({ langCode, index });
      setDeleteDialogOpen(true);
    };
  return (
    <div className="space-y-6">
      {/* Loading Dialog */}
      <LoadingDialog 
        isOpen={isSaving} 
        title={existingSubSectionId ? "Updating Benefits" : "Creating Benefits"}
        description="Please wait while we save your changes..."
      />
      
      <Form {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {languageIds.map((langId, langIndex) => {
            const langCode = languageCodes[langId] || langId;
            const isFirstLanguage = langIndex === 0; // First language in the list
            
            return (
              <LanguageCard 
                key={langId}
                langId={langId}
                langCode={langCode}
                isFirstLanguage={isFirstLanguage}
                form={form}
                addBenefit={addBenefit}
                removeBenefit={removeBenefit}
                syncIcons={syncIcons}
                availableIcons={getAvailableIcons()}
                onDeleteStep={confirmDeleteStep}

              />
            );
          })}
        </div>
      </Form>
      
      {/* Save Button with Validation Warning */}
      <div className="flex justify-end mt-6">
        {benefitCountMismatch && (
          <div className="flex items-center text-amber-500 mr-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="text-sm">Each language must have the same number of benefits</span>
          </div>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoadingData || benefitCountMismatch || isSaving}
          className="flex items-center"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {existingSubSectionId ? "Update Benefits" : "Save Benefits"}
            </>
          )}
        </Button>
      </div>

         {/* Delete Step Confirmation Dialog */}
              <DeleteServiceDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                serviceName={stepToDelete ? `Step ${stepToDelete.index + 1}` : ''}
                onConfirm={removeProcessStep}
                isDeleting={isDeleting}
                title="Delete Process"
                confirmText="Delete Process"
              />

      {/* Validation Dialog */}
      <ValidationDialog
        isOpen={isValidationDialogOpen}
        onOpenChange={(isOpen) => updateState({ isValidationDialogOpen: isOpen })}
        benefitCounts={getBenefitCountsByLanguage(form.getValues())}
      />
    </div>
  );
});

BenefitsForm.displayName = "BenefitsForm";
export default BenefitsForm;