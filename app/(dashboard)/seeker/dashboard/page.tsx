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
  const { userData, loading: userLoading, error: userError } = useUserData()
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
  
  console.log("Dashboard rendering with:", {
    hasUserData: !!userData,
    userLoading,
    sessionLoading,
    statsLoading,
    stats
  })

  // Simple dashboard data fetching function
  const fetchDashboardData = useCallback(async () => {
    console.log("Fetching dashboard data...")
    
    if (!userData || !userData.id) {
      console.log("No user data available, can't fetch dashboard data")
      return
    }
    
    setStatsLoading(true)
    setDashboardError(null)
    
    try {
      console.log("Fetching dashboard data for user:", userData.id)
      
      // Get upcoming sessions count
      const today = new Date().toISOString().split("T")[0]
      const { data: upcomingBookings, error: upcomingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("seeker_id", userData.id)
        .gte("scheduled_date", today)
        .in("status", ["confirmed", "pending"])
      
      if (upcomingError) {
        console.error("Error fetching upcoming bookings:", upcomingError)
        throw upcomingError
      }
      
      // Get completed sessions count
      const { data: completedBookings, error: completedError } = await supabase
        .from("bookings")
        .select("*")
        .eq("seeker_id", userData.id)
        .eq("status", "completed")
      
      if (completedError) {
        console.error("Error fetching completed bookings:", completedError)
        throw completedError
      }
      
      // Get total spent
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userData.id)
        .eq("type", "payment")
        .eq("status", "completed")
      
      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
        throw transactionsError
      }
      
      const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
      
      // Get professionals
      const { data: professionals, error: professionalsError } = await supabase
        .from("professional_profiles")
        .select(`
          *,
          users!professional_profiles_user_id_fkey(name, avatar_url)
        `)
        .eq("is_verified", true)
        .order("average_rating", { ascending: false })
        .limit(3)
      
      if (professionalsError) {
        console.error("Error fetching professionals:", professionalsError)
        throw professionalsError
      }
      
      const formattedProfessionals = professionals?.map((prof) => ({
        id: prof.id,
        name: prof.users?.name || "Professional",
        title: prof.title,
        category: prof.category,
        rate_per_15min: Number(prof.rate_per_15min),
        average_rating: Number(prof.average_rating),
        total_reviews: prof.total_reviews,
      })) || []
      
      // Update state with fetched data
      setStats({
        upcomingSessions: upcomingBookings?.length || 0,
        completedSessions: completedBookings?.length || 0,
        totalSpent,
      })
      
      setRecommendedProfessionals(formattedProfessionals)
      console.log("Dashboard data fetched successfully")
      
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      setDashboardError(error?.message || "Failed to load dashboard data")
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try refreshing the page.",
        variant: "destructive",
      })
    } finally {
      setStatsLoading(false)
    }
  }, [userData, toast])

  // Fetch data when user data is available
  useEffect(() => {
    if (userData && userData.id) {
      console.log("User data available, fetching dashboard data")
      fetchDashboardData()
    }
  }, [userData, fetchDashboardData])

  // Handle role redirects
  useEffect(() => {
    // Only redirect when we're sure about the user's role
    if (!userLoading && !sessionLoading && userData && userData.role !== "seeker") {
      console.log("Redirecting non-seeker to provider dashboard")
      router.push("/provider/dashboard")
    }
  }, [userData, userLoading, sessionLoading, router])

  // Show error if user fetching/creation failed
  if (userError || dashboardError) {
    return (
      <div className="p-8 text-center text-red-500">
        <strong>Dashboard Error:</strong> {userError || dashboardError}
        <div className="mt-4">
          <Button 
            onClick={() => {
              setStatsLoading(true);
              setDashboardError(null);
              fetchDashboardData();
            }}
            variant="outline"
          >
            Retry Loading Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while any data is loading
  if (userLoading || sessionLoading) {
    return <Loading />;
  }

  // Show error if user is not a seeker
  if (!userData || userData.role !== "seeker") {
    return (
      <div className="p-8 text-center text-red-500">
        Error: You must be logged in as a seeker to view this dashboard.
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-semibold text-lg md:text-2xl">Welcome back, {userData?.name ?? "User"}</h1>
        <SignOutButton>
          <Button variant="outline">Sign Out</Button>
        </SignOutButton>
      </div>

      {statsLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${userData?.balance?.toFixed(2) ?? '0.00'}</div>
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
                <p className="text-xs text-muted-foreground mt-1">Total sessions completed</p>
              </CardContent>
            </Card>
          </div>

          {recommendedProfessionals.length > 0 && (
            <>
              <h2 className="font-semibold text-lg mt-8 mb-4">Recommended Professionals</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendedProfessionals.map((professional) => (
                  <Card key={professional.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold">{professional.name}</h3>
                            <p className="text-sm text-muted-foreground">{professional.title}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{professional.average_rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="font-semibold">${professional.rate_per_15min}</span> / 15 min
                          </div>
                          <Link href={`/seeker/professionals/${professional.id}`}>
                            <Button size="sm" variant="outline">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          <div className="mt-8">
            <Link href="/seeker/professionals">
              <Button>
                <Search className="h-4 w-4 mr-2" />
                Find Professionals
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}