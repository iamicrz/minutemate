"use client"

import { SignUp } from "@clerk/nextjs"

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/90",
          }
        }}
        routing="path"
        path="/auth/signup"
        signInUrl="/auth/login"
        afterSignUpUrl="/auth/redirect"
        redirectUrl="/auth/redirect"
      />
    </div>
  )
}
