"use client"

import type React from "react"
import { Search, CalendarDays, Wallet, LayoutGrid } from "lucide-react"
import { Suspense } from "react"
import Loading from "./dashboard/loading"
import { usePathname } from "next/navigation"

export default function SeekerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Simple function to determine if a path is active
  const isActive = (path: string) => pathname === path
  
  return (
    <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] p-0">
      <aside className="hidden border-r md:block p-4">
        <nav className="space-y-2">
          <a 
            href="/seeker/dashboard"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/seeker/dashboard') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={(e) => {
              // Use regular navigation for the current page to avoid redirect loops
              if (isActive('/seeker/dashboard')) {
                e.preventDefault()
              }
            }}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Dashboard</span>
          </a>
          <a 
            href="/seeker/professionals"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/seeker/professionals') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={(e) => {
              // Use regular navigation for the current page to avoid redirect loops
              if (isActive('/seeker/professionals')) {
                e.preventDefault()
              }
            }}
          >
            <Search className="h-4 w-4" />
            <span>Find Professionals</span>
          </a>
          <a 
            href="/seeker/bookings"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/seeker/bookings') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={(e) => {
              // Use regular navigation for the current page to avoid redirect loops
              if (isActive('/seeker/bookings')) {
                e.preventDefault()
              }
            }}
          >
            <CalendarDays className="h-4 w-4" />
            <span>My Bookings</span>
          </a>
          <a 
            href="/seeker/wallet"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/seeker/wallet') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={(e) => {
              // Use regular navigation for the current page to avoid redirect loops
              if (isActive('/seeker/wallet')) {
                e.preventDefault()
              }
            }}
          >
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
          </a>
        </nav>
      </aside>
      <main className="flex flex-col flex-1 p-4 md:gap-8 md:p-6">
        <div className="md:hidden mb-6">
          <nav className="flex overflow-x-auto pb-2">
            <a 
              href="/seeker/dashboard"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${isActive('/seeker/dashboard') ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
              onClick={(e) => {
                if (isActive('/seeker/dashboard')) {
                  e.preventDefault()
                }
              }}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Dashboard</span>
            </a>
            <a 
              href="/seeker/professionals"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${isActive('/seeker/professionals') ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
              onClick={(e) => {
                if (isActive('/seeker/professionals')) {
                  e.preventDefault()
                }
              }}
            >
              <Search className="h-4 w-4" />
              <span>Professionals</span>
            </a>
            <a 
              href="/seeker/bookings"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${isActive('/seeker/bookings') ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
              onClick={(e) => {
                if (isActive('/seeker/bookings')) {
                  e.preventDefault()
                }
              }}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Bookings</span>
            </a>
            <a 
              href="/seeker/wallet"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${isActive('/seeker/wallet') ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
              onClick={(e) => {
                if (isActive('/seeker/wallet')) {
                  e.preventDefault()
                }
              }}
            >
              <Wallet className="h-4 w-4" />
              <span>Wallet</span>
            </a>
          </nav>
        </div>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </main>
    </div>
  )
}
