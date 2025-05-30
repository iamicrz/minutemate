"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"

export default function RedirectPage() {
  const router = useRouter()
  const { user, isSignedIn, isLoaded } = useUser()
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run this once
    if (redirecting) return;
    
    async function redirect() {
      try {
        setRedirecting(true);
        
        // Force redirect to seeker dashboard
        console.log("Forcing redirect to seeker dashboard");
        window.location.href = "/seeker/dashboard";
      } catch (err) {
        console.error("Redirect error:", err);
        setError("Failed to redirect");
        setRedirecting(false);
      }
    }
    
    // Add a small delay to avoid immediate redirect
    const timer = setTimeout(redirect, 1000);
    return () => clearTimeout(timer);
  }, [redirecting]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        {error ? (
          <div className="text-red-500">
            <p>{error}</p>
            <button 
              onClick={() => setRedirecting(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-lg text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}
      </div>
    </div>
  )
}