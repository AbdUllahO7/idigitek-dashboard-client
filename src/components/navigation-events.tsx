"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { FullPageLoader } from "./ui/loader"

/**
 * Navigation Events component
 * Handles showing a full-page loader during navigation
 */
export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Handler for navigation start
    const handleRouteChangeStart = () => {
      // Set a minimum loading time to avoid flickering for fast navigations
      const timeout = setTimeout(() => {
        setIsNavigating(true)
      }, 100)
      setLoadingTimeout(timeout)
    }

    // Handler for navigation end
    const handleRouteChangeComplete = () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
      setIsNavigating(false)
    }

    // Add event listeners for route changes
    document.addEventListener("navigationstart", handleRouteChangeStart)
    document.addEventListener("navigationend", handleRouteChangeComplete)

    // Clean up event listeners
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
      document.removeEventListener("navigationstart", handleRouteChangeStart)
      document.removeEventListener("navigationend", handleRouteChangeComplete)
    }
  }, [loadingTimeout])

  // Reset loading state when the route changes
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname, searchParams])

  return isNavigating ? <FullPageLoader text="Navigating..." /> : null
}
