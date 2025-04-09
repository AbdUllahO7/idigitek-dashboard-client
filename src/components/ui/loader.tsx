import type React from "react"
import { cn } from "@/src/lib/utils"
import { Loader2 } from "lucide-react"

/**
 * Props for the Loader component
 */
interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "primary" | "secondary"
  text?: string
}

/**
 * Base Loader component
 * Can be customized with different sizes, variants, and text
 */
export function Loader({ size = "md", variant = "default", text, className, ...props }: LoaderProps) {
  // Size classes for the loader icon
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  }

  // Variant classes for the loader color
  const variantClasses = {
    default: "text-foreground",
    primary: "text-primary",
    secondary: "text-muted-foreground",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)} {...props}>
      <Loader2 className={cn("animate-spin", sizeClasses[size], variantClasses[variant])} />
      {text && <p className={cn("text-sm font-medium", variantClasses[variant])}>{text}</p>}
    </div>
  )
}

/**
 * Full page loader with backdrop
 * Used for major loading states like page transitions
 */
export function FullPageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="rounded-lg bg-card p-8 shadow-lg">
        <Loader size="xl" text={text} />
      </div>
    </div>
  )
}

/**
 * Page loader for route loading states
 * Takes up the full height of the content area
 */
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
      <Loader size="lg" text={text} />
    </div>
  )
}

/**
 * Button loader for inline loading states
 * Used inside buttons during form submissions
 */
export function ButtonLoader({ className }: { className?: string }) {
  return <Loader2 className={cn("mr-2 h-4 w-4 animate-spin", className)} />
}

/**
 * Table loader for data fetching states
 * Used when loading table data
 */
export function TableLoader() {
  return (
    <div className="w-full py-10">
      <div className="flex flex-col items-center justify-center gap-2">
        <Loader size="lg" />
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    </div>
  )
}

/**
 * Card loader for content loading states
 * Used when loading card content
 */
export function CardLoader() {
  return (
    <div className="flex h-[300px] w-full items-center justify-center rounded-lg border bg-card">
      <Loader size="lg" />
    </div>
  )
}

/**
 * Content loader for general content loading states
 * Used when loading any content area
 */
export function ContentLoader({ text = "Loading content..." }: { text?: string }) {
  return (
    <div className="flex min-h-[200px] w-full items-center justify-center rounded-lg border bg-card p-8">
      <Loader size="lg" text={text} />
    </div>
  )
}
