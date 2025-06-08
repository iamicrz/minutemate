"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Briefcase, User } from "lucide-react"
import { updateUserRole } from "./_actions"

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch the user's role from Clerk metadata
  const role = user?.publicMetadata?.role as "seeker" | "provider" | "admin" | undefined;

  const handleContinue = async () => {
    if (!user || !role) return;
    setIsLoading(true);
    try {
      // Ensure user is active in DB (role should already be set at creation)
      await supabase.from("users").update({ is_active: true }).eq("clerk_id", user.id);

      // If provider, ensure professional profile exists for this Clerk user
      if (role === "provider") {
        const { data: existingProfile, error: fetchError } = await supabase
          .from("professional_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (fetchError) throw fetchError;
        if (!existingProfile) {
          const { error: profileError } = await supabase.from("professional_profiles").insert([
            {
              user_id: user.id, // Clerk user ID
              title: "Professional",
              category: "Other",
              rate_per_15min: 50,
              is_verified: false,
              average_rating: 0,
              total_reviews: 0,
              total_sessions: 0,
              bio: "",
              credentials: "",
              experience: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
          if (profileError) throw profileError;
        }
      }
      toast({
        title: "Welcome to MinuteMate!",
        description: `Your ${role} account has been set up successfully.`,
      });
      // Redirect based on role
      if (role === "provider") {
        router.push("/provider/dashboard");
      } else if (role === "seeker") {
        router.push("/seeker/dashboard");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error setting up account:", error);
      toast({
        title: "Error",
        description: "Failed to set up your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to MinuteMate!</CardTitle>
          <CardDescription>Choose how you'd like to use our platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-6">
            <div className="text-xl font-semibold">
              Welcome to MinuteMate!
            </div>
            <Button onClick={handleContinue} disabled={isLoading} className="w-full">
              {isLoading ? "Setting up your account..." : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
