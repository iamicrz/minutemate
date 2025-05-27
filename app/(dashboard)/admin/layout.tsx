"use client"

import type React from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldCheck, Users } from "lucide-react"
import { Suspense } from "react"

const navItems = [
  {
    title: "Verification Requests",
    href: "/admin/verification",
    icon: ShieldCheck,
  },
  {
    title: "Manage Users",
    href: "/admin/users",
    icon: Users,
  },
]

export default function AdminLayout({
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
          <Tabs defaultValue="verification" className="w-full mb-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="verification" className="flex items-center gap-2" asChild>
                <a href="/admin/verification">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Verification</span>
                </a>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2" asChild>
                <a href="/admin/users">
                  <Users className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Users</span>
                </a>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Suspense>{children}</Suspense>
      </main>
    </div>
  )
}
