"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"

/**
 * Navigation Progress component
 * Shows a progress bar at the top of the page during navigation
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Configure NProgress
  NProgress.configure({
    showSpinner: false,
    minimum: 0.1,
    easing: "ease",
    speed: 300,
    trickleSpeed: 200,
  })

  useEffect(() => {
    // Create custom CSS for NProgress
    const style = document.createElement("style")
    style.textContent = `
      /* NProgress styles */
      #nprogress {
        pointer-events: none;
      }
      
      #nprogress .bar {
        background: hsl(var(--primary));
        position: fixed;
        z-index: 1031;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
      }
      
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary));
        opacity: 1.0;
        transform: rotate(3deg) translate(0px, -4px);
      }
    `
    document.head.appendChild(style)

    // Handler for navigation start
    const handleRouteChangeStart = () => {
      NProgress.start()
    }

    // Handler for navigation end
    const handleRouteChangeComplete = () => {
      NProgress.done()
    }

    // Add event listeners for route changes
    document.addEventListener("navigationstart", handleRouteChangeStart)
    document.addEventListener("navigationend", handleRouteChangeComplete)

    // Clean up event listeners and styles
    return () => {
      document.removeEventListener("navigationstart", handleRouteChangeStart)
      document.removeEventListener("navigationend", handleRouteChangeComplete)
      document.head.removeChild(style)
    }
  }, [])

  // Reset progress when the route changes
  useEffect(() => {
    NProgress.done()
  }, [pathname, searchParams])

  return null
}
