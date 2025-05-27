"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Clock, Star, Video } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/components/ui/use-toast"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface Professional {
  id: string
  name: string
  title: string
  bio: string
  credentials: string
  experience: string
  category: string
  rate_per_15min: number
  average_rating: number
  total_reviews: number
  avatar_url?: string
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  seeker_name: string
}

interface AvailableSlot {
  day_of_week: number
  start_time: string
  end_time: string
}

export default function ProfessionalProfile({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useUserData()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(15)

  useEffect(() => {
    if (!userData) {
      router.push("/auth/login")
      return
    }
    fetchProfessionalData()
  }, [params.id, userData, router])

  const fetchProfessionalData = async () => {
    try {
      // Fetch professional profile
      const { data: profileData, error: profileError } = await supabase
        .from("professional_profiles")
        .select(`
          *,
          users!professional_profiles_user_id_fkey(name, avatar_url)
        `)
        .eq("id", params.id)
        .single()

      if (profileError) throw profileError

      const prof = {
        id: profileData.id,
        name: profileData.users?.name || "Professional",
        title: profileData.title,
        bio: profileData.bio || "",
        credentials: profileData.credentials || "",
        experience: profileData.experience || "",
        category: profileData.category,
        rate_per_15min: Number(profileData.rate_per_15min),
        average_rating: Number(profileData.average_rating),
        total_reviews: profileData.total_reviews,
        avatar_url: profileData.users?.avatar_url,
      }

      setProfessional(prof)

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          *,
          users!reviews_seeker_id_fkey(name)
        `)
        .eq("professional_id", params.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (reviewsError) throw reviewsError

      const formattedReviews =
        reviewsData?.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment || "",
          created_at: review.created_at,
          seeker_name: review.users?.name || "Anonymous",
        })) || []

      setReviews(formattedReviews)

      // Fetch availability slots
      const { data: slotsData, error: slotsError } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("professional_id", params.id)
        .eq("is_active", true)

      if (slotsError) throw slotsError

      setAvailableSlots(slotsData || [])
    } catch (error) {
      console.error("Error fetching professional data:", error)
      toast({
        title: "Error",
        description: "Failed to load professional profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = () => {
    if (!selectedDate || !professional) return []

    const dayOfWeek = selectedDate.getDay()
    const availableToday = availableSlots.filter((slot) => slot.day_of_week === dayOfWeek)

    const timeSlots: string[] = []

    availableToday.forEach((slot) => {
      const startHour = Number.parseInt(slot.start_time.split(":")[0])
      const startMinute = Number.parseInt(slot.start_time.split(":")[1])
      const endHour = Number.parseInt(slot.end_time.split(":")[0])
      const endMinute = Number.parseInt(slot.end_time.split(":")[1])

      let currentHour = startHour
      let currentMinute = startMinute

      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`
        timeSlots.push(timeString)

        currentMinute += 15
        if (currentMinute >= 60) {
          currentMinute = 0
          currentHour++
        }
      }
    })

    return timeSlots
  }

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !professional) {
      toast({
        title: "Please select a date and time",
        variant: "destructive",
      })
      return
    }

    router.push(
      `/seeker/professionals/${params.id}/checkout?date=${format(selectedDate, "yyyy-MM-dd")}&time=${selectedTime}&duration=${selectedDuration}`,
    )
  }

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading professional profile...</div>
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Professional not found</div>
      </div>
    )
  }

  const availableTimeSlots = generateTimeSlots()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center mb-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-2xl">
                  {professional.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold">{professional.name}</h1>
                  <p className="text-muted-foreground">{professional.title}</p>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-primary text-primary mr-1" />
                      <span>{professional.average_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground ml-1">({professional.total_reviews} reviews)</span>
                    </div>
                  </div>
                  <Badge variant="secondary">{professional.category}</Badge>
                </div>
              </div>

              <Tabs defaultValue="about">
                <TabsList className="mb-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="space-y-6">
                  {professional.bio && (
                    <div>
                      <h2 className="font-semibold mb-2">About Me</h2>
                      <p className="text-muted-foreground">{professional.bio}</p>
                    </div>
                  )}
                  {professional.credentials && (
                    <div>
                      <h2 className="font-semibold mb-2">Credentials</h2>
                      <p className="text-muted-foreground">{professional.credentials}</p>
                    </div>
                  )}
                  {professional.experience && (
                    <div>
                      <h2 className="font-semibold mb-2">Experience</h2>
                      <p className="text-muted-foreground">{professional.experience}</p>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Starting at ${professional.rate_per_15min} per 15 minutes
                    </span>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="space-y-6">
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No reviews yet</div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <div className="font-semibold">{review.seeker_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center mb-2">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                                />
                              ))}
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Book a Session</CardTitle>
              <CardDescription>Select a date, time, and duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Select a Date</div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="border rounded-md"
                  disabled={(date) =>
                    date < new Date() || date > new Date(new Date().setDate(new Date().getDate() + 30))
                  }
                />
              </div>

              {selectedDate && availableTimeSlots.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium">Available Times</div>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className="text-xs"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && availableTimeSlots.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">No available times for this date</div>
              )}

              <div className="space-y-2">
                <div className="font-medium">Session Duration</div>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((duration) => (
                    <Button
                      key={duration}
                      variant={selectedDuration === duration ? "default" : "outline"}
                      onClick={() => setSelectedDuration(duration)}
                    >
                      {duration} min
                    </Button>
                  ))}
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="border rounded-md p-4 mt-4 space-y-1 bg-muted/40">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm font-medium">{format(selectedDate, "MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Time</span>
                    <span className="text-sm font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="text-sm font-medium">{selectedDuration} minutes</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">
                      ${((professional.rate_per_15min * selectedDuration) / 15).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" onClick={handleBooking} disabled={!selectedDate || !selectedTime}>
                Proceed to Checkout
              </Button>
              <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground">
                <Video className="h-3 w-3" />
                <span>Session will take place via video call</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
