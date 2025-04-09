"use client"

import { motion } from "framer-motion"
import { Globe, ChevronDown, Save } from "lucide-react"
import { Button } from "@/src/components/ui/button"

interface ServiceHeaderProps {
  activeLanguage: string
  setActiveLanguage: (language: string) => void
  onSubmit: () => void
}

export function ServiceHeader({ activeLanguage, setActiveLanguage, onSubmit }: ServiceHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
        <p className="text-muted-foreground mt-1">Create and manage service offerings with multilingual support</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4" />
              {activeLanguage === "en" ? "English" : "Arabic"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setActiveLanguage("en")}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveLanguage("ar")}>Arabic</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        <Button className="gap-2" onClick={onSubmit}>
          <Save className="h-4 w-4" />
          Save Service
        </Button>
      </div>
    </motion.div>
  )
}
