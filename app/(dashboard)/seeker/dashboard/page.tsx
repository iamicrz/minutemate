"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, Search, Star, Wallet } from "lucide-react"
import Link from "next/link"
import Loading from "./loading"
import { useSession } from "@/components/session-provider"
import { useToast } from "@/components/ui/use-toast"
import { SignOutButton } from "@clerk/nextjs"

interface SeekerStats {
  upcomingSessions: number
  completedSessions: number
  totalSpent: number
}

interface RecommendedProfessional {
  id: string
  name: string
  title: string
  category: string
  rate_per_15min: number
  average_rating: number
  total_reviews: number
}

export default function SeekerDashboard() {

  const router = useRouter()
  const { userData, loading: userLoading } = useUserData()
  const { isLoading: sessionLoading } = useSession()
  const { toast } = useToast()
  const [stats, setStats] = useState<SeekerStats>({
    upcomingSessions: 0,
    completedSessions: 0,
    totalSpent: 0,
  })
  const [recommendedProfessionals, setRecommendedProfessionals] = useState<RecommendedProfessional[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!userData) return

    try {
      console.log("Debug - Fetching dashboard data for user:", userData.id)
      setStatsLoading(true)
      
      // Get upcoming sessions count
      const today = new Date().toISOString().split("T")[0]
      console.log("Debug - Fetching upcoming bookings...")
      const { data: upcomingBookings, error: upcomingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("seeker_id", userData.id)
        .gte("scheduled_date", today)
        .in("status", ["confirmed", "pending"])

      if (upcomingError) {
        console.error("Debug - Error fetching upcoming bookings:", upcomingError)
        throw upcomingError
      }
      console.log("Debug - Upcoming bookings:", upcomingBookings?.length || 0)

      // Get completed sessions count
      console.log("Debug - Fetching completed bookings...")
      const { data: completedBookings, error: completedError } = await supabase
        .from("bookings")
        .select("*")
        .eq("seeker_id", userData.id)
        .eq("status", "completed")

      if (completedError) {
        console.error("Debug - Error fetching completed bookings:", completedError)
        throw completedError
      }
      console.log("Debug - Completed bookings:", completedBookings?.length || 0)

      // Get total spent from transactions
      console.log("Debug - Fetching transactions...")
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userData.id)
        .eq("type", "payment")
        .eq("status", "completed")

      if (transactionsError) {
        console.error("Debug - Error fetching transactions:", transactionsError)
        throw transactionsError
      }

      const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
      console.log("Debug - Total spent:", totalSpent)

      // Get recommended professionals (top rated with recent activity)
      console.log("Debug - Fetching recommended professionals...")
      const { data: professionals, error: professionalsError } = await supabase
        .from("professional_profiles")
        .select(`
          *,
          users!professional_profiles_user_id_fkey(name, avatar_url)
        `)
        .eq("is_verified", true)
        .gt("average_rating", 4.0)
        .order("average_rating", { ascending: false })
        .limit(3)

      if (professionalsError) {
        console.error("Debug - Error fetching professionals:", professionalsError)
        throw professionalsError
      }
      console.log("Debug - Found professionals:", professionals?.length || 0)

      const formattedProfessionals =
        professionals?.map((prof) => ({
          id: prof.id,
          name: prof.users?.name || "Professional",
          title: prof.title,
          category: prof.category,
          rate_per_15min: Number(prof.rate_per_15min),
          average_rating: Number(prof.average_rating),
          total_reviews: prof.total_reviews,
        })) || []

      setStats({
        upcomingSessions: upcomingBookings?.length || 0,
        completedSessions: completedBookings?.length || 0,
        totalSpent,
      })

      setRecommendedProfessionals(formattedProfessionals)
      console.log("Debug - Dashboard data fetched successfully")
    } catch (error) {
      console.error("Debug - Error fetching dashboard data:", error)
      setDashboardError("Failed to load dashboard data. Please try refreshing the page.");
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try refreshing the page.",
        variant: "destructive",
      })
    } finally {
      setStatsLoading(false)
    }
  }, [userData, toast])

  useEffect(() => {
    console.log("Debug - Dashboard effect running", {
      userLoading,
      sessionLoading,
      hasUserData: !!userData,
      userRole: userData?.role
    })

    if (!userData || userData.role !== "seeker") {
      if (!userLoading && !sessionLoading && userData && userData.role !== "seeker") {
        console.log("Debug - Redirecting non-seeker to provider dashboard")
        router.push("/provider/dashboard")
      }
      return
    }

    fetchDashboardData()
  }, [userData?.id, userData?.role, userLoading, sessionLoading, router, fetchDashboardData])

  // Show loading state while any data is loading
  if (userLoading || sessionLoading || statsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loading />
        <div className="mt-4 text-muted-foreground">Loading your dashboard...</div>
      </div>
    )
  }

  // Show error if dashboard data failed to load
  if (dashboardError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="text-red-600 font-semibold text-lg mb-2">{dashboardError}</div>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </div>
    )
  }

  // Show message if user is not a seeker or user data is missing
  if (!userData || userData.role !== "seeker") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="text-yellow-600 font-semibold text-lg mb-2">You must be logged in as a seeker to view this dashboard.</div>
        <Link href="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 mb-4">
        <div className="text-xl font-bold text-primary">MinuteMate</div>
        <div>
          <SignOutButton>
            <Button variant="outline">Sign Out</Button>
          </SignOutButton>
        </div>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Welcome back, {userData.name}</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userData.balance?.toFixed(2) ?? '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Available to book sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Total completed sessions</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="font-semibold text-lg">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Search className="mr-2 h-5 w-5 text-primary" />
              Find Professionals
            </CardTitle>
            <CardDescription>Browse experts in various fields</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/seeker/professionals" className="w-full">
              <Button variant="default" className="w-full">
                Find Now
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <CalendarDays className="mr-2 h-5 w-5 text-primary" />
              View Bookings
            </CardTitle>
            <CardDescription>Check your upcoming sessions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/seeker/bookings" className="w-full">
              <Button variant="outline" className="w-full">
                View Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Star className="mr-2 h-5 w-5 text-primary" />
              Rate Past Sessions
            </CardTitle>
            <CardDescription>Review your completed sessions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-end">
            <Link href="/seeker/bookings?tab=past" className="w-full">
              <Button variant="outline" className="w-full">
                Rate Sessions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="font-semibold text-lg">Recommended Professionals</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendedProfessionals.map((professional: RecommendedProfessional) => (
          <Card key={professional.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{professional.name}</CardTitle>
              <CardDescription>{professional.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span>{professional.average_rating.toFixed(1)} ({professional.total_reviews} reviews)</span>
              </div>
              <div className="mt-4">
                <Link href={`/seeker/professionals/${professional.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
