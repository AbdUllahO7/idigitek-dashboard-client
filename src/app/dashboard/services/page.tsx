"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Plus, ArrowRight, Edit, Trash, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import GenericSectionIntegration from "@/src/components/dashboard/GenericSectionIntegration"
import { serviceSectionConfig } from "./serviceSectionConfig"
import { useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { useSectionItems } from "@/src/hooks/webConfiguration/use-section-items"
import { useSubSections } from "@/src/hooks/webConfiguration/use-subSections"
import { toast } from "@/src/components/ui/use-toast"
import DialogCreateSectionItem from "./addService/Components/DialogCreateSectionItem"
import { SectionItem } from "@/src/api/types/sectionsTypes"
import DeleteServiceDialog from "./addService/Components/DeleteServiceDialog"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 10 },
  },
}

// Service type definition
interface Service extends SectionItem {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  isMain: boolean;
  order: number;
  subsections?: any[];
}

/**
 * Service page component
 * Displays a list of services with their details and service sections
 */
export default function ServicesPage() {
  const router = useRouter()
  const [serviceSection, setServiceSection] = useState<any>(null)
  const [services, setServices] = useState<Service[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(true)
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [subsections, setSubsections] = useState<any[]>([])
  const [isLoadingSubsections, setIsLoadingSubsections] = useState<boolean>(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState<boolean>(false)
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [serviceToDelete, setServiceToDelete] = useState<{id: string; name: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const searchParams = useSearchParams()
  const sectionId = searchParams.get("sectionId")

  // API hooks for fetching section items
  const { useGetBySectionId, useDelete: useDeleteSectionItem } = useSectionItems()

  // API hooks for fetching subsections
  const { useGetBySectionItemId, useDelete: useDeleteSubSection } = useSubSections()

  // Query for section items with the parent section ID
  const {
    data: sectionItemsData,
    isLoading: isLoadingSectionItems,
    refetch: refetchServices,
  } = useGetBySectionId(
    sectionId || "", // Ensure sectionId is never null when passed to API
    true, // activeOnly
    100, // limit
    0, // skip
    true, // includeSubSectionCount
  )

  // Delete mutations
  const deleteSectionItem = useDeleteSectionItem()
  const deleteSubSection = useDeleteSubSection()

  // Handle service section change from ServiceSectionIntegration
  const handleServiceSectionChange = (sectionData: any) => {
    setServiceSection(sectionData)

    // Refetch section items list when service section changes
    if (sectionId) {
      refetchServices()
    }
  }

  // Show delete dialog
  const showDeleteDialog = (id: string, name: string) => {
    setServiceToDelete({ id, name });
    setIsDeleteDialogOpen(true);
  };

  // Handle service deletion
  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteSectionItem.mutateAsync(serviceToDelete.id);
      // Refetch the list after deletion
      refetchServices();
      toast({
        title: "Service deleted",
        description: "The service has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle editing a service
  const handleEditService = (serviceId: string) => {
    if (sectionId) {
      router.push(`services/addService?sectionId=${sectionId}&sectionItemId=${serviceId}&mode=edit`)
    } else {
      toast({
        title: "Error",
        description: "Section ID is missing. Cannot edit service.",
        variant: "destructive",
      })
    }
  }

  // Handle adding a new service
  const handleAddNewService = () => {
    if (!sectionId) {
      toast({
        title: "Error",
        description: "Section ID is missing. Cannot add service.",
        variant: "destructive",
      })
      return
    }
    
    if (!serviceSection) {
      toast({
        title: "Error",
        description: "Please create a service section first before adding services.",
        variant: "destructive",
      })
      return
    }
    
    // Open the service dialog
    setIsServiceDialogOpen(true)
  }

  // Handle service creation from the dialog
  const handleServiceCreated = (serviceId: string) => {
    // Close the dialog
    setIsServiceDialogOpen(false)
    
    // Navigate to the edit page with the new service ID
    if (serviceId) {
      router.push(`services/addService?sectionId=${sectionId}&sectionItemId=${serviceId}&mode=edit`)
    }
    
    // Refresh the services list
    refetchServices()
  }

  // Set services data when section items data is available
  useEffect(() => {
    if (sectionItemsData?.data) {
      setServices(sectionItemsData.data)
      setIsLoadingServices(false)
    } else if (!isLoadingSectionItems) {
      setIsLoadingServices(false)
    }
  }, [sectionItemsData, isLoadingSectionItems])

  // Determine if "Add New Service" button should be disabled
  const isAddButtonDisabled = !sectionId || !serviceSection;
  
  // Tooltip message for disabled button
  const addButtonTooltip = !sectionId 
    ? "Please select a section first" 
    : !serviceSection 
    ? "Please create a service section first"
    : "Add a new service";

  return (
    <>
      <motion.div className="space-y-8 p-6" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Page header */}
        <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4" variants={itemVariants}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Services Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage your service inventory and multilingual content</p>
          </div>
          <Button
            className={`group transition-all duration-300 ${
              isAddButtonDisabled ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
            }`}
            disabled={isAddButtonDisabled}
            onClick={handleAddNewService}
            title={addButtonTooltip}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Service
            <motion.span
              className="ml-1 opacity-0 group-hover:opacity-100 group-hover:ml-2"
              initial={{ width: 0 }}
              animate={{ width: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Button>
        </motion.div>

        {/* Service Section Integration Component */}
        <motion.div variants={itemVariants}>
          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <GenericSectionIntegration
                config={serviceSectionConfig}
                ParentSectionId={sectionId || ""}
                onSectionChange={handleServiceSectionChange}
                sectionTitle="Service Section Content"
                sectionDescription="Manage your service section content in multiple languages."
                addButtonLabel="Add Service Section"
                editButtonLabel="Edit Service Section"
                saveButtonLabel="Save Service Section"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Services Table */}
        <motion.div variants={itemVariants}>
          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Service List</h2>

              {isLoadingServices ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {!serviceSection 
                    ? "Please create a service section first before adding services." 
                    : "No services found. Create your first service by clicking the \"Add New Service\" button."}
                </div>
              ) : (
                <div className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Subsections</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <React.Fragment key={service._id}>
                          <TableRow className="hover:bg-muted/50">
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell className="max-w-[300px] truncate">{service.description}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  service.isActive
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                              >
                                {service.isActive ? "Active" : "Inactive"}
                              </span>
                              {service.isMain && (
                                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  Main
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{service.order}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                {service.subsections?.length || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditService(service._id)}
                                  title="Edit service"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => showDeleteDialog(service._id, service.name)}
                                  title="Delete service"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Service Dialog for creating new services */}
      <DialogCreateSectionItem
        open={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        sectionId={sectionId || ""}
        onServiceCreated={handleServiceCreated}
      />
      
      {/* Delete Service Dialog */}
      <DeleteServiceDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        serviceName={serviceToDelete?.name || ""}
        onConfirm={handleDeleteService}
        isDeleting={isDeleting}
      />
    </>
  )
}