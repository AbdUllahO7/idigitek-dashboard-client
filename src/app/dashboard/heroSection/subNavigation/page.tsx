// src/app/dashboard/heroSection/subNavigation/page.tsx

"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"
import { useGenericList } from "@/src/hooks/useGenericList"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { CountBadgeCell, GenericTable, StatusCell, TruncatedCell } from "@/src/components/dashboard/MainSections/GenericTable"
import { GenericListPage } from "@/src/components/dashboard/MainSections/GenericListPage"
import DialogCreateSectionItem from "@/src/components/DialogCreateSectionItem"
import CreateMainSubSection from "@/src/utils/CreateMainSubSection"
import { useWebsiteContext } from "@/src/providers/WebsiteContext"
import DeleteSectionDialog from "@/src/components/DeleteSectionDialog"
import { useTranslation } from "react-i18next"
import { Button } from "@/src/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

// Column definitions for sub-navigation
const SUB_NAVIGATION_COLUMNS = [
  {
    header: "Name",
    accessor: "name",
    className: "font-medium"
  },
  {
    header: "Description",
    accessor: "description",
    cell: TruncatedCell
  },
  {
    header: "Status",
    accessor: "isActive",
    cell: (item: any, value: boolean) => (
      <div className="flex flex-col gap-2">
        <div className="flex items-center">
          {StatusCell(item, value)}
        </div>
      </div>
    )
  },
  {
    header: "Order",
    accessor: "order"
  },
  {
    header: "URL",
    accessor: "url",
    cell: (item: any, value: string) => (
      <div className="max-w-[200px]">
        {value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline truncate block"
          >
            {value}
          </a>
        ) : (
          <span className="text-muted-foreground">No URL</span>
        )}
      </div>
    )
  }
]

export default function SubNavigationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const parentId = searchParams.get("parentId") // Primary navigation item ID
  const sectionId = searchParams.get("sectionId") // Hero section ID
  
  const [hasMainSubSection, setHasMainSubSection] = useState<boolean>(false)
  const [isLoadingMainSubSection, setIsLoadingMainSubSection] = useState<boolean>(true)
  const [sectionData, setSectionData] = useState<any>(null)
  const [parentNavigationData, setParentNavigationData] = useState<any>(null)
  
  const { websiteId } = useWebsiteContext();
  const { t } = useTranslation()
  
  // Configuration for sub-navigation
  const SUB_NAVIGATION_CONFIG = {
    title: "Sub-Navigation Management",
    description: "Manage sub-navigation items for the selected parent navigation",
    addButtonLabel: "Add New Sub-Navigation Item",
    emptyStateMessage: "No sub-navigation items found. Create your first sub-navigation item by clicking the \"Add New Sub-Navigation Item\" button.",
    noSectionMessage: "Please create a sub-navigation section first before adding sub-navigation items.",
    mainSectionRequiredMessage: "Please enter your main sub-navigation section data before adding sub-navigation items.",
    emptyFieldsMessage: "Please complete all required fields in the main sub-navigation section before adding sub-navigation items.",
    sectionIntegrationTitle: "Sub-Navigation Section Content",
    sectionIntegrationDescription: "Manage your sub-navigation section content in multiple languages.",
    addSectionButtonLabel: "Add Sub-Navigation Section",
    editSectionButtonLabel: "Edit Sub-Navigation Section", 
    saveSectionButtonLabel: "Save Sub-Navigation Section",
    listTitle: "Sub-Navigation Items List",
    editPath: "heroSection/addNavigation?type=sub"
  };
  
  // Redirect if no parentId provided
  useEffect(() => {
    if (!parentId) {
      router.push(`/dashboard/heroSection${sectionId ? `?sectionId=${sectionId}` : ''}`)
      return;
    }
  }, [parentId, router, sectionId]);

  // Get parent navigation item data
  const { useGetById: useGetSectionItemById } = useSectionItems();
  const {
    data: parentNavigationItemData,
    isLoading: isLoadingParentData
  } = useGetSectionItemById(parentId || '', Boolean(parentId));

  useEffect(() => {
    if (parentNavigationItemData?.data) {
      setParentNavigationData(parentNavigationItemData.data);
    }
  }, [parentNavigationItemData]);

  // Check if main subsection exists
  const { useGetMainByWebSiteId, useGetBySectionId } = useSubSections()
  
  const {
    data: mainSubSectionData,
    isLoading: isLoadingCompleteSubsections,
    refetch: refetchMainSubSection
  } = useGetMainByWebSiteId(websiteId)

  // Fetch subsections for the parent navigation item (using parentId as sectionId for sub-nav)
  const {
    data: sectionSubsections,
    isLoading: isLoadingSectionSubsections
  } = useGetBySectionId(parentId || "")

  // Use the generic list hook for sub-navigation management
  const {
    section: subNavigationSection,
    items: subNavigationItems,
    isLoadingItems: isLoadingSubNavigationItems,
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
    sectionId: parentId, // Use parentId as sectionId for sub-navigation items
    apiHooks: useSectionItems(),
    editPath: SUB_NAVIGATION_CONFIG.editPath
  })

  // Handle add new with type
  const handleAddNewWithType = () => {
    const path = `/dashboard/heroSection/addNavigation?mode=create&sectionId=${parentId}&type=sub&parentId=${parentId}`;
    router.push(path);
  };

  // Handle edit with proper routing
  const handleEditWithType = (itemId: string) => {
    const path = `/dashboard/heroSection/addNavigation?mode=edit&sectionItemId=${itemId}&type=sub&parentId=${parentId}`;
    router.push(path);
  };

  // Button enabling/disabling logic
  const isAddButtonDisabled: boolean = 
    Boolean(defaultAddButtonDisabled) || 
    isLoadingMainSubSection ||
    (Boolean(parentId) && !hasMainSubSection);

  // Components
  const SubNavigationItemsTable = (
    <GenericTable
      columns={SUB_NAVIGATION_COLUMNS}
      data={subNavigationItems}
      onEdit={handleEditWithType}
      onDelete={showDeleteDialog}
    />
  );

  const CreateDialog = (
    <DialogCreateSectionItem
      open={isCreateDialogOpen}
      onOpenChange={setIsCreateDialogOpen}
      sectionId={parentId || ""}
      onServiceCreated={handleItemCreated}
      title="Sub-Navigation Item"
    />
  );

  const DeleteDialog = (
    <DeleteSectionDialog
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      serviceName={itemToDelete?.name || ""}
      onConfirm={handleDelete}
      isDeleting={isDeleting}
      title="Delete Sub-Navigation Item"
      confirmText="Confirm"
    />
  );

  // Return early if no parentId
  if (!parentId) {
    return null;
  }

  const handleBackToHero = () => {
    router.push(`/dashboard/heroSection${sectionId ? `?sectionId=${sectionId}` : ''}`)
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={handleBackToHero}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hero Section
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sub-Navigation Management</h1>
          <p className="text-muted-foreground">
            Managing sub-navigation items for: {parentNavigationData?.name || "Parent Navigation"}
          </p>
        </div>
      </div>

      {/* Main list page with table and section integration */}
      <GenericListPage
        config={SUB_NAVIGATION_CONFIG}
        sectionId={parentId}
        sectionConfig={{
          name: "Sub Navigation Section",
          slug: "sub-navigation-main",
          subSectionName: "Sub Navigation Section",
          description: "Sub navigation section for managing sub-navigation items",
          isMain: true,
          type: "SubNavigation",
          fields: [{ 
            id: "sectionTitle", 
            label: "Sub Navigation Title", 
            type: "text", 
            required: true 
          }],
          elementsMapping: {
            "sectionTitle": "Title",
            "url": "URL",
          }
        }}
        isAddButtonDisabled={isAddButtonDisabled}
        tableComponent={SubNavigationItemsTable}
        createDialogComponent={CreateDialog}
        deleteDialogComponent={DeleteDialog}
        onAddNew={handleAddNewWithType}
        isLoading={isLoadingSubNavigationItems || isLoadingMainSubSection || isLoadingParentData}
        emptyCondition={subNavigationItems.length === 0}
        noSectionCondition={!subNavigationSection && !sectionData}
        customEmptyMessage={SUB_NAVIGATION_CONFIG.emptyStateMessage}
      />
    </div>
  );
}