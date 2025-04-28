"use client"

import { useSearchParams } from "next/navigation"
import { useGenericList } from "@/src/hooks/useGenericList"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"
import GenericSectionIntegration from "@/src/components/dashboard/GenericSectionIntegration"
import { serviceSectionConfig } from "./serviceSectionConfig"
import DialogCreateSectionItem from "@/src/components/DialogCreateSectionItem"
import DeleteServiceDialog from "@/src/components/DeleteServiceDialog"
import { CountBadgeCell, GenericTable, StatusCell, TruncatedCell } from "@/src/components/dashboard/MainSections/GenericTable"
import { GenericListPage } from "@/src/components/dashboard/MainSections/GenericListPage"

// Configuration for the Services page
const servicesConfig = {
  title: "Services Management",
  description: "Manage your service inventory and multilingual content",
  addButtonLabel: "Add New Service",
  emptyStateMessage: "No services found. Create your first service by clicking the \"Add New Service\" button.",
  noSectionMessage: "Please create a service section first before adding services.",
  sectionIntegrationTitle: "Service Section Content",
  sectionIntegrationDescription: "Manage your service section content in multiple languages.",
  addSectionButtonLabel: "Add Service Section",
  editSectionButtonLabel: "Edit Service Section",
  saveSectionButtonLabel: "Save Service Section",
  listTitle: "Service List",
  editPath: "services/addService"
}

// Column definitions for the services table
const serviceColumns = [
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
      <>
        {StatusCell(item, value)}
        {item.isMain && (
          <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Main
          </span>
        )}
      </>
    )
  },
  {
    header: "Order",
    accessor: "order"
  },
  {
    header: "Subsections",
    accessor: "subsections.length",
    cell: CountBadgeCell
  }
]

export default function ServicesPage() {
  const searchParams = useSearchParams()
  const sectionId = searchParams.get("sectionId")
  
  // Use the generic list hook for service management
  const {
    section: serviceSection,
    items: services,
    isLoadingItems: isLoadingServices,
    isCreateDialogOpen: isServiceDialogOpen,
    isDeleteDialogOpen,
    itemToDelete: serviceToDelete,
    isDeleting,
    isAddButtonDisabled,
    addButtonTooltip,
    handleSectionChange,
    handleEdit: handleEditService,
    handleDelete: handleDeleteService,
    handleAddNew: handleAddNewService,
    handleItemCreated: handleServiceCreated,
    showDeleteDialog,
    setIsCreateDialogOpen: setIsServiceDialogOpen,
    setIsDeleteDialogOpen
  } = useGenericList({
    sectionId,
    apiHooks: useSectionItems(),
    editPath: servicesConfig.editPath
  })

  // Create the table component
  const servicesTable = (
    <GenericTable
      columns={serviceColumns}
      data={services}
      onEdit={handleEditService}
      onDelete={showDeleteDialog}
    />
  )

  // Create the section integration component
  const sectionIntegrationComponent = (
    <GenericSectionIntegration
      config={serviceSectionConfig}
      ParentSectionId={sectionId || ""}
      onSectionChange={handleSectionChange}
      sectionTitle={servicesConfig.sectionIntegrationTitle}
      sectionDescription={servicesConfig.sectionIntegrationDescription}
      addButtonLabel={servicesConfig.addSectionButtonLabel}
      editButtonLabel={servicesConfig.editSectionButtonLabel}
      saveButtonLabel={servicesConfig.saveSectionButtonLabel}
    />
  )

  // Create dialog components
  const createDialogComponent = (
    <DialogCreateSectionItem
      open={isServiceDialogOpen}
      onOpenChange={setIsServiceDialogOpen}
      sectionId={sectionId || ""}
      onServiceCreated={handleServiceCreated}
    />
  )

  const deleteDialogComponent = (
    <DeleteServiceDialog
      open={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      serviceName={serviceToDelete?.name || ""}
      onConfirm={handleDeleteService}
      isDeleting={isDeleting}
    />
  )

  return (
    <GenericListPage
      config={servicesConfig}
      sectionId={sectionId}
      sectionConfig={serviceSectionConfig}
      isAddButtonDisabled={isAddButtonDisabled}
      addButtonTooltip={addButtonTooltip}
      tableComponent={servicesTable}
      sectionIntegrationComponent={sectionIntegrationComponent}
      createDialogComponent={createDialogComponent}
      deleteDialogComponent={deleteDialogComponent}
      onAddNew={handleAddNewService}
      isLoading={isLoadingServices}
      emptyCondition={services.length === 0}
      noSectionCondition={!serviceSection}
    />
  )
}