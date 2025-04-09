import { PageLoader } from "../components/ui/loader";

/**
 * Root loading component
 * Shown during initial page load
 */
export default function Loading() {
  return <PageLoader text="Loading..." />
}
