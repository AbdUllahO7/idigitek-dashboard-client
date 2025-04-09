"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BarChart3, Home, LayoutDashboard, LifeBuoy, Package, Settings, Users } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { Button } from "../ui/button"

/**
 * Navigation item interface
 */
interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

/**
 * Navigation items for the sidebar
 */
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

/**
 * Dashboard Sidebar component
 * Contains the main navigation for the dashboard
 */
export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  /**
   * Handle navigation with loading indicator
   */
  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="flex h-full flex-col border-r">
      {/* Sidebar header */}
      <div className="flex h-16 items-center border-b px-6">
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
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start">
          <LifeBuoy className="mr-2 h-5 w-5" />
          Help & Support
        </Button>
      </div>
    </div>
  )
}
