"use client"

import type React from "react"
import { Search, CalendarDays, Wallet, LayoutGrid } from "lucide-react"
import { Suspense, useEffect } from "react"
import Loading from "./dashboard/loading"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardNav } from "@/components/dashboard-nav"
import { useUser } from "@clerk/nextjs"

const navItems = [
  {
    title: "Dashboard",
    href: "/seeker/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Find Professionals",
    href: "/seeker/professionals",
    icon: Search,
  },
  {
    title: "My Bookings",
    href: "/seeker/bookings",
    icon: CalendarDays,
  },
  {
    title: "Wallet",
    href: "/seeker/wallet",
    icon: Wallet,
  },
]

export default function SeekerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isSignedIn, isLoaded } = useUser()
  
  // Verify user has seeker role
  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata?.role as string | undefined
      
      // If user has no role, redirect to onboarding
      if (!role) {
        router.push('/onboarding')
        return
      }
      
      // If user is not a seeker, redirect to their dashboard
      if (role !== 'seeker') {
        router.push(`/${role}/dashboard`)
      }
    }
  }, [isLoaded, user, router])
  
  // Determine active tab for mobile navigation
  const getActiveTab = () => {
    if (pathname.startsWith('/seeker/professionals')) return "professionals"
    if (pathname.startsWith('/seeker/bookings')) return "bookings"
    if (pathname.startsWith('/seeker/wallet')) return "wallet"
    return "dashboard" // default
  }
  
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    )
  }
  
  return (
    <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] p-0">
      <aside className="hidden border-r md:block">
        <DashboardNav items={navItems} />
      </aside>
      <main className="flex flex-col flex-1 p-4 md:gap-8 md:p-6">
        <div className="md:hidden">
          <Tabs defaultValue={getActiveTab()} className="w-full mb-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dashboard" className="flex items-center gap-2" asChild>
                <Link href="/seeker/dashboard" prefetch={true}>
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Dashboard</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="professionals" className="flex items-center gap-2" asChild>
                <Link href="/seeker/professionals" prefetch={true}>
                  <Search className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Professionals</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2" asChild>
                <Link href="/seeker/bookings" prefetch={true}>
                  <CalendarDays className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Bookings</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-2" asChild>
                <Link href="/seeker/wallet" prefetch={true}>
                  <Wallet className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Wallet</span>
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </main>
    </div>
  )
}
