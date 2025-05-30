"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserData } from "@/hooks/use-user"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Clock, Star, Video } from "lucide-react"
import Link from "next/link"

interface Booking {
  id: string
  professional_name: string
  professional_title: string
  scheduled_date: string
  start_time: string
  duration_minutes: number
  total_amount: number
  status: string
  professional_id: string
  has_review?: boolean
  review_rating?: number
}

export default function BookingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { userData, loading: userLoading } = useUserData()
  const { isSignedIn } = useUser()
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [pastBookings, setPastBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submittingRating, setSubmittingRating] = useState(false)

  const activeTab = searchParams.get("tab") || "upcoming"

  useEffect(() => {
    if (!isSignedIn || (!userData && !userLoading)) {
      router.push("/auth/login")
      return
    }
    if (userData) fetchBookings()
  }, [userData, userLoading, isSignedIn, router])

  const fetchBookings = async () => {
    if (!userData) return

    try {
      const today = new Date().toISOString().split("T")[0]

      // Fetch upcoming bookings
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("bookings")
        .select(`
          *,
          professional_profiles!bookings_professional_id_fkey(
            title,
            users!professional_profiles_user_id_fkey(name)
          )
        `)
        .eq("seeker_id", userData.id)
        .gte("scheduled_date", today)
        .in("status", ["confirmed", "pending"])
        .order("scheduled_date", { ascending: true })

      if (upcomingError) throw upcomingError

      // Fetch past bookings with review information
      const { data: pastData, error: pastError } = await supabase
        .from("bookings")
        .select(`
          *,
          professional_profiles!bookings_professional_id_fkey(
            title,
            users!professional_profiles_user_id_fkey(name)
          ),
          reviews(rating)
        `)
        .eq("seeker_id", userData.id)
        .or(`scheduled_date.lt.${today},status.eq.completed,status.eq.cancelled`)
        .order("scheduled_date", { ascending: false })

      if (pastError) throw pastError

      const formattedUpcoming =
        upcomingData?.map((booking) => ({
          id: booking.id,
          professional_name: booking.professional_profiles?.users?.name || "Professional",
          professional_title: booking.professional_profiles?.title || "",
          scheduled_date: booking.scheduled_date,
          start_time: booking.start_time,
          duration_minutes: booking.duration_minutes,
          total_amount: Number(booking.total_amount),
          status: booking.status,
          professional_id: booking.professional_id,
        })) || []

      const formattedPast =
        pastData?.map((booking) => ({
          id: booking.id,
          professional_name: booking.professional_profiles?.users?.name || "Professional",
          professional_title: booking.professional_profiles?.title || "",
          scheduled_date: booking.scheduled_date,
          start_time: booking.start_time,
          duration_minutes: booking.duration_minutes,
          total_amount: Number(booking.total_amount),
          status: booking.status,
          professional_id: booking.professional_id,
          has_review: booking.reviews && booking.reviews.length > 0,
          review_rating: booking.reviews?.[0]?.rating,
        })) || []

      setUpcomingBookings(formattedUpcoming)
      setPastBookings(formattedPast)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openRatingDialog = (booking: Booking) => {
    setSelectedBooking(booking)
    setRating(0)
    setComment("")
    setRatingDialogOpen(true)
  }

  const submitRating = async () => {
    if (!selectedBooking || rating === 0) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      })
      return
    }

    setSubmittingRating(true)

    try {
      // Create session record if it doesn't exist
      const { data: existingSession } = await supabase
        .from("sessions")
        .select("id")
        .eq("booking_id", selectedBooking.id)
        .single()

      let sessionId = existingSession?.id

      if (!sessionId) {
        const { data: newSession, error: sessionError } = await supabase
          .from("sessions")
          .insert([
            {
              booking_id: selectedBooking.id,
              seeker_id: userData!.id,
              professional_id: selectedBooking.professional_id,
              status: "completed",
              actual_duration_minutes: selectedBooking.duration_minutes,
            },
          ])
          .select("id")
          .single()

        if (sessionError) throw sessionError
        sessionId = newSession.id
      }

      // Create review
      const { error: reviewError } = await supabase.from("reviews").insert([
        {
          session_id: sessionId,
          seeker_id: userData!.id,
          professional_id: selectedBooking.professional_id,
          rating,
          comment: comment || null,
        },
      ])

      if (reviewError) throw reviewError

      // Update professional's average rating
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("professional_id", selectedBooking.professional_id)

      if (allReviews) {
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0)
        const averageRating = totalRating / allReviews.length

        await supabase
          .from("professional_profiles")
          .update({
            average_rating: averageRating,
            total_reviews: allReviews.length,
          })
          .eq("id", selectedBooking.professional_id)
      }

      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      })

      setRatingDialogOpen(false)
      fetchBookings() // Refresh bookings to show updated review status
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingRating(false)
    }
  }

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading bookings...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">My Bookings</h1>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 md:flex-initial">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 md:flex-initial">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6 mt-6">
          {upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No upcoming bookings</h3>
              <p className="text-sm text-muted-foreground mb-4">Browse professionals and book your first session</p>
              <Button asChild>
                <Link href="/seeker/professionals">Find Professionals</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-4">
                        {booking.professional_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{booking.professional_name}</h3>
                          <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
                            {booking.status === "confirmed" ? "Confirmed" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{booking.professional_title}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{booking.start_time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t p-4 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">${booking.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{booking.duration_minutes} min session</div>
                      </div>
                      {booking.status === "confirmed" && (
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
          {pastBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No past bookings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your completed or cancelled bookings will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-4">
                        {booking.professional_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{booking.professional_name}</h3>
                          <Badge
                            variant={
                              booking.status === "completed"
                                ? "default"
                                : booking.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {booking.status === "completed" ? "Completed" : "Cancelled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{booking.professional_title}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{booking.start_time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t p-4 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">${booking.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{booking.duration_minutes} min session</div>
                      </div>
                      {booking.status === "completed" &&
                        (booking.has_review ? (
                          <div className="flex items-center">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < (booking.review_rating || 0) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                                />
                              ))}
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => openRatingDialog(booking)}>
                            Rate Session
                          </Button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate your session</DialogTitle>
            <DialogDescription>
              {selectedBooking && `How was your session with ${selectedBooking.professional_name}?`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                  <Star
                    className={`w-8 h-8 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Share your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setRatingDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitRating} disabled={submittingRating}>
              {submittingRating ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
