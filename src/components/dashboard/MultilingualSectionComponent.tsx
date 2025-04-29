"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

import { useLanguages } from "@/src/hooks/webConfiguration/use-language"
import { Language, MultilingualSectionProps } from "@/src/api/types"
import { Globe } from "lucide-react"



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}


export default function MultilingualSectionComponent({

}: MultilingualSectionProps) {
  const [activeTab, setActiveTab] = useState("")

  // Get languages from API
  const { 
    useGetAll: useGetAllLanguages
  } = useLanguages();

  const { 
    data: languagesData, 
    isLoading: isLoadingLanguages,
  } = useGetAllLanguages();

  // Ensure activeLanguages is properly typed
  const activeLanguages: Language[] = languagesData?.data?.filter((lang: Language) => lang.isActive) || [];
  



  // Update active tab when languages change
  useEffect(() => {
    if (activeLanguages.length > 0 && !activeTab && activeLanguages[0]?.languageID) {
      setActiveTab(activeLanguages[0].languageID);
    }
  }, [activeLanguages, activeTab]);



  



  // Render the value in view mode based on field type


  // Show loading state while fetching languages
  if (isLoadingLanguages) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // If no languages available, show message
  if (activeLanguages.length === 0) {
    return (
      <Card className="shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No active languages found. Please activate at least one language in settings.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="rounded-xl overflow-hidden">
   
    </motion.div>
  );
}