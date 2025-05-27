"use client"

import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarCheck, DollarSign, LayoutGrid, ListChecks, ShieldCheck } from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/provider/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Availability",
    href: "/provider/availability",
    icon: CalendarCheck,
  },
  {
    title: "Sessions",
    href: "/provider/sessions",
    icon: ListChecks,
  },
  {
    title: "Earnings",
    href: "/provider/earnings",
    icon: DollarSign,
  },
  {
    title: "Verification",
    href: "/provider/verification",
    icon: ShieldCheck,
  },
]

export default function ProviderLayout({
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
                <a href="/provider/dashboard">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Dashboard</span>
                </a>
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex items-center gap-2" asChild>
                <a href="/provider/availability">
                  <CalendarCheck className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Availability</span>
                </a>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2" asChild>
                <a href="/provider/sessions">
                  <ListChecks className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Sessions</span>
                </a>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {children}
      </main>
    </div>
  )
}
