"use client"

import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function AuthButtons() {
  return (
    <>
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm">
          Log in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button size="sm">Sign up</Button>
      </SignUpButton>
    </>
  )
} 