"use client"

import { motion } from "framer-motion"
import { Plus, Trash2, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { ServiceData } from "@/src/hooks/use-service-data"
import { FormError } from "./form-error"

interface FeaturesSectionProps {
  activeLanguage: string
  serviceData: ServiceData
  setServiceData: (data: ServiceData) => void
  errors: Record<string, string[]>
}

export function FeaturesSection({ activeLanguage, serviceData, setServiceData, errors }: FeaturesSectionProps) {
  // Add a new empty feature
  const addFeature = () => {
    const newFeature = {
      id: `feature-${Date.now()}`,
      title: "",
      content: {
        heading: "",
        description: "",
        features: [""],
        image: "",
        imageAlt: "",
        imagePosition: "right",
      },
    }

    setServiceData({
      ...serviceData,
      features: {
        ...serviceData.features,
        [activeLanguage]: [...serviceData.features[activeLanguage], newFeature],
      },
    })
  }

  // Update features data
  const updateFeatureData = (index: number, field: string, value: string) => {
    const updatedFeatures = [...serviceData.features[activeLanguage]]

    if (field.includes(".")) {
      const [parentField, childField] = field.split(".")
      updatedFeatures[index] = {
        ...updatedFeatures[index],
        [parentField]: {
          ...updatedFeatures[index][parentField],
          [childField]: value,
        },
      }
    } else {
      updatedFeatures[index] = {
        ...updatedFeatures[index],
        [field]: value,
      }
    }

    setServiceData({
      ...serviceData,
      features: {
        ...serviceData.features,
        [activeLanguage]: updatedFeatures,
      },
    })
  }

  // Update feature list item
  const updateFeatureListItem = (featureIndex: number, listIndex: number, value: string) => {
    const updatedFeatures = [...serviceData.features[activeLanguage]]
    const updatedList = [...updatedFeatures[featureIndex].content.features]
    updatedList[listIndex] = value

    updatedFeatures[featureIndex] = {
      ...updatedFeatures[featureIndex],
      content: {
        ...updatedFeatures[featureIndex].content,
        features: updatedList,
      },
    }

    setServiceData({
      ...serviceData,
      features: {
        ...serviceData.features,
        [activeLanguage]: updatedFeatures,
      },
    })
  }

  // Add feature list item
  const addFeatureListItem = (featureIndex: number) => {
    const updatedFeatures = [...serviceData.features[activeLanguage]]

    updatedFeatures[featureIndex] = {
      ...updatedFeatures[featureIndex],
      content: {
        ...updatedFeatures[featureIndex].content,
        features: [...updatedFeatures[featureIndex].content.features, ""],
      },
    }

    setServiceData({
      ...serviceData,
      features: {
        ...serviceData.features,
        [activeLanguage]: updatedFeatures,
      },
    })
  }

  // Remove feature list item
  const removeFeatureListItem = (featureIndex: number, listIndex: number) => {
    const updatedFeatures = [...serviceData.features[activeLanguage]]
    const updatedList = [...updatedFeatures[featureIndex].content.features]
    updatedList.splice(listIndex, 1)

    updatedFeatures[featureIndex] = {
      ...updatedFeatures[featureIndex],
      content: {
        ...updatedFeatures[featureIndex].content,
        features: updatedList,
      },
    }

    setServiceData({
      ...serviceData,
      features: {
        ...serviceData.features,
        [activeLanguage]: updatedFeatures,
      },
    })
  }

  // Remove a feature by index
  const removeFeature = (index: number) => {
    const updatedFeatures = [...serviceData.features[activeLanguage]]
    updatedFeatures.splice(index, 1)

    setServiceData({
      ...serviceData,
      features: {
        ...serviceData.features,
        [activeLanguage]: updatedFeatures,
      },
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Features</CardTitle>
            <CardDescription>In-depth features of your service with supporting details</CardDescription>
          </div>
          <Button onClick={addFeature} variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Feature
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {serviceData.features[activeLanguage]?.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <div className="flex justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No features added yet. Click "Add Feature" to get started.</p>
              </div>
            ) : (
              serviceData.features[activeLanguage].map((feature, index) => {
                const featureErrors = errors[`${activeLanguage}_${index}`] || []

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Accordion type="single" collapsible className="border rounded-lg">
                      <AccordionItem value={`feature-${index}`} className="border-0">
                        <AccordionTrigger className="px-4 py-2 hover:no-underline group">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span>{feature.title || `Feature ${index + 1}`}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFeature(index)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>
                                  Feature ID <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  value={feature.id}
                                  onChange={(e) => updateFeatureData(index, "id", e.target.value)}
                                  placeholder="feature-id"
                                  className={featureErrors.includes("ID is required") ? "border-red-500" : ""}
                                />
                                <FormError message={featureErrors.find((err) => err.includes("ID"))} />
                              </div>
                              <div className="grid gap-2">
                                <Label>
                                  Feature Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  value={feature.title}
                                  onChange={(e) => updateFeatureData(index, "title", e.target.value)}
                                  placeholder={activeLanguage === "en" ? "Feature Title" : "عنوان الميزة"}
                                  dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                                  className={featureErrors.includes("Title is required") ? "border-red-500" : ""}
                                />
                                <FormError message={featureErrors.find((err) => err.includes("Title"))} />
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label>
                                Heading <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={feature.content.heading}
                                onChange={(e) => updateFeatureData(index, "content.heading", e.target.value)}
                                placeholder={activeLanguage === "en" ? "Feature Heading" : "عنوان فرعي"}
                                dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                                className={featureErrors.includes("Heading is required") ? "border-red-500" : ""}
                              />
                              <FormError message={featureErrors.find((err) => err.includes("Heading"))} />
                            </div>

                            <div className="grid gap-2">
                              <Label>
                                Description <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                value={feature.content.description}
                                onChange={(e) => updateFeatureData(index, "content.description", e.target.value)}
                                placeholder={activeLanguage === "en" ? "Describe this feature..." : "وصف هذه الميزة..."}
                                rows={3}
                                dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                                className={featureErrors.includes("Description is required") ? "border-red-500" : ""}
                              />
                              <FormError message={featureErrors.find((err) => err.includes("Description"))} />
                            </div>

                            <div className="grid gap-2">
                              <div className="flex items-center justify-between">
                                <Label>Feature List Items</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addFeatureListItem(index)}
                                  className="h-8 gap-1"
                                >
                                  <Plus className="h-3 w-3" /> Add Item
                                </Button>
                              </div>

                              <div className="space-y-2 mt-1">
                                {feature.content.features.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex items-center gap-2">
                                    <Input
                                      value={item}
                                      onChange={(e) => updateFeatureListItem(index, itemIndex, e.target.value)}
                                      placeholder={activeLanguage === "en" ? "Feature point..." : "نقطة ميزة..."}
                                      dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 flex-shrink-0"
                                      onClick={() => removeFeatureListItem(index, itemIndex)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Image URL</Label>
                                <Input
                                  value={feature.content.image}
                                  onChange={(e) => updateFeatureData(index, "content.image", e.target.value)}
                                  placeholder="https://example.com/image.jpg"
                                  className={
                                    featureErrors.includes("Image must be a valid URL") ? "border-red-500" : ""
                                  }
                                />
                                <FormError message={featureErrors.find((err) => err.includes("Image"))} />
                              </div>
                              <div className="grid gap-2">
                                <Label>Image Alt Text</Label>
                                <Input
                                  value={feature.content.imageAlt}
                                  onChange={(e) => updateFeatureData(index, "content.imageAlt", e.target.value)}
                                  placeholder={activeLanguage === "en" ? "Image description" : "وصف الصورة"}
                                  dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                                />
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label>Image Position</Label>
                              <Select
                                value={feature.content.imagePosition}
                                onValueChange={(value) => updateFeatureData(index, "content.imagePosition", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {feature.content.image && (
                              <div className="mt-2 p-4 border rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                                <div
                                  className={`flex flex-col ${feature.content.imagePosition === "right" ? "md:flex-row" : "md:flex-row-reverse"} gap-4 items-center`}
                                >
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-2">{feature.content.heading}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">{feature.content.description}</p>
                                    {feature.content.features.length > 0 && (
                                      <ul className="list-disc list-inside space-y-1">
                                        {feature.content.features.map((item, i) => (
                                          <li key={i} className="text-sm">
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                  <div className="w-full md:w-1/3 h-[120px] rounded-md overflow-hidden border">
                                    <img
                                      src={feature.content.image || "/placeholder.svg"}
                                      alt={feature.content.imageAlt}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg?height=200&width=300"
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </motion.div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
