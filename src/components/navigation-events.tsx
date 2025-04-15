"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { FullPageLoader } from "./ui/loader"

// Component that uses searchParams
function SearchParamsWatcher({ setIsNavigating }: { setIsNavigating: (value: boolean) => void }) {

  
  return null
}

/**
 * Navigation Events component
 * Handles showing a full-page loader during navigation
 */
export function NavigationEvents() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null)

  // useEffect(() => {
    // Handler for navigation start
    // const handleRouteChangeStart = () => {
    //   // Set a minimum loading time to avoid flickering for fast navigations
    //   const timeout = setTimeout(() => {
    //     setIsNavigating(true)
    //   }, 100)
    //   setLoadingTimeout(timeout)
    // }

    // Handler for navigation end
    const handleRouteChangeComplete = () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
      setIsNavigating(false)
    }

    // Add event listeners for route changes
    // document.addEventListener("navigationstart", handleRouteChangeStart)
    // document.addEventListener("navigationend", handleRouteChangeComplete)

    // Clean up event listeners
  //   return () => {
  //     if (loadingTimeout) {
  //       clearTimeout(loadingTimeout)
  //     }
  //     document.removeEventListener("navigationstart", handleRouteChangeStart)
  //     document.removeEventListener("navigationend", handleRouteChangeComplete)
  //   }
  // }, [loadingTimeout])

  // Reset loading state when pathname changes
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsWatcher setIsNavigating={setIsNavigating} />
      </Suspense>
      {isNavigating ? <FullPageLoader text="Navigating..." /> : null}
    </>
  )
}