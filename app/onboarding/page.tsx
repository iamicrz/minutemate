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
  const [role, setRole] = useState<"seeker" | "provider">("seeker")
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleSelection = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Update user role in database
      const { error } = await supabase.from("users").update({ role }).eq("clerk_id", user.id)

      if (error) {
        throw error
      }

      // Update user's role in Clerk's public metadata
      const result = await updateUserRole(user.id, role)
      if (!result.success) {
        throw new Error("Failed to update user role in Clerk")
      }

      // If provider, create professional profile
      if (role === "provider") {
        const { error: profileError } = await supabase.from("professional_profiles").insert([
          {
            user_id: (await supabase.from("users").select("id").eq("clerk_id", user.id).single()).data?.id,
            title: "Professional",
            category: "Other",
            rate_per_15min: 50,
          },
        ])

        if (profileError) {
          throw profileError
        }
      }

      toast({
        title: "Welcome to MinuteMate!",
        description: `Your ${role} account has been set up successfully.`,
      })

      // Redirect based on role
      if (role === "provider") {
        router.push("/provider/dashboard")
      } else {
        router.push("/seeker/dashboard")
      }
    } catch (error) {
      console.error("Error setting up account:", error)
      toast({
        title: "Error",
        description: "Failed to set up your account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to MinuteMate!</CardTitle>
          <CardDescription>Choose how you'd like to use our platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={role} onValueChange={(value) => setRole(value as "seeker" | "provider")}>
            <Label
              htmlFor="seeker"
              className={`flex items-center space-x-4 rounded-lg border-2 p-4 cursor-pointer hover:bg-accent ${
                role === "seeker" ? "border-primary bg-primary/5" : "border-muted"
              }`}
            >
              <RadioGroupItem value="seeker" id="seeker" />
              <User className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">I need professional help</div>
                <div className="text-sm text-muted-foreground">Find and book sessions with verified experts</div>
              </div>
            </Label>
            <Label
              htmlFor="provider"
              className={`flex items-center space-x-4 rounded-lg border-2 p-4 cursor-pointer hover:bg-accent ${
                role === "provider" ? "border-primary bg-primary/5" : "border-muted"
              }`}
            >
              <RadioGroupItem value="provider" id="provider" />
              <Briefcase className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">I offer my expertise</div>
                <div className="text-sm text-muted-foreground">Share your knowledge and earn money helping others</div>
              </div>
            </Label>
          </RadioGroup>

          <Button onClick={handleRoleSelection} disabled={isLoading} className="w-full">
            {isLoading ? "Setting up your account..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
