"use client"

import { SignIn } from "@clerk/nextjs"

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/90",
          }
        }}
        routing="path"
        path="/auth/login"
        signUpUrl="/auth/signup"
        afterSignInUrl="/auth/redirect"
        redirectUrl="/auth/redirect"
        afterSignUpUrl="/auth/redirect"
      />
    </div>
  )
}
