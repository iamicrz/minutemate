"use client"

import Link from "next/link"
import React, { useEffect } from 'react';

// Register the lottie-player web component on the client
function LottiePlayerComponent() {
  useEffect(() => {
    import('@lottiefiles/lottie-player');
  }, []);

  return (
    <lottie-player
      src="/animations/lp-animation.json"
      autoplay
      loop
      style={{ height: 500, width: 800 }}
      mode="normal"
    />
  );
}

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/main-nav"
import AuthButtons from "@/components/auth-buttons"
import { CTAButtons, GetStartedButtons } from "@/components/cta-buttons"
import { ShieldCheck, Star, Clock3, DollarSign, Users, Briefcase } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { SignOutButton } from "@clerk/nextjs"
import { useUserData } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import SlotMachineText from "@/components/slot-machine-text"


export default function HomePage() {
  const { isSignedIn } = useUser()
  const { loading } = useUserData()

  // If we're loading or checking auth, show nothing
  if (loading) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            {isSignedIn ? (
              <SignOutButton>
                <Button variant="ghost" size="sm">
                  Sign out
                </Button>
              </SignOutButton>
            ) : (
              <AuthButtons />
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-8 md:py-16 mt-0">
          <div className="container px-4 md:px-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6 items-center space-y-0">
              <div className="flex flex-col justify-center space-y-0 max-w-2xl w-full">
                <div className="space-y-2">
                  <Badge className="inline-flex mt-0 mb-0" variant="outline">
                    Book the expertise you need
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl mt-0 mb-0">
  Find time with real{' '}
  <span className="relative">
    <span className="text-primary">
      <SlotMachineText className="text-primary" />
    </span>
  </span>
</h1>

                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Book short, productive sessions with verified experts in law, design, editing, consulting, and more.
                    Pay only for the time you need.
                  </p>
                </div>
                <CTAButtons className="mt-32 flex flex-wrap gap-6 text-lg [&_button]:h-16 [&_button]:px-10 [&_button]:text-xl" />
              </div>
              <div className="relative hidden lg:flex items-start justify-center max-w-[800px] w-full -ml-20">
  <LottiePlayerComponent />
</div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline">Features</Badge>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Everything you need for quality advice
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  MinuteMate connects you with verified professionals for quick, efficient consultations when you need
                  them most.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-16 py-12 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="space-y-1 flex flex-row items-start">
                  <div className="mr-2 rounded-md bg-primary/20 p-1">
                    <Clock3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Book by the Minute</CardTitle>
                    <CardDescription>
                      Pay only for the time you need, whether it's 15 minutes or an hour
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="space-y-1 flex flex-row items-start">
                  <div className="mr-2 rounded-md bg-primary/20 p-1">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Verified Experts</CardTitle>
                    <CardDescription>All providers are vetted and verified for their qualifications</CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="space-y-1 flex flex-row items-start">
                  <div className="mr-2 rounded-md bg-primary/20 p-1">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Quality Ratings</CardTitle>
                    <CardDescription>See detailed reviews from other users before booking</CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="space-y-1 flex flex-row items-start">
                  <div className="mr-2 rounded-md bg-primary/20 p-1">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Secure Payments</CardTitle>
                    <CardDescription>Safe transactions with money-back guarantee if unsatisfied</CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="space-y-1 flex flex-row items-start">
                  <div className="mr-2 rounded-md bg-primary/20 p-1">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Direct Connection</CardTitle>
                    <CardDescription>Meet via video call directly in our platform, no downloads needed</CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="space-y-1 flex flex-row items-start">
                  <div className="mr-2 rounded-md bg-primary/20 p-1">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Wide Expertise</CardTitle>
                    <CardDescription>Find professionals in law, design, coaching, tech and more</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to connect with professionals?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Join thousands of individuals who have found the perfect expertise for their needs.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <GetStartedButtons />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-6 py-8 md:flex-row md:py-12">
          <div className="space-y-4 md:w-1/3">
            <div className="inline-block font-bold text-xl">
              <span className="text-primary">Minute</span>Mate
            </div>
            <p className="text-sm text-muted-foreground">
              Connect with professionals for short, effective consultations.
            </p>
          </div>
          <nav className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">For Professionals</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Become a Provider
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="border-t py-6">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MinuteMate. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                <span className="sr-only">Facebook</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
