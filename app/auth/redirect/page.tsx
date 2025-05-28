"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserData } from "@/hooks/use-user"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/components/ui/use-toast"

export default function RedirectPage() {
  const router = useRouter()
  const { user, isSignedIn, isLoaded } = useUser()
  const { userData, loading, isLoaded: userDataLoaded } = useUserData()
  const { toast } = useToast()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Wait for both Clerk and user data to be loaded
        if (!isLoaded || !userDataLoaded) {
          console.log("Waiting for data to load...", { isLoaded, userDataLoaded })
          return
        }

        // If not signed in, redirect to login
        if (!isSignedIn) {
          console.log("User not signed in, redirecting to login")
          await router.replace("/auth/login")
          return
        }

        // If still loading user data, wait
        if (loading) {
          console.log("Still loading user data...")
          return
        }

        // Try to get role from userData (Supabase) or Clerk metadata
        const role = userData?.role || user?.publicMetadata?.role;

        if (!role) {
          // If role is missing, send to onboarding as a fallback
          await router.replace("/onboarding");
          return;
        }

        const redirectPath = `/${role}/dashboard`;
        console.log("Attempting to redirect to:", redirectPath);
        await router.replace(redirectPath);
      } catch (error) {
        console.error("Redirect error:", error)
        toast({
          title: "Error",
          description: "Failed to redirect. Please try refreshing the page.",
          variant: "destructive",
        })
      }
    }

    handleRedirect()
  }, [isLoaded, userDataLoaded, isSignedIn, loading, userData, router, toast])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="text-lg text-muted-foreground">
          {!isLoaded || !userDataLoaded ? "Loading authentication..." : 
           loading ? "Loading user data..." : 
           "Redirecting..."}
        </p>
      </div>
    </div>
  )
} 