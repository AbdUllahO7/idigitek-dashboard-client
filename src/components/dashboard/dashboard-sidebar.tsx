"use client"

import { useState, useEffect } from "react"
import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Settings,
  Users,
  MessageSquare,
  HelpCircle,
  FileText,
  Contact,
  Building,
  Briefcase,
  Send,
  Megaphone,
  Handshake,
  Workflow,
  FolderKanban,
  Server,
  UserCircle,
} from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "@/src/lib/utils"

/**
 * Navigation item interface
 */
interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  sectionId?: string // The section ID this nav item corresponds to
}

/**
 * All possible navigation items for the sidebar
 */
const allNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    // Dashboard is always shown
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
    // Users is always shown
  },
  {
    title: "Features",
    href: "/dashboard/features",
    icon: Package,
    sectionId: "features", // Show when "features" section is selected
  },
  {
    title: "Hero",
    href: "/dashboard/hero",
    icon: Package,
    sectionId: "hero", // Show when "features" section is selected
  },
  {
    title: "Services",
    href: "/dashboard/services",
    icon: Package,
    sectionId: "service", // Show when "service" section is selected
  },
  {
    title: "Blog",
    href: "/dashboard/blog",
    icon: FileText,
    sectionId: "blog", // Show when "blog" section is selected
  },
  {
    title: "Case Studies",
    href: "/dashboard/case-studies",
    icon: Briefcase,
    sectionId: "caseStudiesSection", // Show when "caseStudiesSection" section is selected
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: Building,
    sectionId: "clientsSection", // Show when "clientsSection" section is selected
  },
  {
    title: "Contact",
    href: "/dashboard/contact",
    icon: Contact,
    sectionId: "contactSection", // Show when "contactSection" section is selected
  },
  {
    title: "CTA",
    href: "/dashboard/cta",
    icon: Send,
    sectionId: "ctaSection", // Show when "ctaSection" section is selected
  },
  {
    title: "FAQ",
    href: "/dashboard/faq",
    icon: HelpCircle,
    sectionId: "faqSection", // Show when "faqSection" section is selected
  },
  {
    title: "Industry Solutions",
    href: "/dashboard/industry-solutions",
    icon: Building,
    sectionId: "idustrySolutionsSection", // Show when "idustrySolutionsSection" section is selected
  },
  {
    title: "News",
    href: "/dashboard/news",
    icon: Megaphone,
    sectionId: "newsSection", // Show when "newsSection" section is selected
  },
  {
    title: "Partners",
    href: "/dashboard/partners",
    icon: Handshake,
    sectionId: "partnerSection", // Show when "partnerSection" section is selected
  },
  {
    title: "Process",
    href: "/dashboard/process",
    icon: Workflow,
    sectionId: "ProcessSection", // Show when "ProcessSection" section is selected
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
    sectionId: "projectsSection", // Show when "projectsSection" section is selected
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: UserCircle,
    sectionId: "teamSection", // Show when "teamSection" section is selected
  },
  {
    title: "Technology Stack",
    href: "/dashboard/technology-stack",
    icon: Server,
    sectionId: "technologyStackSection", // Show when "technologyStackSection" section is selected
  },
  {
    title: "Testimonials",
    href: "/dashboard/testimonials",
    icon: MessageSquare,
    sectionId: "testimonialsSection", // Show when "testimonialsSection" section is selected
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    // Settings is always shown
  },
]

/**
 * Dashboard Sidebar component
 * Contains the main navigation for the dashboard
 */
export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load selected sections from localStorage
    if (typeof window !== "undefined") {
      try {
        const savedSections = localStorage.getItem("selectedSections")

        if (savedSections) {
          const selectedSections = JSON.parse(savedSections) as string[]

          // Filter navigation items based on selected sections
          const filteredNavItems = allNavItems.filter((item) => {
            // Include items that don't have a sectionId (always shown)
            // Or items whose sectionId is in the selected sections
            return !item.sectionId || selectedSections.includes(item.sectionId)
          })

          setNavItems(filteredNavItems)
        } else {
          // If no sections are saved, show only the items without sectionId
          setNavItems(allNavItems.filter((item) => !item.sectionId))
        }
      } catch (error) {
        console.error("Error loading saved sections:", error)
        // In case of error, show only the items without sectionId
        setNavItems(allNavItems.filter((item) => !item.sectionId))
      } finally {
        setIsLoading(false)
      }
    }
  }, [])

  /**
   * Handle navigation with loading indicator
   */
  const handleNavigation = (href: string) => {
    router.push(href)
  }

  // Show loading state while fetching sections
  if (isLoading) {
    return (
      <div className="flex h-full flex-col border-r dark:border-slate-700 bg-background dark:bg-slate-900">
        <div className="flex h-16 items-center border-b dark:border-slate-700 px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Home className="h-6 w-6" />
            <span>Admin Dashboard</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto py-6">
          <div className="grid gap-2 px-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col border-r dark:border-slate-700 bg-background dark:bg-slate-900">
      {/* Sidebar header */}
      <div className="flex h-16 items-center border-b dark:border-slate-700 px-6">
        <button onClick={() => handleNavigation("/dashboard")} className="flex items-center gap-2 font-semibold">
          <Home className="h-6 w-6" />
          <span>Admin Dashboard</span>
        </button>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-auto py-6">
        <nav className="grid gap-2 px-4">
          {navItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className="mr-2 h-5 w-5" />
                {item.title}
              </Button>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* Sidebar footer */}
      <div className="border-t dark:border-slate-700 p-4">
        <Button variant="outline" className="w-full justify-start">
          <LifeBuoy className="mr-2 h-5 w-5" />
          Help & Support
        </Button>
      </div>
    </div>
  )
}
