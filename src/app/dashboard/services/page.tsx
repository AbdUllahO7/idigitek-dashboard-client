"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Plus, Info, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import type { FieldConfig, LanguageConfig, MultilingualSectionData } from "../../types/MultilingualSectionTypes"
import MultilingualSectionComponent from "@/src/components/dashboard/MultilingualSectionComponent"

/**
 * Sample Service data
 */
const service = [
  {
    id: "1",
    name: "SERA",
    category: "Electronics",
    price: "$299.99",
    stock: 45,
    status: "In Stock",
  },
  {
    id: "2",
    name: "SERB",
    category: "Clothing",
    price: "$59.99",
    stock: 12,
    status: "Low Stock",
  },
  {
    id: "3",
    name: "Service",
    category: "Home",
    price: "$129.99",
    stock: 0,
    status: "Out of Stock",
  },
  {
    id: "4",
    name: "Service",
    category: "Electronics",
    price: "$499.99",
    stock: 28,
    status: "In Stock",
  },
  {
    id: "5",
    name: "Service",
    category: "Books",
    price: "$19.99",
    stock: 3,
    status: "Low Stock",
  },
]

/**
 * Service page component
 * Displays a list of services with their details and service sections
 */
export default function ServicesPage() {
  const [loading, setLoading] = useState(false)
  const [productData, setProductData] = useState<typeof service>([])
  const [serviceSection, setServiceSection] = useState<MultilingualSectionData | null>(null)

  // Define languages for the multilingual section
  const languages: LanguageConfig[] = [
    { id: "lang1", label: "English" },
    { id: "lang2", label: "French" },
    { id: "lang3", label: "Spanish" },
  ]

  // Define fields for the service section
  const serviceFields: FieldConfig[] = [
    { id: "sectionLabel", label: "Section Label", type: "text", required: true },
    { id: "sectionTitle", label: "Section Title", type: "text", required: true },
    { id: "sectionDescription", label: "Section Description", type: "textarea", required: true },
    { id: "serviceDetails", label: "Service Details", type: "badge", required: true },
  ]

  // Simulate API fetch
  useEffect(() => {
    setProductData(service)
  }, [])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        <Link
          className={`bg-primary text-white py-2 px-2 rounded-xl flex gap-2 dark:text-black ${
            !serviceSection ? "opacity-50 pointer-events-none" : ""
          }`}
          href={serviceSection ? "services/addService" : "#"}
          aria-disabled={!serviceSection}
        >
          <Plus /> Add New Service
        </Link>
      </div>

      {/* Service Section Component */}
      <MultilingualSectionComponent
          sectionTitle="Multilingual Service Section"
          sectionDescription="Manage your service section in multiple languages."
          fields={serviceFields}
          languages={languages}
          sectionData={serviceSection}
          onSectionChange={setServiceSection}
          addButtonLabel="Add Section"
          editButtonLabel="Edit Section"
          saveButtonLabel="Save Section"
          sectionName = "Services"
          noDataMessage="No service section added yet. Click the 'Add Section' button to create one."
      />

      {/* Products table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Inventory</CardTitle>
          <CardDescription>Manage your Service inventory and stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-24 flex items-center justify-center">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productData.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "In Stock"
                            ? "default"
                            : product.status === "Low Stock"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
