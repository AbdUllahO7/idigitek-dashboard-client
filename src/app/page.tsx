"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Home page
 * Checks if user has made selections and redirects accordingly
 */
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user has made selections in local storage
    const hasSelectedLanguages = localStorage.getItem("selectedLanguages")
    const hasSelectedSections = localStorage.getItem("selectedSections")

    // If both selections exist and are not empty arrays, redirect to dashboard
    if (
      hasSelectedLanguages && 
      hasSelectedSections && 
      JSON.parse(hasSelectedLanguages).length > 0 && 
      JSON.parse(hasSelectedSections).length > 0
    ) {
      router.push("/dashboard")
    } else {
      // Otherwise redirect to configuration page
      router.push("/websiteConfiguration")
    }
  }, [router])

  // Show loading state while checking and redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-t-transparent border-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Checking configuration...</p>
      </div>
    </div>
  )
}
