"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { Users, ShieldCheck, DollarSign, Calendar, TrendingUp, Clock } from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalProviders: number
  totalSeekers: number
  pendingVerifications: number
  totalBookings: number
  totalRevenue: number
  activeUsers: number
  completedSessions: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { userData } = useUserData()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProviders: 0,
    totalSeekers: 0,
    pendingVerifications: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    completedSessions: 0,
  })

  useEffect(() => {
    if (!userData) return
    fetchDashboardStats()
  }, [userData, router])

  const fetchDashboardStats = async () => {
    try {
      // Fetch user statistics
      const { data: usersData, error: usersError } = await supabase.from("users").select("role, is_active")

      if (usersError) throw usersError

      const totalUsers = usersData?.length || 0
      const totalProviders = usersData?.filter((u) => u.role === "provider").length || 0
      const totalSeekers = usersData?.filter((u) => u.role === "seeker").length || 0
      const activeUsers = usersData?.filter((u) => u.is_active).length || 0

      // Fetch verification requests
      const { data: verificationsData, error: verificationsError } = await supabase
        .from("verification_requests")
        .select("status")
        .eq("status", "pending")

      if (verificationsError) throw verificationsError

      const pendingVerifications = verificationsData?.length || 0

      // Fetch bookings statistics
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("status, total_amount")

      if (bookingsError) throw bookingsError

      const totalBookings = bookingsData?.length || 0
      const totalRevenue = bookingsData?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0

      // Fetch sessions statistics
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("status")
        .eq("status", "completed")

      if (sessionsError) throw sessionsError

      const completedSessions = sessionsData?.length || 0

      setStats({
        totalUsers,
        totalProviders,
        totalSeekers,
        pendingVerifications,
        totalBookings,
        totalRevenue,
        activeUsers,
        completedSessions,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProviders}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingVerifications} pending verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seekers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSeekers}</div>
            <p className="text-xs text-muted-foreground">Service seekers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Platform revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">New user registration</p>
                  <p className="text-sm text-muted-foreground">A new seeker joined the platform</p>
                </div>
                <div className="ml-auto font-medium">2m ago</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Verification request</p>
                  <p className="text-sm text-muted-foreground">New provider verification submitted</p>
                </div>
                <div className="ml-auto font-medium">5m ago</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Session completed</p>
                  <p className="text-sm text-muted-foreground">A consultation session was completed</p>
                </div>
                <div className="ml-auto font-medium">10m ago</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/admin/verification"
                className="block w-full p-3 text-left border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium">Review Verifications</div>
                <div className="text-sm text-muted-foreground">{stats.pendingVerifications} pending requests</div>
              </a>
              <a
                href="/admin/users"
                className="block w-full p-3 text-left border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium">Manage Users</div>
                <div className="text-sm text-muted-foreground">{stats.totalUsers} total users</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
