"use client"

import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Textarea } from "@/src/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip"
import { ServiceData } from "@/src/hooks/use-service-data"
import { motion } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { FormError } from "./form-error"


interface BenefitsSectionProps {
  activeLanguage: string
  serviceData: ServiceData
  setServiceData: (data: ServiceData) => void
  errors: Record<string, string[]>
}

export function BenefitsSection({ activeLanguage, serviceData, setServiceData, errors }: BenefitsSectionProps) {
  // Available icons for selection
  const availableIcons = [
    { name: "Clock", value: "Clock" },
    { name: "MessageSquare", value: "MessageSquare" },
    { name: "LineChart", value: "LineChart" },
    { name: "Headphones", value: "Headphones" },
    { name: "Car", value: "Car" },
    { name: "MonitorSmartphone", value: "MonitorSmartphone" },
    { name: "Settings", value: "Settings" },
    { name: "CreditCard", value: "CreditCard" },
  ]

  // Add a new empty benefit
  const addBenefit = () => {
    const newBenefit = {
      icon: "Clock",
      title: "",
      description: "",
    }

    setServiceData({
      ...serviceData,
      benefits: {
        ...serviceData.benefits,
        [activeLanguage]: [...serviceData.benefits[activeLanguage], newBenefit],
      },
    })
  }

  // Update benefits data
  const updateBenefitData = (index: number, field: string, value: string) => {
    const updatedBenefits = [...serviceData.benefits[activeLanguage]]
    updatedBenefits[index] = {
      ...updatedBenefits[index],
      [field]: value,
    }

    setServiceData({
      ...serviceData,
      benefits: {
        ...serviceData.benefits,
        [activeLanguage]: updatedBenefits,
      },
    })
  }

  // Remove a benefit by index
  const removeBenefit = (index: number) => {
    const updatedBenefits = [...serviceData.benefits[activeLanguage]]
    updatedBenefits.splice(index, 1)

    setServiceData({
      ...serviceData,
      benefits: {
        ...serviceData.benefits,
        [activeLanguage]: updatedBenefits,
      },
    })
  }

  // Render dynamic icon
  const renderIcon = (iconName: string) => {
    const IconComponent = IconMap[iconName]
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Benefits</CardTitle>
            <CardDescription>Key advantages of the service that you want to highlight</CardDescription>
          </div>
          <Button onClick={addBenefit} variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Benefit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {serviceData.benefits[activeLanguage]?.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <div className="flex justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No benefits added yet. Click "Add Benefit" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceData.benefits[activeLanguage].map((benefit, index) => {
                  const benefitErrors = errors[`${activeLanguage}_${index}`] || []

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-lg border p-4 relative group"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeBenefit(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove benefit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Icon</Label>
                            <Select
                              value={benefit.icon}
                              onValueChange={(value) => updateBenefitData(index, "icon", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an icon" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIcons.map((icon) => (
                                  <SelectItem key={icon.value} value={icon.value}>
                                    <div className="flex items-center gap-2">
                                      {renderIcon(icon.value)}
                                      <span>{icon.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>
                              Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={benefit.title}
                              onChange={(e) => updateBenefitData(index, "title", e.target.value)}
                              placeholder={activeLanguage === "en" ? "Benefit Title" : "عنوان الميزة"}
                              dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                              className={benefitErrors.includes("Title is required") ? "border-red-500" : ""}
                            />
                            <FormError message={benefitErrors.find((err) => err.includes("Title"))} />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>
                            Description <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            value={benefit.description}
                            onChange={(e) => updateBenefitData(index, "description", e.target.value)}
                            placeholder={activeLanguage === "en" ? "Describe this benefit..." : "وصف هذه الميزة..."}
                            rows={2}
                            dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                            className={benefitErrors.includes("Description is required") ? "border-red-500" : ""}
                          />
                          <FormError message={benefitErrors.find((err) => err.includes("Description"))} />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
