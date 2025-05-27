"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { Calendar, CalendarDays, Clock, Search, Video } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Session {
  id: string
  seeker_name: string
  scheduled_date: string
  start_time: string
  duration_minutes: number
  total_amount: number
  status: string
  rating?: number
}

export default function SessionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userData } = useUserData()
  const { toast } = useToast()
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [pastSessions, setPastSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const activeTab = searchParams.get("tab") || "upcoming"

  useEffect(() => {
    if (!userData || userData.role !== "provider") {
      if (!loading && userData && userData.role !== "provider") {
        router.push("/seeker/dashboard")
      }
      return
    }
    fetchSessions()
  }, [userData, loading, router])

  const fetchSessions = async () => {
    if (!userData) return

    try {
      // Get professional profile
      const { data: profile } = await supabase
        .from("professional_profiles")
        .select("id")
        .eq("user_id", userData.id)
        .single()

      if (!profile) {
        toast({
          title: "Error",
          description: "Professional profile not found",
          variant: "destructive",
        })
        return
      }

      const today = new Date().toISOString().split("T")[0]

      // Fetch upcoming sessions
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("bookings")
        .select(`
          *,
          users!bookings_seeker_id_fkey(name)
        `)
        .eq("professional_id", profile.id)
        .gte("scheduled_date", today)
        .in("status", ["confirmed", "pending"])
        .order("scheduled_date", { ascending: true })

      if (upcomingError) throw upcomingError

      // Fetch past sessions with ratings
      const { data: pastData, error: pastError } = await supabase
        .from("bookings")
        .select(`
          *,
          users!bookings_seeker_id_fkey(name),
          reviews(rating)
        `)
        .eq("professional_id", profile.id)
        .or(`scheduled_date.lt.${today},status.eq.completed,status.eq.cancelled`)
        .order("scheduled_date", { ascending: false })

      if (pastError) throw pastError

      const formattedUpcoming =
        upcomingData?.map((session) => ({
          id: session.id,
          seeker_name: session.users?.name || "Unknown",
          scheduled_date: session.scheduled_date,
          start_time: session.start_time,
          duration_minutes: session.duration_minutes,
          total_amount: Number(session.total_amount),
          status: session.status,
        })) || []

      const formattedPast =
        pastData?.map((session) => ({
          id: session.id,
          seeker_name: session.users?.name || "Unknown",
          scheduled_date: session.scheduled_date,
          start_time: session.start_time,
          duration_minutes: session.duration_minutes,
          total_amount: Number(session.total_amount),
          status: session.status,
          rating: session.reviews?.[0]?.rating,
        })) || []

      setUpcomingSessions(formattedUpcoming)
      setPastSessions(formattedPast)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUpcomingSessions = upcomingSessions.filter((session) => {
    const matchesSearch = session.seeker_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredPastSessions = pastSessions.filter((session) => {
    const matchesSearch = session.seeker_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading sessions...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Sessions</h1>
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by client name..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 md:flex-initial">
            Upcoming ({filteredUpcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 md:flex-initial">
            Past ({filteredPastSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6 mt-6">
          {filteredUpcomingSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No upcoming sessions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "No sessions match your search" : "You don't have any upcoming sessions"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUpcomingSessions.map((session) => (
                <Card key={session.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-4">
                        {session.seeker_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{session.seeker_name}</h3>
                          <Badge variant={session.status === "confirmed" ? "default" : "outline"}>
                            {session.status === "confirmed" ? "Confirmed" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          <span>{new Date(session.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{session.start_time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t p-4 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">${session.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{session.duration_minutes} min session</div>
                      </div>
                      {session.status === "confirmed" && (
                        <Button size="sm" className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          <span>Join</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6 mt-6">
          {filteredPastSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No past sessions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "No sessions match your search"
                  : "Your completed or cancelled sessions will appear here"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPastSessions.map((session) => (
                <Card key={session.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-4">
                        {session.seeker_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{session.seeker_name}</h3>
                          <Badge
                            variant={
                              session.status === "completed"
                                ? "default"
                                : session.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {session.status === "completed" ? "Completed" : "Cancelled"}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          <span>{new Date(session.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{session.start_time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t p-4 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">${session.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{session.duration_minutes} min session</div>
                      </div>
                      {session.status === "completed" && session.rating && (
                        <div className="flex items-center">
                          <span className="text-sm mr-1">Rating:</span>
                          <span className="font-medium">{session.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
