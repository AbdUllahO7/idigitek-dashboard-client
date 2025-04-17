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
  "/dashboard": { roles: ["superAdmin"] },
  "/dashboard/users": { roles: ["superAdmin"] },
  "/dashboard/features": { sectionId: "features" },
  "/dashboard/hero": { sectionId: "hero" },
  "/dashboard/services": {roles: ["superAdmin"] , sectionId: "services" },
  "/dashboard/blog": { sectionId: "blog" },
  "/dashboard/case-studies": { sectionId: "caseStudiesSection" },
  "/dashboard/clients": { sectionId: "clientsSection" },
  "/dashboard/contact": { sectionId: "contact" },
  "/dashboard/cta": { sectionId: "ctaSection" },
  "/dashboard/faq": { sectionId: "faqSection" },
  "/dashboard/industry-solutions": { sectionId: "idustrySolutionsSection" },
  "/dashboard/news": { sectionId: "newsSection" },
  "/dashboard/partners": { sectionId: "partnerSection" },
  "/dashboard/process": { sectionId: "ProcessSection" },
  "/dashboard/projects": { sectionId: "projectsSection" },
  "/dashboard/team": { sectionId: "teamSection" },
  "/dashboard/technology-stack": { sectionId: "technologyStackSection" },
  "/dashboard/testimonials": { sectionId: "testimonialsSection" },
  "/dashboard/addWebSiteConfiguration": { roles: ["superAdmin"] },
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
    const activeSections = sections?.data?.filter((section: Section) => section.isActive) || []
    const activeSectionIds = activeSections.map((section: Section) => 
      section.section_name.toLowerCase().replace(/\s/g, "")
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