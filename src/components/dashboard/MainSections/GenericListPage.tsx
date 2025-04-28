"use client"

import React, { useState, useEffect, ReactNode } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Plus, ArrowRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/src/hooks/use-toast"

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

// Generic configuration interface
export interface ListPageConfig {
  title: string
  description: string
  addButtonLabel: string
  emptyStateMessage: string
  noSectionMessage: string
  sectionIntegrationTitle: string
  sectionIntegrationDescription: string
  addSectionButtonLabel: string
  editSectionButtonLabel: string
  saveSectionButtonLabel: string
  listTitle: string
  editPath: string
  createPath?: string
}

// Generic list page props
interface GenericListPageProps {
  config: ListPageConfig
  sectionId: string | null
  sectionConfig: any
  isAddButtonDisabled: boolean
  addButtonTooltip: string
  tableComponent: ReactNode
  sectionIntegrationComponent: ReactNode
  createDialogComponent: ReactNode
  deleteDialogComponent: ReactNode
  onAddNew: () => void
  handleRefresh?: () => void
  isLoading?: boolean
  isLoadingSection?: boolean
  emptyCondition: boolean
  noSectionCondition: boolean
}

export function GenericListPage({
  config,
  sectionId,
  isAddButtonDisabled,
  addButtonTooltip,
  tableComponent,
  sectionIntegrationComponent,
  createDialogComponent,
  deleteDialogComponent,
  onAddNew,
  handleRefresh,
  isLoading = false,
  emptyCondition,
  noSectionCondition
}: GenericListPageProps) {
  const router = useRouter()
  const { toast } = useToast()

  return (
    <>
      <motion.div className="space-y-8 p-6" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Page header */}
        <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4" variants={itemVariants}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              {config.title}
            </h1>
            <p className="text-muted-foreground mt-1">{config.description}</p>
          </div>
          <Button
            className={`group transition-all duration-300 ${
              isAddButtonDisabled ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
            }`}
            disabled={isAddButtonDisabled}
            onClick={onAddNew}
            title={addButtonTooltip}
          >
            <Plus className="mr-2 h-4 w-4" />
            {config.addButtonLabel}
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

        {/* Section Integration Component */}
        <motion.div variants={itemVariants}>
          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              {sectionIntegrationComponent}
            </CardContent>
          </Card>
        </motion.div>

        {/* Items Table */}
        <motion.div variants={itemVariants}>
          <Card className="border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{config.listTitle}</h2>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : emptyCondition ? (
                <div className="text-center py-8 text-muted-foreground">
                  {noSectionCondition 
                    ? config.noSectionMessage
                    : config.emptyStateMessage}
                </div>
              ) : (
                tableComponent
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Dialogs */}
      {createDialogComponent}
      {deleteDialogComponent}
    </>
  )
}