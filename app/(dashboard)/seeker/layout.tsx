"use client"

import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CalendarDays, Wallet, LayoutGrid } from "lucide-react"
import { Suspense } from "react"
import Loading from "./dashboard/loading"

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
  return (
    <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] p-0">
      <aside className="hidden border-r md:block">
        <DashboardNav items={navItems} />
      </aside>
      <main className="flex flex-col flex-1 p-4 md:gap-8 md:p-6">
        <div className="md:hidden">
          <Tabs defaultValue="dashboard" className="w-full mb-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dashboard" className="flex items-center gap-2" asChild>
                <a href="/seeker/dashboard">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Dashboard</span>
                </a>
              </TabsTrigger>
              <TabsTrigger value="professionals" className="flex items-center gap-2" asChild>
                <a href="/seeker/professionals">
                  <Search className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Professionals</span>
                </a>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2" asChild>
                <a href="/seeker/bookings">
                  <CalendarDays className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Bookings</span>
                </a>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-2" asChild>
                <a href="/seeker/wallet">
                  <Wallet className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Wallet</span>
                </a>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </main>
    </div>
  )
}
