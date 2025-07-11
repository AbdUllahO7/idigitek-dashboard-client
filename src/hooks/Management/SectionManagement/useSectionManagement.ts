import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useToast } from "@/src/hooks/use-toast"
import { useAuth } from "@/src/context/AuthContext"
import { useWebsiteContext } from "@/src/providers/WebsiteContext"
import { useSections } from "@/src/hooks/webConfiguration/use-section"
import { useUserSections } from "@/src/hooks/webConfiguration/useUserSections"
import useUpdateOrder from "@/src/hooks/webConfiguration/useUpdateOrder"
import type { DuplicateSectionRequest, Section } from "@/src/api/types/hooks/section.types"
import type { DeleteItemData } from "@/src/api/types/hooks/Common.types"
import { PredefinedSection } from "@/src/api/types/management/SectionManagement.type"
import i18next from "i18next"

// Type for multilingual names
interface MultilingualName {
  en: string;
  ar: string;
  tr: string;
}

export const useSectionManagement = (hasWebsite: boolean) => {
  const { websiteId } = useWebsiteContext()
  const { user } = useAuth()
  const userId = user?.id || user?.id
  const { t, ready } = useTranslation()
  const { toast } = useToast()

  // State
  const [itemToDelete, setItemToDelete] = useState<DeleteItemData | null>(null)
  const [showSavedSuccess, setShowSavedSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("available")
  const [orderedSections, setOrderedSections] = useState<Section[]>([])
  const [isDragging, setIsDragging] = useState(false)
  
  // New state for add section dialog
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [sectionToAdd, setSectionToAdd] = useState<PredefinedSection | null>(null)

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [sectionToDuplicate, setSectionToDuplicate] = useState<Section | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Hooks
  const {
    useGetByWebsiteId,
    useCreate: useCreateSection,
    useDelete: useDeleteSection,
    useToggleActive: useToggleSectionActive,
    useUpdate: useUpdateSection,
  } = useSections()

  const { useActivateSection, useCreateUserSection } = useUserSections()
  const activateSectionMutation = useActivateSection()
  const createUserSectionMutationResult = useCreateUserSection()
  const createUserSectionMutation = createUserSectionMutationResult ? createUserSectionMutationResult : null

  const {
    data: websiteSections,
    isLoading: isLoadingSections,
    error: sectionsError,
    refetch: refetchSections,
    isError,
  } = useGetByWebsiteId(websiteId, true, hasWebsite)

  const createSectionMutation = useCreateSection()
  const deleteSectionMutation = useDeleteSection()
  const toggleSectionActiveMutation = useToggleSectionActive()
  const updateSectionOrderMutation = useUpdateOrder()
  const updateSectionMutation = useUpdateSection()

  // Effects
  useEffect(() => {
    if (
      createSectionMutation.isSuccess || 
      deleteSectionMutation.isSuccess || 
      toggleSectionActiveMutation.isSuccess ||
      updateSectionOrderMutation.isSuccess ||
      updateSectionMutation.isSuccess
    ) {
      refetchSections()
    }
  }, [
    createSectionMutation.isSuccess,
    deleteSectionMutation.isSuccess,
    toggleSectionActiveMutation.isSuccess,
    updateSectionOrderMutation.isSuccess,
    updateSectionMutation.isSuccess,
    refetchSections,
  ])

  useEffect(() => {
    if (websiteSections?.data) {
      setOrderedSections([...websiteSections.data].sort((a, b) => a.order - b.order))
    }
  }, [websiteSections])

  // Helper functions
  const showSuccessMessage = () => {
    setShowSavedSuccess(true)
    setTimeout(() => setShowSavedSuccess(false), 3000)
  }

  const createUserSectionRelation = (sectionId: string) => {
    if (!userId) {
      console.warn("Cannot create user-section relationship: User ID not available")
      return
    }

    activateSectionMutation.mutate(
      { userId, sectionId },
      {
        onError: (error: any) => {
          console.error("Error creating user-section relationship:", error)
        },
      },
    )
  }

  // Helper function to check if a section name matches the custom name
  const checkSectionNameMatch = (section: Section, customName: string): boolean => {
    const lowerCustomName = customName.toLowerCase().trim()
    if (!lowerCustomName) return false
    
    // Check if section.name is a string (old format) or object (new multilingual format)
    if (typeof section.name === 'string') {
      return section.name.toLowerCase() === lowerCustomName
    } 
    
    // If it's a multilingual object, check all language variants
    if (typeof section.name === 'object' && section.name !== null) {
      const nameObj = section.name as any
      return (
        (nameObj.en && nameObj.en.toLowerCase() === lowerCustomName) ||
        (nameObj.ar && nameObj.ar.toLowerCase() === lowerCustomName) ||
        (nameObj.tr && nameObj.tr.toLowerCase() === lowerCustomName)
      )
    }
    
    return false
  }

  // Simplified function to create multilingual content
  const createMultilingualContent = (content: string) => {
    return {
      en: content,
      ar: content, // For now, use the same content. You can enhance this later with actual translations
      tr: content
    }
  }

  // New handler to open the add section dialog
  const handleOpenAddDialog = (predefinedSection: PredefinedSection) => {
    setSectionToAdd(predefinedSection)
    setShowAddDialog(true)
  }

  // New handler to close the add section dialog
  const handleCloseAddDialog = () => {
    setShowAddDialog(false)
    setSectionToAdd(null)
  }

  // Handler to create section with multilingual names
  const handleConfirmAddSection = (predefinedSection: PredefinedSection, customNames: MultilingualName) => {
    // Trim all names
    const trimmedCustomNames = {
      en: customNames.en.trim(),
      ar: customNames.ar.trim(),
      tr: customNames.tr.trim()
    }
    
    // Check if any name is empty
    if (!trimmedCustomNames.en || !trimmedCustomNames.ar || !trimmedCustomNames.tr) {
      toast({
        title: ready ? t("useSectionManagement.toast.error.title") : "Error",
        description: "Section names cannot be empty for any language.",
        variant: "destructive",
      })
      return
    }

    // REMOVED: Check for duplicate names to allow multiple sections of the same type
    // Only check for exact name duplicates, not subName duplicates
    const hasDuplicateName = orderedSections?.some((section: Section) => 
      checkSectionNameMatch(section, trimmedCustomNames.en) || 
      checkSectionNameMatch(section, trimmedCustomNames.ar) || 
      checkSectionNameMatch(section, trimmedCustomNames.tr)
      // REMOVED: || section.subName === predefinedSection.subName
    )

    if (hasDuplicateName) {
      toast({
        title: ready ? t("useSectionManagement.toast.duplicateSection.title") : "Duplicate section",
        description: ready ? 
          t("useSectionManagement.toast.duplicateSection.description", { sectionName: trimmedCustomNames.en }) : 
          `A section with one of these names already exists.`,
        variant: "destructive",
      })
      return
    }
    
    // Use the provided multilingual names directly
    const multilingualName = trimmedCustomNames
    const translatedDescription = ready ? t(predefinedSection.descriptionKey, '') : ''
    const multilingualDescription = createMultilingualContent(translatedDescription)
    
    const newSectionData = {
      name: multilingualName,
      description: multilingualDescription,
      subName: predefinedSection.subName,
      image: predefinedSection.image,
      order: orderedSections.length,
      subSections: [],
      isActive: true,
      WebSiteId: websiteId,
    }

    if (createUserSectionMutation) {
      createUserSectionMutation.mutate(newSectionData, {
        onSuccess: () => {
          toast({
            title: ready ? t("useSectionManagement.toast.sectionAdded.title") : "Section added",
            description: ready ? 
              t("useSectionManagement.toast.sectionAdded.description", { sectionName: trimmedCustomNames.en }) : 
              `${trimmedCustomNames.en} section has been added successfully.`,
          })
          showSuccessMessage()
          setActiveTab("current")
          handleCloseAddDialog()
        },
        onError: (error: any) => {
          console.error("Error creating user section:", error)
          toast({
            title: ready ? t("useSectionManagement.toast.errorAdding.title") : "Error adding section",
            description: ready ? 
              t("useSectionManagement.toast.errorAdding.description") : 
              error.message || "An error occurred while adding the section.",
            variant: "destructive",
          })
        },
      })
    } else {
      createSectionMutation.mutate(newSectionData, {
        onSuccess: (createdSection) => {
          toast({
            title: ready ? t("useSectionManagement.toast.sectionAdded.title") : "Section added",
            description: ready ? 
              t("useSectionManagement.toast.sectionAdded.description", { sectionName: trimmedCustomNames.en }) : 
              `${trimmedCustomNames.en} section has been added successfully.`,
          })
          showSuccessMessage()
          setActiveTab("current")
          handleCloseAddDialog()

          if (createdSection?.data?._id) {
            createUserSectionRelation(createdSection.data?._id)
          }
        },
        onError: (error: any) => {
          console.error("Error creating section:", error)
          toast({
            title: ready ? t("useSectionManagement.toast.errorAdding.title") : "Error adding section",
            description: ready ? 
              t("useSectionManagement.toast.errorAdding.description") : 
              error.message || "An error occurred while adding the section.",
            variant: "destructive",
          })
        },
      })
    }
  }

  // IMPROVED: Generate unique subName for duplicates
  const generateUniqueSubName = (originalSubName: string, duplicateIndex: number): string => {
    return `${originalSubName}-duplicate-${duplicateIndex}`;
  };

  // IMPROVED: Count all duplicates more accurately
  const countExistingDuplicates = (originalSection: Section): number => {
    const baseSubName = getBaseSubName(originalSection.subName);
    
    return orderedSections.filter(section => {
      const sectionBaseSubName = getBaseSubName(section.subName);
      return sectionBaseSubName === baseSubName;
    }).length;
  };

  // NEW: Helper function to get the base subName (without duplicate suffix)
  const getBaseSubName = (subName: string): string => {
    return subName.replace(/-duplicate-\d+.*$/, '');
  };

  // NEW: Helper function to get the original section for any section (including duplicates)
  const getOriginalSectionId = (section: Section): string => {
    // If it's already a duplicate, return its original section ID
    if (section.originalSectionId) {
      return section.originalSectionId;
    }
    // If it's an original section, return its own ID
    return section._id!;
  };

  // IMPROVED: Enhanced duplication handler that allows unlimited duplicates
  const handleConfirmDuplication = async (customNames: MultilingualName, duplicateContent: boolean = false) => {
    if (!sectionToDuplicate) return;

    setIsDuplicating(true);

    try {
      // Get the original section ID (works for both original and duplicate sections)
      const originalSectionId = getOriginalSectionId(sectionToDuplicate);
      
      // Count ALL duplicates of this section type (including the original)
      const totalCount = countExistingDuplicates(sectionToDuplicate);
      const duplicateIndex = totalCount; // This will be the next number in sequence
      
      // Generate unique identifiers
      const uniqueIdentifier = generateUniqueIdentifier(sectionToDuplicate, duplicateIndex);
      const baseSubName = getBaseSubName(sectionToDuplicate.subName);
      const duplicateSubName = generateUniqueSubName(baseSubName, duplicateIndex);
      
      // Create multilingual description
      const createMultilingualContent = (content: string) => {
        return {
          en: content,
          ar: content,
          tr: content
        }
      };

      // Ensure description is always MultilingualDescription
      let duplicateDescription: any = sectionToDuplicate.description;
      if (typeof duplicateDescription === "string" || !duplicateDescription) {
        duplicateDescription = createMultilingualContent(duplicateDescription || "");
      }

      // Prepare duplicate section data
      const duplicateData = {
        // Copy basic properties from original
        name: customNames,
        description: duplicateDescription,
        subName: duplicateSubName,
        image: sectionToDuplicate.image,
        
        // Set as last in order
        order: orderedSections.length,
        isActive: true, // Start active
        WebSiteId: websiteId,
        
        // Duplication metadata
        originalSectionId: originalSectionId, // Always points to the original section
        duplicateIndex: duplicateIndex,
        isDuplicate: true,
        duplicateOf: getDisplayName(sectionToDuplicate.name),
        uniqueIdentifier: uniqueIdentifier,
        
        // Don't copy these fields
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        subSections: duplicateContent ? sectionToDuplicate.subSections : [], // Copy content if requested
      };

      // Create the duplicate section using existing create mutation
      if (createUserSectionMutation) {
        createUserSectionMutation.mutate(duplicateData, {
          onSuccess: (createdSection) => {
            console.log("createdSection", createdSection);

            toast({
              title: ready ? t("sectionManagement.duplicate.success.title") : "Section duplicated",
              description: ready ? 
                t("sectionManagement.duplicate.success.description", { 
                  sectionName: getDisplayName(customNames),
                  originalName: getDisplayName(sectionToDuplicate.name)
                }) : 
                `${getDisplayName(customNames)} has been created as a duplicate.`,
            });
            
            showSuccessMessage();
            setActiveTab("current");
            handleCloseDuplicateDialog();
        
          },
          onError: (error: any) => {
            console.error("Error duplicating section:", error);
            toast({
              title: ready ? t("sectionManagement.duplicate.error.title") : "Duplication failed",
              description: ready ? 
                t("sectionManagement.duplicate.error.description") : 
                error.message || "Failed to duplicate section.",
              variant: "destructive",
            });
          },
        });
      } else {
        // Fallback to regular create mutation
        createSectionMutation.mutate(duplicateData, {
          onSuccess: (createdSection) => {
            console.log("createdSection", createdSection)
            toast({
              title: ready ? t("sectionManagement.duplicate.success.title") : "Section duplicated",
              description: ready ? 
                t("sectionManagement.duplicate.success.description", { 
                  sectionName: getDisplayName(customNames),
                  originalName: getDisplayName(sectionToDuplicate.name)
                }) : 
                `${getDisplayName(customNames)} has been created as a duplicate.`,
            });
            
            showSuccessMessage();
            setActiveTab("current");
            handleCloseDuplicateDialog();

            // Create user-section relationship if needed
            if (createdSection.data?._id && userId) {
              createUserSectionRelation(createdSection.data?._id);
            }
          },
          onError: (error: any) => {
            console.error("Error duplicating section:", error);
            toast({
              title: ready ? t("sectionManagement.duplicate.error.title") : "Duplication failed",
              description: ready ? 
                t("sectionManagement.duplicate.error.description") : 
                error.message || "Failed to duplicate section.",
              variant: "destructive",
            });
          },
        });
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  // Keep the original handler for backwards compatibility (now opens dialog)
  const handleAddPredefinedSection = (predefinedSection: PredefinedSection) => {
    handleOpenAddDialog(predefinedSection)
  }

  const getDisplayName = (name: MultilingualName | string): string => {
    if (typeof name === 'string') return name;
    const currentLang = (ready ? i18next.language : 'en') as keyof MultilingualName;
    return name[currentLang] || name.en || '';
  };

  // Handler to update section
  const handleUpdateSection = (sectionId: string, updateData: { name: MultilingualName }) => {
    updateSectionMutation.mutate(
      { id: sectionId, data: updateData },
      {
        onSuccess: () => {
          toast({
            title: ready ? t("useSectionManagement.toast.sectionUpdated.title") : "Section updated",
            description: ready ? 
              t("useSectionManagement.toast.sectionUpdated.description") : 
              "Section has been updated successfully.",
          })
          showSuccessMessage()
        },
        onError: (error: any) => {
          console.error("Error updating section:", error)
          toast({
            title: ready ? t("useSectionManagement.toast.errorUpdating.title") : "Error updating section",
            description: ready ? 
              t("useSectionManagement.toast.errorUpdating.description") : 
              error.message || "An error occurred while updating the section.",
            variant: "destructive",
          })
        },
      }
    )
  }

  const handleToggleActive = (section: Section) => {
    if (!section._id) {
      toast({
        title: ready ? t("useSectionManagement.toast.error.title") : "Error",
        description: ready ? t("useSectionManagement.toast.error.description") : "Section ID is missing.",
        variant: "destructive",
      })
      return
    }

    const newActiveStatus = !section.isActive
    
    toggleSectionActiveMutation.mutate(
      { id: section._id, isActive: newActiveStatus },
      {
        onSuccess: () => {
          const toastKey = newActiveStatus ? "activated" : "deactivated"
          toast({
            title: ready ? 
              t(`useSectionManagement.toast.sectionToggled.${toastKey}.title`) : 
              `Section ${newActiveStatus ? 'activated' : 'deactivated'}`,
            description: ready ? 
              t(`useSectionManagement.toast.sectionToggled.${toastKey}.description`) : 
              `Section is now ${newActiveStatus ? 'visible' : 'hidden'} on your website.`,
          })
          showSuccessMessage()

          setOrderedSections(prevSections => 
            prevSections.map(s => 
              s._id === section._id 
                ? { ...s, isActive: newActiveStatus }
                : s
            )
          )
        },
        onError: (error: any) => {
          console.error("Error toggling section status:", error)
          toast({
            title: ready ? t("useSectionManagement.toast.errorUpdating.title") : "Error updating section",
            description: ready ? 
              t("useSectionManagement.toast.errorUpdating.description") : 
              error.message || "An error occurred while updating the section status.",
            variant: "destructive",
          })
        },
      }
    )
  }

  const handleReorder = (reorderedSections: Section[]) => {
    setOrderedSections(reorderedSections)

    const orderData = reorderedSections
      .filter((section): section is Section & { _id: string; order: number } => 
        section._id !== undefined && typeof section.order === 'number' && Boolean(section.WebSiteId)
      )
      .map((section, index) => ({
        id: section._id,
        order: index,
        websiteId: section.WebSiteId.toString(),
      }))

    if (orderData.length === 0) {
      toast({
        title: ready ? t("useSectionManagement.toast.noValidSections.title") : "Error",
        description: ready ? t("useSectionManagement.toast.noValidSections.description") : "No valid sections to reorder.",
        variant: "destructive",
      })
      return
    }

    updateSectionOrderMutation.mutate(orderData, {
      onSuccess: () => {
        toast({
          title: ready ? t("useSectionManagement.toast.orderUpdated.title") : "Order updated",
          description: ready ? t("useSectionManagement.toast.orderUpdated.description") : "Section order has been updated successfully.",
        })
        showSuccessMessage()
        refetchSections()
      },
      onError: (error: any) => {
        console.error("Error updating section order:", error)
        toast({
          title: ready ? t("useSectionManagement.toast.errorUpdatingOrder.title") : "Error updating order",
          description: ready ? 
            t("useSectionManagement.toast.errorUpdatingOrder.description") : 
            error.message || "An error occurred while updating section order.",
          variant: "destructive",
        })
        if (websiteSections?.data) {
          setOrderedSections([...websiteSections.data].sort((a, b) => a.order - b.order))
        }
      },
    })
  }

  const confirmDelete = () => {
    if (itemToDelete && itemToDelete._id && itemToDelete.type === "section") {
      deleteSectionMutation.mutate(itemToDelete._id, {
        onSuccess: () => {
          toast({
            title: ready ? t("useSectionManagement.toast.sectionDeleted.title") : "Section deleted",
            description: ready ? t("useSectionManagement.toast.sectionDeleted.description") : "The section has been deleted successfully.",
          })
          setItemToDelete(null)
          showSuccessMessage()
        },
        onError: (error: any) => {
          console.error("Error deleting section:", error)
          toast({
            title: ready ? t("useSectionManagement.toast.errorDeleting.title") : "Error deleting section",
            description: ready ? 
              t("useSectionManagement.toast.errorDeleting.description") : 
              error.message || "An error occurred while deleting the section.",
            variant: "destructive",
          })
        },
      })
    }
  }

  // Open duplicate dialog
  const handleOpenDuplicateDialog = (section: Section) => {
    setSectionToDuplicate(section);
    setShowDuplicateDialog(true);
  };

  // IMPROVED: Generate more unique identifier
  const generateUniqueIdentifier = (originalSection: Section, duplicateIndex: number): string => {
    const baseSubName = getBaseSubName(originalSection.subName);
    return `${baseSubName}-duplicate-${duplicateIndex}-${Date.now()}`;
  };

  // Close duplicate dialog
  const handleCloseDuplicateDialog = () => {
    setShowDuplicateDialog(false);
    setSectionToDuplicate(null);
  };

  return {
    // State
    itemToDelete,
    showSavedSuccess,
    searchQuery,
    categoryFilter,
    activeTab,
    orderedSections,
    isDragging,
    
    // New dialog state
    showAddDialog,
    sectionToAdd,
    
    // Data
    websiteSections,
    isLoadingSections,
    sectionsError,
    isError,
    
    // Mutations
    createSectionMutation,
    deleteSectionMutation,
    toggleSectionActiveMutation,
    createUserSectionMutation,
    updateSectionMutation,
    
    // Setters
    setItemToDelete,
    setShowSavedSuccess,
    setSearchQuery,
    setCategoryFilter,
    setActiveTab,
    setOrderedSections,
    setIsDragging,
    
    // Handlers
    handleAddPredefinedSection, // This now opens the dialog
    handleOpenAddDialog,
    handleCloseAddDialog,
    handleConfirmAddSection, // This actually creates the section
    handleUpdateSection, // This updates the section
    handleToggleActive,
    handleReorder,
    confirmDelete,
    showSuccessMessage,
    refetchSections,

    handleOpenDuplicateDialog,
    handleCloseDuplicateDialog,
    handleConfirmDuplication,

    showDuplicateDialog,
    sectionToDuplicate,
    isDuplicating,
    
    // Utils
    t,
    ready
  }
}