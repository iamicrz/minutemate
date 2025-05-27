import Link from "next/link"
import { Clock } from "lucide-react"

export function MainNav() {
  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2">
        <Clock className="h-6 w-6 text-primary" />
        <span className="inline-block font-bold">
          <span className="text-primary">Minute</span>Mate
        </span>
      </Link>
      <nav className="hidden gap-6 md:flex">
        <Link
          href="/professionals"
          className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Find Professionals
        </Link>
        <Link
          href="#"
          className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          How It Works
        </Link>
        <Link
          href="#"
          className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Pricing
        </Link>
        <Link
          href="#"
          className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          About
        </Link>
      </nav>
    </div>
  )
}
