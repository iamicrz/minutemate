"use client"

import * as React from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { useUserData } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const { userData } = useUserData()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="px-7">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="font-bold">
              <span className="text-primary">Minute</span>Mate
            </span>
          </Link>
        </div>
        <nav className="mt-8 flex flex-col gap-4">
          {userData ? (
            userData.role === "seeker" ? (
              <>
                <Link
                  href="/seeker/dashboard"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/seeker/professionals"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Find Professionals
                </Link>
                <Link
                  href="/seeker/bookings"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  My Bookings
                </Link>
                <Link
                  href="/seeker/wallet"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Wallet
                </Link>
              </>
            ) : userData.role === "provider" ? (
              <>
                <Link
                  href="/provider/dashboard"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/provider/availability"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Availability
                </Link>
                <Link
                  href="/provider/sessions"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Sessions
                </Link>
                <Link
                  href="/provider/earnings"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Earnings
                </Link>
                <Link
                  href="/provider/verification"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Verification
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/admin/verification"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Verification Requests
                </Link>
                <Link
                  href="/admin/users"
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  Manage Users
                </Link>
              </>
            )
          ) : (
            <>
              <Link
                href="/professionals"
                className="text-lg font-medium hover:text-primary"
                onClick={() => setOpen(false)}
              >
                Find Professionals
              </Link>
              <Link href="#" className="text-lg font-medium hover:text-primary" onClick={() => setOpen(false)}>
                How It Works
              </Link>
              <Link href="#" className="text-lg font-medium hover:text-primary" onClick={() => setOpen(false)}>
                Pricing
              </Link>
              <Link href="#" className="text-lg font-medium hover:text-primary" onClick={() => setOpen(false)}>
                About
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
