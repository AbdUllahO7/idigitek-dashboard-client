"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Globe, 
  LayoutGrid, 
  AlertTriangle,
  Loader2,
  Palette
} from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { useWebSite } from "@/src/hooks/webConfiguration/use-WebSite"
import WebsiteList from "@/src/components/dashboard/WebSiteConfiguration/WebSite"
import { LanguageManagement } from "@/src/components/dashboard/WebSiteConfiguration/Languages"
import { SectionManagement } from "@/src/components/dashboard/WebSiteConfiguration/Sections"
import { ThemeManagement } from "@/src/components/dashboard/WebSiteConfiguration/ThemeManagement"
import { useTranslation } from "react-i18next"
import { useLanguage } from "@/src/context/LanguageContext"

// Main Component
export default function AdminManagementPage() {
  const { useGetMyWebsites } = useWebSite();
  const { data: websites = [], isLoading: isLoadingWebsites, error: websitesError } = useGetMyWebsites();
  const [activeTab, setActiveTab] = useState("languages");
  const { t } = useTranslation();
  const { isLoaded, language } = useLanguage();
  const isRTL = language === 'ar';

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  if (isLoadingWebsites) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isRTL ? 'rtl' : ''}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            {t('adminManagement.loading.content')}
          </p>
        </div>
      </div>
    );
  }

  if (websitesError) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isRTL ? 'rtl' : ''}`}>
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              {t('adminManagement.error.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300">
              {(websitesError as Error)?.message || t('adminManagement.error.message')}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()}>
              {t('adminManagement.error.refreshButton')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const hasWebsite = websites.length > 0;

  return (
    <main className={`min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 ${isRTL ? 'rtl' : ''}`}>
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-purple-500/10 to-transparent dark:from-purple-900/20" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl text-center"
          >
            {t('adminManagement.title')}
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl text-center"
          >
            {t('adminManagement.subtitle')}
          </motion.p>
        </div>
        
        <WebsiteList />
        
        <Tabs 
          defaultValue="languages" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-6"
          >
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger 
                value="languages" 
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Globe className="h-4 w-4" />
                {t('adminManagement.tabs.languages')}
              </TabsTrigger>
              <TabsTrigger 
                value="sections" 
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <LayoutGrid className="h-4 w-4" />
                {t('adminManagement.tabs.sections')}
              </TabsTrigger>
              <TabsTrigger 
                value="themes" 
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Palette className="h-4 w-4" />
                {t('adminManagement.tabs.themes')}
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <TabsContent value="languages">
            <LanguageManagement hasWebsite={hasWebsite} />
          </TabsContent>
          
          <TabsContent value="sections">
            <SectionManagement hasWebsite={hasWebsite} />
          </TabsContent>
          
          <TabsContent value="themes">
            <ThemeManagement hasWebsite={hasWebsite} websites={websites} />
          </TabsContent>
        </Tabs>

        <motion.div 
          variants={fadeIn}
          initial="hidden" 
          animate="visible"
          className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8"
        >
          <p>{t('adminManagement.footer.description')}</p>
          <p className="mt-1">{t('adminManagement.footer.note')}</p>
        </motion.div>
      </div>
    </main>
  );
}