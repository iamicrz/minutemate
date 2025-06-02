"use client"

import { SignIn } from "@clerk/nextjs"

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <SignIn
        appearance={{
          elements: {
            card: "bg-background text-foreground border border-border shadow-xl rounded-xl",
            headerTitle: "text-2xl font-bold text-primary mb-2",
            headerSubtitle: "text-muted-foreground mb-4",
            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
            footer: "border-t border-border bg-muted/50 text-muted-foreground",
            footerActionLink: "text-primary hover:text-primary/90 font-medium",
            socialButtonsBlockButton: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors",
            dividerRow: "bg-border",
            formFieldInput: "bg-input border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30",
            formFieldLabel: "text-foreground font-medium",
            formFieldErrorText: "text-destructive text-sm mt-1",
            identityPreviewText: "text-muted-foreground",
            formResendCodeLink: "text-primary hover:text-primary/90",
            formFieldAction: "text-primary hover:text-primary/90",
            // Modal overlay
            modalBackdrop: "bg-black/40 backdrop-blur-sm",
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
