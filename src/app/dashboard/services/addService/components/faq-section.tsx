"use client"

import { motion } from "framer-motion"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/src/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip"
import { ServiceData } from "@/src/hooks/use-service-data"
import { FormError } from "./form-error"

interface FaqSectionProps {
  activeLanguage: string
  serviceData: ServiceData
  setServiceData: (data: ServiceData) => void
  errors: Record<string, string[]>
}

export function FaqSection({ activeLanguage, serviceData, setServiceData, errors }: FaqSectionProps) {
  // Add a new empty FAQ
  const addFaq = () => {
    const newFaq = {
      question: "",
      answer: "",
    }

    setServiceData({
      ...serviceData,
      faq: {
        ...serviceData.faq,
        [activeLanguage]: [...serviceData.faq[activeLanguage], newFaq],
      },
    })
  }

  // Update FAQ data
  const updateFaqData = (index: number, field: string, value: string) => {
    const updatedFaqs = [...serviceData.faq[activeLanguage]]
    updatedFaqs[index] = {
      ...updatedFaqs[index],
      [field]: value,
    }

    setServiceData({
      ...serviceData,
      faq: {
        ...serviceData.faq,
        [activeLanguage]: updatedFaqs,
      },
    })
  }

  // Remove a FAQ by index
  const removeFaq = (index: number) => {
    const updatedFaqs = [...serviceData.faq[activeLanguage]]
    updatedFaqs.splice(index, 1)

    setServiceData({
      ...serviceData,
      faq: {
        ...serviceData.faq,
        [activeLanguage]: updatedFaqs,
      },
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Common questions and answers about your service</CardDescription>
          </div>
          <Button onClick={addFaq} variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add FAQ
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {serviceData.faq[activeLanguage]?.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <div className="flex justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No FAQs added yet. Click "Add FAQ" to get started.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {serviceData.faq[activeLanguage].map((faq, index) => {
                  const faqErrors = errors[`${activeLanguage}_${index}`] || []

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AccordionItem value={`faq-${index}`} className="border rounded-lg px-4">
                        <div className="flex items-center justify-between">
                          <AccordionTrigger className="py-4 hover:no-underline">
                            {faq.question || `Question ${index + 1}`}
                          </AccordionTrigger>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFaq(index)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove FAQ</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <AccordionContent className="pb-4 pt-2">
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label>
                                Question <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={faq.question}
                                onChange={(e) => updateFaqData(index, "question", e.target.value)}
                                placeholder={activeLanguage === "en" ? "Enter question..." : "أدخل السؤال..."}
                                dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                                className={faqErrors.includes("Question is required") ? "border-red-500" : ""}
                              />
                              <FormError message={faqErrors.find((err) => err.includes("Question"))} />
                            </div>
                            <div className="grid gap-2">
                              <Label>
                                Answer <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                value={faq.answer}
                                onChange={(e) => updateFaqData(index, "answer", e.target.value)}
                                placeholder={activeLanguage === "en" ? "Enter answer..." : "أدخل الإجابة..."}
                                rows={3}
                                dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                                className={faqErrors.includes("Answer is required") ? "border-red-500" : ""}
                              />
                              <FormError message={faqErrors.find((err) => err.includes("Answer"))} />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  )
                })}
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
