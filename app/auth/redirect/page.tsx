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
        // Wait for Clerk to be loaded
        if (!isLoaded) {
          console.log("Waiting for Clerk to load...", { isLoaded })
          return
        }

        // If not signed in, redirect to login
        if (!isSignedIn) {
          console.log("User not signed in, redirecting to login")
          await router.replace("/auth/login")
          return
        }

        // Force reload Clerk user object to get latest metadata
        await user?.reload?.();

        // If Clerk's publicMetadata.role is present, redirect immediately
        let clerkRole = user?.publicMetadata?.role;
        // Fallback: use unsafeMetadata.role if publicMetadata is not set yet
        if (!clerkRole && user?.unsafeMetadata?.role) {
          clerkRole = user.unsafeMetadata.role as string;
        }
        if (clerkRole) {
          const redirectPath = `/${clerkRole}/dashboard`;
          console.log("Clerk role found, redirecting to:", redirectPath);
          await router.replace(redirectPath);
          return;
        }

        // Otherwise, wait for Supabase user data to load
        if (!userDataLoaded || loading) {
          console.log("Waiting for Supabase user data to load...", { userDataLoaded, loading });
          return;
        }

        // If Supabase role is present, redirect
        if (userData?.role) {
          const redirectPath = `/${userData.role}/dashboard`;
          console.log("Supabase role found, redirecting to:", redirectPath);
          await router.replace(redirectPath);
          return;
        }

        // If both are missing, send to onboarding
        await router.replace("/onboarding");
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
  }, [isLoaded, user, isSignedIn, userDataLoaded, loading, userData, router, toast])

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