"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"
import { useGenericList } from "@/src/hooks/useGenericList"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { CountBadgeCell, GenericTable, StatusCell, TruncatedCell } from "@/src/components/dashboard/MainSections/GenericTable"
import { GenericListPage } from "@/src/components/dashboard/MainSections/GenericListPage"
import DialogCreateSectionItem from "@/src/components/DialogCreateSectionItem"
import CreateMainSubSection from "@/src/utils/CreateMainSubSection"
import { useWebsiteContext } from "@/src/providers/WebsiteContext"
import DeleteSectionDialog from "@/src/components/DeleteSectionDialog"
import { getTeamSectionConfig } from "./TeamSectionConfig"

export default function Team() {
  const searchParams = useSearchParams()
  const sectionId = searchParams.get("sectionId")
  const [hasMainSubSection, setHasMainSubSection] = useState<boolean>(false)
  const [isLoadingMainSubSection, setIsLoadingMainSubSection] = useState<boolean>(true)
  const [sectionData, setSectionData] = useState<any>(null)
  const { websiteId } = useWebsiteContext();
  const { t, i18n } = useTranslation();

  // Get translated configuration based on current language
  const teamSectionConfig = getTeamSectionConfig(i18n.language);

  // Configuration for the Team page using translations
  const TEAM_CONFIG = {
    title: t('teamManagement.title'),
    description: t('teamManagement.description'),
    addButtonLabel: t('teamManagement.addButtonLabel'),
    emptyStateMessage: t('teamManagement.emptyStateMessage'),
    noSectionMessage: t('teamManagement.noSectionMessage'),
    mainSectionRequiredMessage: t('teamManagement.mainSectionRequiredMessage'),
    emptyFieldsMessage: t('teamManagement.emptyFieldsMessage'),
    sectionIntegrationTitle: t('teamManagement.sectionIntegrationTitle'),
    sectionIntegrationDescription: t('teamManagement.sectionIntegrationDescription'),
    addSectionButtonLabel: t('teamManagement.addSectionButtonLabel'),
    editSectionButtonLabel: t('teamManagement.editSectionButtonLabel'),
    saveSectionButtonLabel: t('teamManagement.saveSectionButtonLabel'),
    listTitle: t('teamManagement.listTitle'),
    editPath: "team/addTeam"
  };

  // Team table column definitions with translations
  const TEAM_COLUMNS = [
    {
      header: t('teamManagement.name'),
      accessor: "name",
      className: "font-medium"
    },
    {
      header: t('teamManagement.description'),
      accessor: "description",
      cell: TruncatedCell
    },
    {
      header: t('teamManagement.status'),
      accessor: "isActive",
      cell: (item: any, value: boolean) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            {StatusCell(item, value)}
            {item.isMain && (
              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {t('teamManagement.main')}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: t('teamManagement.order'),
      accessor: "order"
    },
    {
      header: t('teamManagement.subsections'),
      accessor: "subsections.length",
      cell: CountBadgeCell
    }
  ];

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

  // Use the generic list hook for Team management
  const {
    section: teamSection,
    items: teamItems,
    isLoadingItems: isLoadingTeamItems,
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
    editPath: TEAM_CONFIG.editPath
  })

  // Determine if main subsection exists when data loads & set section data if needed
  useEffect(() => {    
    // First check if we are still loading
    if (isLoadingCompleteSubsections || (sectionId && isLoadingSectionSubsections)) {
      setIsLoadingMainSubSection(true);
      return;
    }
    // We're done loading, now check the data
    let foundMainSubSection = false;
    let mainSubSection = null;
    
    // Get expected name from configuration
    const expectedSlug = teamSectionConfig.name;
    
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
      
      // Set local section data
      setSectionData(sectionInfo);
      
      // Update the teamSection in useGenericList hook if not already set
      if (teamSection === null) {
        setSection(sectionInfo);
      }
    }
    
  }, [
    mainSubSectionData, 
    sectionSubsections, 
    isLoadingCompleteSubsections, 
    isLoadingSectionSubsections, 
    sectionId, 
    teamSection, 
    setSection,
    teamSectionConfig.name
  ]);

  // Handle main subsection creation
  const handleMainSubSectionCreated = (subsection: any) => {
    // Check if subsection has the correct name
    const expectedSlug = teamSectionConfig.name;
    const hasCorrectSlug = subsection.name === expectedSlug;
    
    // Set that we have a main subsection now (only if it also has the correct name)
    setHasMainSubSection(subsection.isMain === true && hasCorrectSlug);
    
    // If we have section data from the subsection, update it
    if (subsection.section) {
      const sectionInfo = typeof subsection.section === 'string' 
        ? { _id: subsection.section } 
        : subsection.section;
        
      setSectionData(sectionInfo);
      setSection(sectionInfo);
    }
    
    // Refetch the main subsection data to ensure we have the latest
    if (refetchMainSubSection) {
      refetchMainSubSection();
    }
  };

  // Logic for disabling the add button
  const isAddButtonDisabled: boolean = 
    Boolean(defaultAddButtonDisabled) || 
    isLoadingMainSubSection ||
    (Boolean(sectionId) && !hasMainSubSection);
  
  // Custom message for empty state 
  const emptyStateMessage = !teamSection && !sectionData 
    ? TEAM_CONFIG.noSectionMessage 
    : (!hasMainSubSection && !isLoadingMainSubSection && sectionId)
      ? TEAM_CONFIG.mainSectionRequiredMessage
      : TEAM_CONFIG.emptyStateMessage;

  // Components
  const TeamTable = (
    <GenericTable
      columns={TEAM_COLUMNS}
      data={teamItems}
      onEdit={handleEdit}
      onDelete={showDeleteDialog}
    />
  );

  const CreateDialog = (
    <DialogCreateSectionItem
      open={isCreateDialogOpen}
      onOpenChange={setIsCreateDialogOpen}
      sectionId={sectionId || ""}
      onServiceCreated={handleItemCreated}
      title={t('teamManagement.team')}
    />
  );

  const DeleteDialog = (
    <DeleteSectionDialog
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      serviceName={itemToDelete?.name || ""}
      onConfirm={handleDelete}
      isDeleting={isDeleting}
      title={t('teamManagement.deleteTeamItem')}
      confirmText={t('teamManagement.confirm')}
    />
  );

  return (
    <div className="space-y-6">
      {/* Main list page with table and section integration */}
      <GenericListPage
        config={TEAM_CONFIG}
        sectionId={sectionId}
        sectionConfig={teamSectionConfig}
        isAddButtonDisabled={isAddButtonDisabled}
        tableComponent={TeamTable}
        createDialogComponent={CreateDialog}
        deleteDialogComponent={DeleteDialog}
        onAddNew={handleAddNew}
        isLoading={isLoadingTeamItems || isLoadingMainSubSection}
        emptyCondition={teamItems.length === 0}
        noSectionCondition={!teamSection && !sectionData}
        customEmptyMessage={emptyStateMessage}
      />
      
      {/* Main subsection management (only shown when section exists) */}
      {sectionId && (
        <CreateMainSubSection 
          sectionId={sectionId}
          sectionConfig={teamSectionConfig}
          onSubSectionCreated={handleMainSubSectionCreated}
          onFormValidityChange={() => {/* We don't need to track form validity */}}
        />
      )}
    </div>
  );
}