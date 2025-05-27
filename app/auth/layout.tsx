import type React from "react"
import Link from "next/link"
import { Clock } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <Clock className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">
                <span className="text-primary">Minute</span>Mate
              </span>
            </Link>
          </div>
          {children}
          <div className="text-center text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} MinuteMate. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
