"use client"

import { useState } from "react"
import { SignUp } from "@clerk/nextjs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Briefcase, User } from "lucide-react"

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<"seeker" | "provider">("seeker")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">

      <div className="w-full max-w-md space-y-8 bg-white rounded-xl shadow-lg p-8">

      {/* Role Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-center">I want to join as:</h2>
        <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as "seeker" | "provider")}>
          <Label
            htmlFor="seeker"
            className={`flex items-center space-x-4 rounded-lg border-2 p-4 cursor-pointer hover:bg-accent ${
              selectedRole === "seeker" ? "border-primary bg-primary/5" : "border-muted"
            }`}
          >
            <RadioGroupItem value="seeker" id="seeker" />
            <User className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">Someone seeking help</div>
              <div className="text-sm text-muted-foreground">Find and book sessions with experts</div>
            </div>
          </Label>
          <Label
            htmlFor="provider"
            className={`flex items-center space-x-4 rounded-lg border-2 p-4 cursor-pointer hover:bg-accent ${
              selectedRole === "provider" ? "border-primary bg-primary/5" : "border-muted"
            }`}
          >
            <RadioGroupItem value="provider" id="provider" />
            <Briefcase className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <div className="font-semibold">An expert provider</div>
              <div className="text-sm text-muted-foreground">Share your expertise and earn</div>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Clerk SignUp Form */}
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/90",
            card: "shadow-none",
          }
        }}
        routing="path"
        path="/auth/signup"
        signInUrl="/auth/login"
        afterSignUpUrl="/auth/redirect"
        redirectUrl="/auth/redirect"
        unsafeMetadata={{
          role: selectedRole
        }}
      />
      </div>
    </div>
  )
}
