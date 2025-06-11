"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"
import { useGenericList } from "@/src/hooks/useGenericList"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { CountBadgeCell, GenericTable, StatusCell, TruncatedCell } from "@/src/components/dashboard/MainSections/GenericTable"
import { GenericListPage } from "@/src/components/dashboard/MainSections/GenericListPage"
import DialogCreateSectionItem from "@/src/components/DialogCreateSectionItem"
import CreateMainSubSection from "@/src/utils/CreateMainSubSection"
import { useWebsiteContext } from "@/src/providers/WebsiteContext"
import DeleteSectionDialog from "@/src/components/DeleteSectionDialog"
import { getProcessSectionConfig, processSectionConfig } from "./ProcessSectionConfig"
import { useTranslation } from "react-i18next"

export default function ourProcess() {
  const { t, i18n } = useTranslation()
  const searchParams = useSearchParams()
  const sectionId = searchParams.get("sectionId")
  const [hasMainSubSection, setHasMainSubSection] = useState<boolean>(false)
  const [isLoadingMainSubSection, setIsLoadingMainSubSection] = useState<boolean>(true)
  const [sectionData, setSectionData] = useState<any>(null)
  const { websiteId } = useWebsiteContext();

  // Get current language from i18n
  const currentLanguage = i18n.language || 'en'

  // Get translated process section configuration using current language
  const translatedProcessSectionConfig = useMemo(() => 
    getProcessSectionConfig(currentLanguage), [currentLanguage]
  )

  // Configuration for the Process page with translations
  const PROCESS_CONFIG = useMemo(() => ({
    title: t('process.title', 'Process Management'),
    description: t('process.description', 'Manage your Process inventory and multilingual content'),
    addButtonLabel: t('process.addButtonLabel', 'Add New Process Item'),
    emptyStateMessage: t('process.emptyStateMessage', 'No Process found. Create your first Process by clicking the "Add New Process" button.'),
    noSectionMessage: t('process.noSectionMessage', 'Please create a Process section first before adding Process.'),
    mainSectionRequiredMessage: t('process.mainSectionRequiredMessage', 'Please enter your main section data before adding Process.'),
    emptyFieldsMessage: t('process.emptyFieldsMessage', 'Please complete all required fields in the main section before adding Process.'),
    sectionIntegrationTitle: t('process.sectionIntegrationTitle', 'Process Section Content'),
    sectionIntegrationDescription: t('process.sectionIntegrationDescription', 'Manage your Process section content in multiple languages.'),
    addSectionButtonLabel: t('process.addSectionButtonLabel', 'Add Process Section'),
    editSectionButtonLabel: t('process.editSectionButtonLabel', 'Edit Process Section'),
    saveSectionButtonLabel: t('process.saveSectionButtonLabel', 'Save Process Section'),
    listTitle: t('process.listTitle', 'Process List'),
    editPath: t('process.editPath', 'ourProcess/addProcess')
  }), [t]);

  // Process table column definitions with translations
  const PROCESS_COLUMNS = useMemo(() => [
    {
      header: t('process.columnName', 'Name'),
      accessor: "name",
      className: "font-medium"
    },
    {
      header: t('process.columnDescription', 'Description'),
      accessor: "description",
      cell: TruncatedCell
    },
    {
      header: t('process.columnStatus', 'Status'),
      accessor: "isActive",
      cell: (item: any, value: boolean) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            {StatusCell(item, value)}
            {item.isMain && (
              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {t('process.statusMain', 'Main')}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: t('process.columnOrder', 'Order'),
      accessor: "order"
    },
    {
      header: t('process.columnSubsections', 'Subsections'),
      accessor: "subsections.length",
      cell: CountBadgeCell
    }
  ], [t])

  // Check if main subsection exists
  const { useGetMainByWebSiteId, useGetBySectionId } = useSubSections()
  
  const {
    data: mainSubSectionData,
    isLoading: isLoadingCompleteSubsections,
    refetch: refetchMainSubSection
  } = useGetMainByWebSiteId(websiteId)

  // If we have a specific section ID, also fetch subsections for that section
  const {
    data: sectionSubsections,
    isLoading: isLoadingSectionSubsections
  } = useGetBySectionId(sectionId || "")

  // Use the generic list hook for Process management
  const {
    section: processSection,
    items: processItems,
    isLoadingItems: isLoadingProcessItems,
    isCreateDialogOpen,
    isDeleteDialogOpen,
    itemToDelete,
    isDeleting,
    isAddButtonDisabled: defaultAddButtonDisabled,
    handleEdit,
    handleDelete,
    handleAddNew,
    handleItemCreated,
    showDeleteDialog,
    setIsCreateDialogOpen,
    setIsDeleteDialogOpen,
    setSection
  } = useGenericList({
    sectionId,
    apiHooks: useSectionItems(),
    editPath: PROCESS_CONFIG.editPath
  })

  // Determine if main subsection exists when data loads & set section data if needed
  useEffect(() => {    
    // First check if we are still loading
    if (isLoadingCompleteSubsections || (sectionId && isLoadingSectionSubsections)) {
      console.log(t('process.stillLoadingData', 'Still loading subsection data...'));
      setIsLoadingMainSubSection(true);
      return;
    }
    
    // We're done loading, now check the data
    let foundMainSubSection = false;
    let mainSubSection = null;
    
    // Get expected name from translated configuration
    const expectedSlug = translatedProcessSectionConfig.name;
    console.log(`${t('process.expectedSubsectionName', 'Expected subsection name')}:`, expectedSlug);
    
    // If we have a sectionId, prioritize checking the section-specific subsections
    if (sectionId && sectionSubsections?.data) {
      const sectionData = sectionSubsections.data;
      
      if (Array.isArray(sectionData)) {
        // Find the main subsection in the array with correct name
        mainSubSection = sectionData.find(sub => 
          sub.isMain === true && sub.name === expectedSlug
        );
        foundMainSubSection = !!mainSubSection;
      } else {
        // Single object response
        foundMainSubSection = sectionData.isMain === true && sectionData.name === expectedSlug;
        mainSubSection = foundMainSubSection ? sectionData : null;
      }
      
      console.log("Section subsections check:", { 
        foundMainSubSection, 
        mainSubSection,
        matchesSlug: mainSubSection ? mainSubSection.name === expectedSlug : false
      });
    }
    
    // If we didn't find anything in the section-specific data, check the website-wide data
    if (!foundMainSubSection && mainSubSectionData?.data) {
      const websiteData = mainSubSectionData.data;
      
      if (Array.isArray(websiteData)) {
        // Find the main subsection in the array with correct name
        mainSubSection = websiteData.find(sub => 
          sub.isMain === true && sub.name === expectedSlug
        );
        foundMainSubSection = !!mainSubSection;
      } else {
        // Single object response
        foundMainSubSection = websiteData.isMain === true && websiteData.name === expectedSlug;
        mainSubSection = foundMainSubSection ? websiteData : null;
      }
    }
    
    // Update state based on what we found
    setHasMainSubSection(foundMainSubSection);
    setIsLoadingMainSubSection(false);
    
    // Extract section data from the main subsection if we found one
    if (foundMainSubSection && mainSubSection && mainSubSection.section) {
      const sectionInfo = typeof mainSubSection.section === 'string' 
        ? { _id: mainSubSection.section } 
        : mainSubSection.section;
      
      console.log(`${t('process.settingSectionData', 'Setting section data')}:`, sectionInfo);
      
      // Set local section data
      setSectionData(sectionInfo);
      
      // Update the processSection in useGenericList hook if not already set
      if (processSection === null) {
        setSection(sectionInfo);
      }
    }
    
  }, [
    mainSubSectionData, 
    sectionSubsections, 
    isLoadingCompleteSubsections, 
    isLoadingSectionSubsections, 
    sectionId, 
    processSection, 
    setSection,
    translatedProcessSectionConfig.name, // Add this dependency
    t
  ]);

  // Handle main subsection creation
  const handleMainSubSectionCreated = (subsection: any) => {
    console.log(`${t('process.mainSubsectionCreated', 'Main subsection created')}:`, subsection);
    
    // Check if subsection has the correct name (using translated config)
    const expectedSlug = translatedProcessSectionConfig.name;
    const hasCorrectSlug = subsection.name === expectedSlug;
    
    // Set that we have a main subsection now (only if it also has the correct name)
    setHasMainSubSection(subsection.isMain === true && hasCorrectSlug);
    
    // Log the name check
    console.log("Main subsection name check:", {
      actualSlug: subsection.name,
      expectedSlug,
      isCorrect: hasCorrectSlug
    });
    
    // If we have section data from the subsection, update it
    if (subsection.section) {
      const sectionInfo = typeof subsection.section === 'string' 
        ? { _id: subsection.section } 
        : subsection.section;
        
      setSectionData(sectionInfo);
      setSection(sectionInfo);
      console.log(t('process.sectionDataUpdated', 'Section data updated'));
    }
    
    // Refetch the main subsection data to ensure we have the latest
    if (refetchMainSubSection) {
      console.log(t('process.refetchingData', 'Refetching data'));
      refetchMainSubSection();
    }
  };

  // Logic for disabling the add button
  const isAddButtonDisabled: boolean = 
    Boolean(defaultAddButtonDisabled) || 
    isLoadingMainSubSection ||
    (Boolean(sectionId) && !hasMainSubSection);
  
  // Custom message for empty state with translations
  const emptyStateMessage = !processSection && !sectionData 
    ? PROCESS_CONFIG.noSectionMessage 
    : (!hasMainSubSection && !isLoadingMainSubSection && sectionId)
      ? PROCESS_CONFIG.mainSectionRequiredMessage
      : PROCESS_CONFIG.emptyStateMessage;

  // Components
  const ProcessTable = (
    <GenericTable
      columns={PROCESS_COLUMNS}
      data={processItems}
      onEdit={handleEdit}
      onDelete={showDeleteDialog}
      loading={isLoadingProcessItems}
      emptyMessage={t('process.noDataMessage', 'No process data available')}
    />
  );

  const CreateDialog = (
    <DialogCreateSectionItem
      open={isCreateDialogOpen}
      onOpenChange={setIsCreateDialogOpen}
      sectionId={sectionId || ""}
      onServiceCreated={handleItemCreated}
      title={t('process.createDialogTitle', 'Process')}
    />
  );

  const DeleteDialog = (
    <DeleteSectionDialog
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      serviceName={itemToDelete?.name || ""}
      onConfirm={handleDelete}
      isDeleting={isDeleting}
      title={t('process.deleteDialogTitle', 'Delete Process Item')}
      confirmText={t('process.deleteConfirmText', 'Confirm')}
    />
  );

  return (
    <div className="space-y-6">
      {/* Main list page with table and section integration */}
      <GenericListPage
        config={PROCESS_CONFIG}
        sectionId={sectionId}
        sectionConfig={translatedProcessSectionConfig} // Use translated config with language parameter
        isAddButtonDisabled={isAddButtonDisabled}
        tableComponent={ProcessTable}
        createDialogComponent={CreateDialog}
        deleteDialogComponent={DeleteDialog}
        onAddNew={handleAddNew}
        isLoading={isLoadingProcessItems || isLoadingMainSubSection}
        emptyCondition={processItems.length === 0}
        noSectionCondition={!processSection && !sectionData}
        customEmptyMessage={emptyStateMessage}
      />
      
      {/* Main subsection management (only shown when section exists) */}
      {sectionId && (
        <CreateMainSubSection 
          sectionId={sectionId}
          sectionConfig={translatedProcessSectionConfig} // Use translated config with language parameter
          onSubSectionCreated={handleMainSubSectionCreated}
          onFormValidityChange={() => {/* We don't need to track form validity */}}
        />
      )}
    </div>
  );
}