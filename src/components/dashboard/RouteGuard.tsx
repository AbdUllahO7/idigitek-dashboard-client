"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/src/context/AuthContext"
import { useSections } from "@/src/hooks/webConfiguration/use-section"
import { Section } from "@/src/api/types/sectionsTypes"

// Define route permissions map
interface RoutePermission {
  roles?: string[]
  sectionId?: string
}





// Map routes to their required permissions
const routePermissions: Record<string, RoutePermission> = {
  "/dashboard": { roles: ["superAdmin" , 'owner'] },
  "/dashboard/{section.name.toLowerCase() }": { roles: ["superAdmin" , 'owner'] },
  "/dashboard/features": {},
  "/dashboard/hero": { sectionId: "hero" },
  "/dashboard/services": {},
  "/dashboard/blog": {},
  "/dashboard/case-studies": {},
  "/dashboard/clients": {},
  "/dashboard/contact": {},
  "/dashboard/cta": {},
  "/dashboard/faq": {},
  "/dashboard/industry-solutions": {},
  "/dashboard/news": {},
  "/dashboard/partners": {},
  "/dashboard/process": {},
  "/dashboard/projects": {},
  "/dashboard/team": {},
  "/dashboard/technology-stack": {},
  "/dashboard/testimonials": {},
  "/dashboard/addWebSiteConfiguration": { roles: ["superAdmin" , 'owner'] },
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, isLoading: userIsLoading } = useAuth()
  
  const { 
    useGetAll: useGetAllSections
  } = useSections()

  const { 
    data: sections, 
    isLoading: isLoadingSections,
  } = useGetAllSections()

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!userIsLoading && !isAuthenticated) {
      router.push("/sign-in")
      return
    }

    // Don't check permissions while loading or on the login page
    if (userIsLoading || isLoadingSections || pathname === "/sign-in") {
      return
    }

    // Skip permission checks for routes not in the map (like settings, which is available to all)
    if (!routePermissions[pathname]) {
      return
    }

    // Get active sections
    const activeSections = sections?.data?.data?.filter((section: Section) => section.isActive) || []
    const activeSectionIds = activeSections.map((section: Section) => 
      section.name.toLowerCase().replace(/\s/g, "")
    )

    const permission = routePermissions[pathname]
    
    // Check role-based access
    if (permission.roles && user?.role) {
      if (!permission.roles.includes(user.role)) {
          router.push("/dashboard/unauthorized")
        return
      }
    }

    // Check section-based access
    if (permission.sectionId) {
      if (!activeSectionIds.includes(permission.sectionId)) {
        router.push("/dashboard/unauthorized")
        return
      }
    }
  }, [pathname, user, isAuthenticated, userIsLoading, sections, isLoadingSections, router])

  return <>{children}</>
}