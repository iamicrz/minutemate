import type React from "react"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { Notifications } from "@/components/notifications"
import { UserNav } from "@/components/user-nav"
import { MobileNav } from "@/components/mobile-nav"
import { Clock } from "lucide-react"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 md:mr-6">
          <Clock className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            <span className="text-primary">Minute</span>Mate
          </span>
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          <Notifications />
          <UserNav />
        </div>
        <MobileNav />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
