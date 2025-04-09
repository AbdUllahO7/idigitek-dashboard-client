"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Textarea } from "@/src/components/ui/textarea"
import { FormError } from "./form-error"
import { ServiceData } from "@/src/hooks/use-service-data"

interface HeroSectionProps {
  activeLanguage: string
  serviceData: ServiceData
  setServiceData: (data: ServiceData) => void
  errors: Record<string, string[]>
}

export function HeroSection({ activeLanguage, serviceData, setServiceData, errors }: HeroSectionProps) {
  // Update hero data
  const updateHeroData = (field: string, value: string) => {
    setServiceData({
      ...serviceData,
      hero: {
        ...serviceData.hero,
        [activeLanguage]: {
          ...serviceData.hero[activeLanguage],
          [field]: value,
        },
      },
    })
  }

  const languageErrors = errors[activeLanguage] || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Configure the main banner that appears at the top of the service page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="heroTitle">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="heroTitle"
                  value={serviceData.hero[activeLanguage].title}
                  onChange={(e) => updateHeroData("title", e.target.value)}
                  placeholder={activeLanguage === "en" ? "Smart Drive-Through Solutions" : "حلول السيارات الذكية"}
                  dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                  className={`h-10 ${languageErrors.includes("Title is required") ? "border-red-500" : ""}`}
                />
                <FormError message={languageErrors.find((err) => err.includes("Title"))} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="heroDescription">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="heroDescription"
                  value={serviceData.hero[activeLanguage].description}
                  onChange={(e) => updateHeroData("description", e.target.value)}
                  placeholder={activeLanguage === "en" ? "Describe your service..." : "وصف الخدمة الخاصة بك..."}
                  rows={4}
                  dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                  className={languageErrors.includes("Description is required") ? "border-red-500" : ""}
                />
                <FormError message={languageErrors.find((err) => err.includes("Description"))} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="heroBackLinkText">Back Link Text</Label>
                <Input
                  id="heroBackLinkText"
                  value={serviceData.hero[activeLanguage].backLinkText}
                  onChange={(e) => updateHeroData("backLinkText", e.target.value)}
                  placeholder={activeLanguage === "en" ? "Back to Services" : "العودة إلى الخدمات"}
                  dir={activeLanguage === "ar" ? "rtl" : "ltr"}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="heroBackground">Background Image URL</Label>
                <Input
                  id="heroBackground"
                  value={serviceData.hero[activeLanguage].backgroundImage}
                  onChange={(e) => updateHeroData("backgroundImage", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={`h-10 ${languageErrors.includes("Background image must be a valid URL") ? "border-red-500" : ""}`}
                />
                <FormError message={languageErrors.find((err) => err.includes("Background image"))} />
              </div>

              {serviceData.hero[activeLanguage].backgroundImage && (
                <div className="relative h-[220px] w-full overflow-hidden rounded-lg border mt-6">
                  <img
                    src={serviceData.hero[activeLanguage].backgroundImage || "/placeholder.svg"}
                    alt="Hero Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=400&width=800"
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-center p-6">
                    <h2
                      className={`text-2xl font-bold text-white mb-2 ${activeLanguage === "ar" ? "text-right" : "text-left"}`}
                    >
                      {serviceData.hero[activeLanguage].title ||
                        (activeLanguage === "en" ? "Title goes here" : "العنوان هنا")}
                    </h2>
                    <p className={`text-white/80 ${activeLanguage === "ar" ? "text-right" : "text-left"}`}>
                      {serviceData.hero[activeLanguage].description ||
                        (activeLanguage === "en" ? "Description goes here" : "الوصف هنا")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
