import { redirect } from "next/navigation"

/**
 * Home page
 * Redirects to the sign-in page
 */
export default function Home() {
  // Redirect to sign-in page
  redirect("/sign-in")
}