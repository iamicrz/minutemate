"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, CalendarDays, DollarSign, Star, Users, Video } from "lucide-react"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface DashboardStats {
  totalEarnings: number
  monthlyEarnings: number
  upcomingSessions: number
  totalSessions: number
  averageRating: number
  totalReviews: number
}

interface TodaySession {
  id: string
  seeker_name: string
  scheduled_date: string
  start_time: string
  duration_minutes: number
  total_amount: number
  status: string
}

export default function ProviderDashboard() {
  const router = useRouter()
  const { userData, loading } = useUserData()
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    upcomingSessions: 0,
    totalSessions: 0,
    averageRating: 0,
    totalReviews: 0,
  })
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([])
  const [recentReviews, setRecentReviews] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!userData) return
    fetchDashboardData()
  }, [userData, loading, router])

  const fetchDashboardData = async () => {
    if (!userData) return

    try {
      // Get professional profile
      const { data: profile } = await supabase
        .from("professional_profiles")
        .select("*")
        .eq("user_id", userData.id)
        .single()

      if (!profile) return

      // Get total earnings from completed transactions
      const { data: earnings } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userData.id)
        .eq("type", "payout")
        .eq("status", "completed")

      const totalEarnings = earnings?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

      // Get monthly earnings
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: monthlyEarnings } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userData.id)
        .eq("type", "payout")
        .eq("status", "completed")
        .gte("created_at", `${currentMonth}-01`)

      const monthlyTotal = monthlyEarnings?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

      // Get upcoming sessions count
      const today = new Date().toISOString().split("T")[0]
      const { data: upcomingBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("professional_id", profile.id)
        .gte("scheduled_date", today)
        .in("status", ["confirmed", "pending"])

      // Get today's sessions with seeker info
      const { data: todayBookings } = await supabase
        .from("bookings")
        .select(`
          *,
          users!bookings_seeker_id_fkey(name)
        `)
        .eq("professional_id", profile.id)
        .eq("scheduled_date", today)
        .order("start_time")

      const formattedTodaySessions =
        todayBookings?.map((booking) => ({
          id: booking.id,
          seeker_name: booking.users?.name || "Unknown",
          scheduled_date: booking.scheduled_date,
          start_time: booking.start_time,
          duration_minutes: booking.duration_minutes,
          total_amount: Number(booking.total_amount),
          status: booking.status,
        })) || []

      // Get recent reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select(`
          *,
          users!reviews_seeker_id_fkey(name)
        `)
        .eq("professional_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(2)

      setStats({
        totalEarnings,
        monthlyEarnings: monthlyTotal,
        upcomingSessions: upcomingBookings?.length || 0,
        totalSessions: profile.total_sessions,
        averageRating: Number(profile.average_rating),
        totalReviews: profile.total_reviews,
      })

      setTodaySessions(formattedTodaySessions)
      setRecentReviews(reviews || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  if (loading || !userData) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Welcome back, {userData.name}</h1>
        <Button asChild>
          <Link href="/provider/availability">Manage Availability</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">+${stats.monthlyEarnings.toFixed(2)} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">{todaySessions.length} sessions today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">From {stats.totalReviews} ratings</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="font-semibold text-lg">Today's Schedule</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {todaySessions.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">No sessions scheduled for today</div>
        ) : (
          todaySessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-0">
                <div className="px-6 py-5 border-b">
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant={session.status === "confirmed" ? "default" : "outline"}>
                      {session.status === "confirmed" ? "Confirmed" : "Pending"}
                    </Badge>
                    <span className="text-sm font-semibold">${session.total_amount.toFixed(2)}</span>
                  </div>
                  <h3 className="font-semibold">{session.seeker_name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    <span>
                      {session.start_time} ({session.duration_minutes} min)
                    </span>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {session.status === "confirmed" && (
                    <Button size="sm" className="flex items-center">
                      <Video className="mr-2 h-4 w-4" />
                      Join Session
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <h2 className="font-semibold text-lg">Recent Reviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recentReviews.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">No reviews yet</div>
        ) : (
          recentReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {review.users?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "U"}
                    </div>
                    <div>
                      <h3 className="font-semibold">{review.users?.name || "Anonymous"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment || "No comment provided"}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
