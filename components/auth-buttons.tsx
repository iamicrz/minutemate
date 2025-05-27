"use client"

import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthButtons() {
  return (
    <>
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm">
          Log in
        </Button>
      </SignInButton>
      <Link href="/auth/signup" passHref>
        <Button size="sm" asChild>
          Sign up
        </Button>
      </Link>
    </>
  )
}