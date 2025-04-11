"use client"

import type React from "react"
import { useState } from "react"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Edit, Plus } from "lucide-react"

// Define the service section type
export interface ServiceSection {
    id: string
    sectionLabel: string
    sectionTitle: string
    sectionDescription: string
    serviceDetails: string
}

interface ServiceSectionProps {
  serviceSection: ServiceSection | null
  onSectionChange: (section: ServiceSection | null) => void
}

export default function ServiceSectionComponent({ serviceSection, onSectionChange }: ServiceSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Omit<ServiceSection, "id">>({
    sectionLabel: "",
    sectionTitle: "",
    sectionDescription: "",
    serviceDetails: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Update or create section
    onSectionChange({
      id: serviceSection?.id || Date.now().toString(),
      ...formData,
    })

    // Reset form
    setFormData({
      sectionLabel: "",
      sectionTitle: "",
      sectionDescription: "",
      serviceDetails: "",
    })
    setShowForm(false)
  }

  const handleEdit = () => {
    if (serviceSection) {
      // Populate form with current section data
      setFormData({
        sectionLabel: serviceSection.sectionLabel,
        sectionTitle: serviceSection.sectionTitle,
        sectionDescription: serviceSection.sectionDescription,
        serviceDetails: serviceSection.serviceDetails,
      })
      setShowForm(true)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Service Section</CardTitle>
          <CardDescription>Manage your service section for display on the website.</CardDescription>
        </div>
        {!serviceSection && !showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        ) : serviceSection && !showForm ? (
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Section
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sectionLabel">Section Label</Label>
                <Input
                  id="sectionLabel"
                  name="sectionLabel"
                  value={formData.sectionLabel}
                  onChange={handleInputChange}
                  placeholder="Our Services"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sectionTitle">Section Title</Label>
                <Input
                  id="sectionTitle"
                  name="sectionTitle"
                  value={formData.sectionTitle}
                  onChange={handleInputChange}
                  placeholder="Comprehensive Technology Solutions"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionDescription">Section Description</Label>
              <Textarea
                id="sectionDescription"
                name="sectionDescription"
                value={formData.sectionDescription}
                onChange={handleInputChange}
                placeholder="We provide end-to-end technology solutions..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDetails">Service Details</Label>
              <Input
                id="serviceDetails"
                name="serviceDetails"
                value={formData.serviceDetails}
                onChange={handleInputChange}
                placeholder="Service Details"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    sectionLabel: "",
                    sectionTitle: "",
                    sectionDescription: "",
                    serviceDetails: "",
                  })
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{serviceSection ? "Update" : "Save"} Section</Button>
            </div>
          </form>
        ) : serviceSection ? (
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{serviceSection.sectionLabel}</p>
                  <CardTitle className="text-xl">{serviceSection.sectionTitle}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-2">{serviceSection.sectionDescription}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{serviceSection.serviceDetails}</Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No service section added yet. Click the "Add Section" button to create one.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
