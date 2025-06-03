"use client"

import { Menu, User } from "lucide-react"
import { Button } from "../ui/button"
import { ThemeToggle } from "../theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useAuth } from "@/src/context/AuthContext"
import { useLanguage } from "@/src/context/LanguageContext" // Import language context
import { useRouter } from "next/navigation"
import LanguageSelector from "./LanguageSelectorComponent"
import { useTranslation } from "react-i18next"

/**
 * Props for the DashboardHeader component
 */
interface DashboardHeaderProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

/**
 * Dashboard Header component
 * Contains the top navigation bar with search, notifications, and user menu
 */
export default function DashboardHeader({ isSidebarOpen, toggleSidebar }: DashboardHeaderProps) {
    const { logout } = useAuth();
    const { language, setLanguage, isLoaded } = useLanguage(); // Use language context
    const router = useRouter()
        const {t} = useTranslation()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
          // Call the logout function from our auth context
          await logout()
          // Trigger navigation event manually (if needed for your app)
          document.dispatchEvent(new Event("navigationstart"))
        } catch (err: any) {
        console.log(err)
        }
      }

      const handleProfileToggle = () => {
        router.push('/dashboard/profile')
      }

      // Language change handler
      const handleLanguageChange = (languageCode: string) => {
        setLanguage(languageCode as 'en' | 'ar')
      }
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm">
      {/* Mobile sidebar toggle */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden" aria-label="Toggle Menu">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop sidebar toggle */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden lg:flex" aria-label="Toggle Menu">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Language Selector - only show when context is loaded to prevent hydration mismatch */}
        {isLoaded && (
          <LanguageSelector 
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
        )}
        
        {/* Theme toggle */}
        <ThemeToggle />


      </div>
    </header>
  )
}