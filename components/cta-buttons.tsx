"use client"

import Link from "next/link"
import { SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function CTAButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-2 min-[400px]:flex-row ${className}`}>
      <Link href="/auth/signup?role=seeker">
        <Button size="lg" className="w-full min-[400px]:w-auto">
          Find an Expert
        </Button>
      </Link>
      <Link href="/auth/signup?role=provider">
        <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
          Become a Provider
        </Button>
      </Link>
    </div>
  )
}

export function GetStartedButtons() {
  return (
    <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
      <SignUpButton mode="modal">
        <Button size="lg" className="w-full min-[400px]:w-auto">
          Get Started
        </Button>
      </SignUpButton>
      <Link href="/professionals">
        <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
          Browse Professionals
        </Button>
      </Link>
    </div>
  )
} 