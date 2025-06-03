"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { useTranslation } from "react-i18next"

/**
 * Theme toggle component
 * Allows switching between light, dark, and system themes
 */
export function ThemeToggle() {
  const { setTheme } = useTheme()
    const {t} = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {/* Sun icon shown in light mode */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          {/* Moon icon shown in dark mode */}
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>{t('Dashboard_Header.light')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>{t('Dashboard_Header.dark')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
