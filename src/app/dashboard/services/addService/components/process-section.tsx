"use client"

import { motion } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip"
import { ServiceData } from "@/src/hooks/use-service-data"
import { FormError } from "./form-error"

interface ProcessSectionProps {
  activeLanguage: string
  serviceData: ServiceData
  setServiceData: (data: ServiceData) => void
  errors: Record<string, string[]>
}

export function ProcessSection({ activeLanguage, serviceData, setServiceData, errors }: ProcessSectionProps) {
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

  // Add a new empty process step
  const addProcessStep = () => {
    const newStep = {
      icon: "Car",
      title: "",
      description: "",
    }

    setServiceData({
      ...serviceData,
      processSteps: {
        ...serviceData.processSteps,
        [activeLanguage]: [...serviceData.processSteps[activeLanguage], newStep],
      },
    })
  }

  // Update process steps data
  const updateProcessStepData = (index: number, field: string, value: string) => {
    const updatedProcessSteps = [...serviceData.processSteps[activeLanguage]]
    updatedProcessSteps[index] = {
      ...updatedProcessSteps[index],
      [field]: value,
    }

    setServiceData({
      ...serviceData,
      processSteps: {
        ...serviceData.processSteps,
        [activeLanguage]: updatedProcessSteps,
      },
    })
  }

  // Remove a process step by index
  const removeProcessStep = (index: number) => {
    const updatedProcessSteps = [...serviceData.processSteps[activeLanguage]]
    updatedProcessSteps.splice(index, 1)

    setServiceData({
      ...serviceData,
      processSteps: {
        ...serviceData.processSteps,
        [activeLanguage]: updatedProcessSteps,
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
            <CardTitle>Process Steps</CardTitle>
            <CardDescription>Step-by-step guide to how your service works</CardDescription>
          </div>
          <Button onClick={addProcessStep} variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Step
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {serviceData.processSteps[activeLanguage]?.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <div className="flex justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No process steps added yet. Click "Add Step" to get started.</p>
              </div>
            ) : (
              <div className="relative">
                {serviceData.processSteps[activeLanguage].length > 1 && (
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border z-0"></div>
                )}
                <div className="space-y-6 relative z-10">
                  {serviceData.processSteps[activeLanguage].map((step, index) => {
                    const stepErrors = errors[`${activeLanguage}_${index}`] || []

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="rounded-lg border p-4 relative group bg-card"
                      >
                        <div className="absolute -left-3 top-4 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                          {index + 1}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeProcessStep(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove step</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="grid gap-4 pl-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label>Icon</Label>
                              <Select
                                value={step.icon}
                                onValueChange={(value) => updateProcessStepData(index, "icon", value)}
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
                                value={step.title}
                                onChange={(e) => updateProcessStepData(index, "title", e.target.value)}
                                placeholder={activeLanguage === "en" ? "Step Title" : "عنوان الخطوة"}
                                dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                                className={stepErrors.includes("Title is required") ? "border-red-500" : ""}
                              />
                              <FormError message={stepErrors.find((err) => err.includes("Title"))} />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label>
                              Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              value={step.description}
                              onChange={(e) => updateProcessStepData(index, "description", e.target.value)}
                              placeholder={activeLanguage === "en" ? "Describe this step..." : "وصف هذه الخطوة..."}
                              rows={2}
                              dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                              className={stepErrors.includes("Description is required") ? "border-red-500" : ""}
                            />
                            <FormError message={stepErrors.find((err) => err.includes("Description"))} />
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
