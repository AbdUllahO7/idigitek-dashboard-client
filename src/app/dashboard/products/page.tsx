"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { TableLoader } from "@/src/components/ui/loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Badge } from "lucide-react"
import { useState, useEffect } from "react"


/**
 * Sample product data
 */
const products = [
  {
    id: "1",
    name: "Product A",
    category: "Electronics",
    price: "$299.99",
    stock: 45,
    status: "In Stock",
  },
  {
    id: "2",
    name: "Product B",
    category: "Clothing",
    price: "$59.99",
    stock: 12,
    status: "Low Stock",
  },
  {
    id: "3",
    name: "Product C",
    category: "Home",
    price: "$129.99",
    stock: 0,
    status: "Out of Stock",
  },
  {
    id: "4",
    name: "Product D",
    category: "Electronics",
    price: "$499.99",
    stock: 28,
    status: "In Stock",
  },
  {
    id: "5",
    name: "Product E",
    category: "Books",
    price: "$19.99",
    stock: 3,
    status: "Low Stock",
  },
]

/**
 * Products page component
 * Displays a list of products with their details
 */
export default function ProductsPage() {
  const [loading, setLoading] = useState(false)
  const [productData, setProductData] = useState<typeof products>([])

  // Simulate API fetch
  useEffect(() => {
      setProductData(products)

  }, [])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
      </div>

      {/* Products table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>Manage your product inventory and stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableLoader />
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
