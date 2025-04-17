"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/src/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Button } from "@/src/components/ui/button"
import {
  Plus,
  Info,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Search,
  Edit,
  Trash,
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/src/components/ui/input"
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

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
}

/**
 * Service page component
 * Displays a list of services with their details and service sections
 */
export default function ServicesPage() {
  const [loading, setLoading] = useState(true)
  const [productData, setProductData] = useState<typeof service>([])
  const [serviceSection, setServiceSection] = useState<MultilingualSectionData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

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



  // Filter products based on search term
  const filteredProducts = productData.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Simulate API fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setProductData(service)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
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
            !serviceSection ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
          }`}
          disabled={!serviceSection}
          asChild
        >
          <Link href={serviceSection ? "services/addService" : "#"}>
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
          </Link>
        </Button>
      </motion.div>
      
      {/* Service Section Component */}
      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400">
                <Info className="h-4 w-4" />
              </span>
              Multilingual Service Section
            </CardTitle>
            <CardDescription>Manage your service section content in multiple languages</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
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
              sectionName="Services"
              noDataMessage="No service section added yet. Click the 'Add Section' button to create one."
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Products table */}
      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                  Service Inventory
                </CardTitle>
                <CardDescription>Manage your service inventory and stock levels</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 rounded-full border-4 border-t-teal-500 border-slate-200 animate-spin mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400">Loading service inventory...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No services found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product, i) => (
                        <motion.tr
                          key={product.id}
                          custom={i}
                          initial="hidden"
                          animate="visible"
                          variants={tableRowVariants}
                          className="group border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="font-mono">{product.price}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`
                                ${
                                  product.status === "In Stock"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                                    : product.status === "Low Stock"
                                      ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                      : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                                }
                              `}
                            >
                              {product.status === "In Stock" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                              {product.status === "Low Stock" && <AlertTriangle className="mr-1 h-3 w-3" />}
                              {product.status === "Out of Stock" && <XCircle className="mr-1 h-3 w-3" />}
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Info className="h-4 w-4" />
                                <span className="sr-only">View details</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash className="h-4 w-4 text-red-900" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
