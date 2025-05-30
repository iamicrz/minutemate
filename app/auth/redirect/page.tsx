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
    // Use a flag to prevent multiple redirects
    let isRedirecting = false;
    
    const handleRedirect = async () => {
      // Skip if already redirecting
      if (isRedirecting) return;
      
      try {
        console.log("Redirect handler running with:", { 
          isLoaded, 
          isSignedIn, 
          userDataLoaded, 
          loading, 
          hasUserData: !!userData,
          userRole: userData?.role,
          clerkRole: user?.publicMetadata?.role
        });
        
        // Wait for both Clerk and user data to be loaded
        if (!isLoaded || !isSignedIn) {
          if (!isLoaded) {
            console.log("Waiting for Clerk to load...");
            return;
          }
          
          if (!isSignedIn) {
            console.log("User not signed in, redirecting to login");
            isRedirecting = true;
            router.push("/auth/login");
            return;
          }
        }
        
        // Force redirect to dashboard if we have userData with role
        if (userData && userData.role) {
          console.log("User data found with role, redirecting to:", `/${userData.role}/dashboard`);
          isRedirecting = true;
          router.push(`/${userData.role}/dashboard`);
          return;
        }
        
        // If we have Clerk role but not userData yet
        const clerkRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role as string | undefined;
        if (clerkRole && !loading) {
          console.log("Clerk role found, redirecting to:", `/${clerkRole}/dashboard`);
          isRedirecting = true;
          router.push(`/${clerkRole}/dashboard`);
          return;
        }
        
        // If we've loaded everything but still don't have a role, go to onboarding
        if (isLoaded && !loading && !userData?.role && !clerkRole) {
          console.log("No role found, redirecting to onboarding");
          isRedirecting = true;
          router.push("/onboarding");
          return;
        }
        
        // If we're still loading user data, just wait
        if (loading) {
          console.log("Still loading user data, waiting...");
          return;
        }
      } catch (error) {
        console.error("Redirect error:", error);
        toast({
          title: "Error",
          description: "Failed to redirect. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    };

    // Set a timeout to avoid rapid re-renders
    const timeoutId = setTimeout(handleRedirect, 500);
    return () => clearTimeout(timeoutId);
  }, [isLoaded, isSignedIn, userData, loading, userDataLoaded, user, router, toast])

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