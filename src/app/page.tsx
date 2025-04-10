"use client"

/**
 * Home page
 * The middleware will handle redirects, but we'll keep a simple loading state here
 * in case the middleware doesn't catch the request for some reason
 */
export default function Home() {
  // Show loading state while checking and redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <div className="h-8 w-8 border-4 border-t-transparent border-slate-800 dark:border-slate-200 dark:border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-300">Checking configuration...</p>
      </div>
    </div>
  )
}
