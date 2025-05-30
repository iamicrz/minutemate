"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export default function RedirectPage() {
  const router = useRouter()
  const { user, isSignedIn, isLoaded } = useUser()
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const [message, setMessage] = useState("Checking authentication...")

  // Handle redirection based on user role
  useEffect(() => {
    // Prevent multiple redirect attempts
    if (redirectAttempted) return
    
    const handleRedirect = async () => {
      try {
        // Wait for Clerk to load
        if (!isLoaded) {
          setMessage("Loading authentication...")
          return
        }

        // If not signed in, go to login
        if (!isSignedIn) {
          setMessage("Redirecting to login...")
          setRedirectAttempted(true)
          router.replace("/auth/login")
          return
        }

        // Get role from Clerk metadata
        const role = user?.publicMetadata?.role as string | undefined
        
        if (role) {
          setMessage(`Redirecting to ${role} dashboard...`)
          setRedirectAttempted(true)
          router.replace(`/${role}/dashboard`)
          return
        }
        
        // If no role found, go to onboarding
        setMessage("Redirecting to onboarding...")
        setRedirectAttempted(true)
        router.replace("/onboarding")
      } catch (error) {
        console.error("Redirect error:", error)
        setMessage("Error during redirect. Please try refreshing the page.")
      }
    }

    // Add a small delay to avoid rapid redirects
    const timer = setTimeout(handleRedirect, 500)
    return () => clearTimeout(timer)
  }, [isLoaded, isSignedIn, user, router, redirectAttempted])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="text-lg text-muted-foreground">{message}</p>
        {redirectAttempted && (
          <p className="text-sm text-muted-foreground">
            If you are not redirected automatically, please
            <button 
              onClick={() => setRedirectAttempted(false)}
              className="ml-1 text-primary underline"
            >
              try again
            </button>
          </p>
        )}
      </div>
    </div>
  )
}