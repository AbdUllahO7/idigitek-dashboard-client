"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Button } from "@/src/components/ui/button"
import { Edit, Trash } from "lucide-react"

// Column definition interface
export interface ColumnDefinition {
  header: string
  accessor: string
  cell?: (item: any, value: any) => React.ReactNode
  className?: string
}

// Generic table props
interface GenericTableProps {
  columns: ColumnDefinition[]
  data: any[]
  onEdit?: (id: string) => void
  onDelete?: (id: string, name: string) => void
  keyField?: string
  actionColumn?: boolean
  actionColumnHeader?: string
}

export function GenericTable({
  columns,
  data,
  onEdit,
  onDelete,
  keyField = "_id",
  actionColumn = true,
  actionColumnHeader = "Actions"
}: GenericTableProps) {
  // Function to safely get nested property values
  const getValueByPath = (obj: any, path: string) => {
    const keys = path.split('.')
    return keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, obj)
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {actionColumn && onEdit && onDelete && (
              <TableHead className="text-right">{actionColumnHeader}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item[keyField]} className="hover:bg-muted/50">
              {columns.map((column, index) => (
                <TableCell key={`${item[keyField]}-${index}`} className={column.className}>
                  {column.cell
                    ? column.cell(item, getValueByPath(item, column.accessor))
                    : getValueByPath(item, column.accessor)}
                </TableCell>
              ))}
              {actionColumn && onEdit && onDelete && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(item[keyField])}
                      title={`Edit ${item.name || 'item'}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(item[keyField], item.name || 'item')}
                      title={`Delete ${item.name || 'item'}`}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Common cell renderers
export const StatusCell = (item: any, value: boolean) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium ${
      value
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    }`}
  >
    {value ? "Active" : "Inactive"}
  </span>
)

export const CountBadgeCell = (item: any, value: number) => (
  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
    {value || 0}
  </span>
)

export const TruncatedCell = (item: any, value: string) => (
  <div className="max-w-[300px] truncate">{value}</div>
)