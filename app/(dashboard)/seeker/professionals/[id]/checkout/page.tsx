"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { CalendarDays, Check, ChevronLeft, Clock, Video } from "lucide-react"
import Link from "next/link"

interface Professional {
  id: string
  name: string
  title: string
  rate_per_15min: number
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { userData, refetch } = useUserData()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const date = searchParams.get("date") || ""
  const time = searchParams.get("time") || ""
  const duration = Number.parseInt(searchParams.get("duration") || "15")

  useEffect(() => {
    if (!userData) {
      router.push("/auth/login")
      return
    }
    fetchProfessional()
  }, [params.id, userData, router])

  const fetchProfessional = async () => {
    try {
      const { data, error } = await supabase
        .from("professional_profiles")
        .select(`
          *,
          users!professional_profiles_user_id_fkey(name)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      setProfessional({
        id: data.id,
        name: data.users?.name || "Professional",
        title: data.title,
        rate_per_15min: Number(data.rate_per_15min),
      })
    } catch (error) {
      console.error("Error fetching professional:", error)
      toast({
        title: "Error",
        description: "Failed to load professional information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBooking = async () => {
    if (!userData || !professional) return

    const totalAmount = (professional.rate_per_15min * duration) / 15

    if (userData.balance < totalAmount) {
      toast({
        title: "Insufficient balance",
        description: "Please add funds to your wallet to complete this booking",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            seeker_id: userData.id,
            professional_id: professional.id,
            scheduled_date: date,
            start_time: time,
            duration_minutes: duration,
            total_amount: totalAmount,
            status: "confirmed",
          },
        ])
        .select()
        .single()

      if (bookingError) throw bookingError

      // Deduct from user balance
      const { error: balanceError } = await supabase
        .from("users")
        .update({ balance: userData.balance - totalAmount })
        .eq("id", userData.id)

      if (balanceError) throw balanceError

      // Create payment transaction
      const { error: transactionError } = await supabase.from("transactions").insert([
        {
          user_id: userData.id,
          booking_id: booking.id,
          type: "payment",
          amount: totalAmount,
          description: `Payment for session with ${professional.name}`,
          status: "completed",
        },
      ])

      if (transactionError) throw transactionError

      // Create notification for professional
      const { data: professionalUser } = await supabase
        .from("professional_profiles")
        .select("user_id")
        .eq("id", professional.id)
        .single()

      if (professionalUser) {
        await supabase.from("notifications").insert([
          {
            user_id: professionalUser.user_id,
            title: "New Booking",
            message: `You have a new booking from ${userData.name} for ${new Date(date).toLocaleDateString()} at ${time}`,
            type: "booking",
          },
        ])
      }

      // Create notification for seeker
      await supabase.from("notifications").insert([
        {
          user_id: userData.id,
          title: "Booking Confirmed",
          message: `Your session with ${professional.name} has been confirmed for ${new Date(date).toLocaleDateString()} at ${time}`,
          type: "booking",
        },
      ])

      toast({
        title: "Booking Confirmed!",
        description: "Your session has been booked successfully",
      })

      // Refresh user data to update balance
      await refetch()

      router.push("/seeker/bookings")
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!userData || loading) return <div>Loading...</div>

  if (!professional) {
    return <div>Professional not found</div>
  }

  const totalAmount = (professional.rate_per_15min * duration) / 15

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/seeker/professionals/${params.id}`)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Review</CardTitle>
              <CardDescription>Review your booking details before confirming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {professional.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-semibold">{professional.name}</h3>
                  <p className="text-sm text-muted-foreground">{professional.title}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 pt-4">
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">Date & Time</div>
                    <div className="text-sm text-muted-foreground">
                      {date &&
                        new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                    </div>
                    <div className="text-sm text-muted-foreground">{time}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">Duration & Rate</div>
                    <div className="text-sm text-muted-foreground">{duration} minutes</div>
                    <div className="text-sm text-muted-foreground">${professional.rate_per_15min} per 15 minutes</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">How it works</h3>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                      <div className="font-medium">Confirmation</div>
                      <div className="text-muted-foreground">
                        After payment, you'll receive a confirmation with session details
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                      <div className="font-medium">Join the meeting</div>
                      <div className="text-muted-foreground">
                        At the scheduled time, click the meeting link in your booking details
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                      <div className="font-medium">After your session</div>
                      <div className="text-muted-foreground">
                        You'll be able to rate your experience and book a follow-up if needed
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Complete your booking with wallet payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="font-medium">Your wallet balance</div>
                <div className="flex justify-between items-center border rounded-md p-3">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="font-bold">${userData.balance.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Order Summary</div>
                <div className="border rounded-md p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {professional.name} ({duration} min)
                    </span>
                    <span className="font-medium">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Platform Fee</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="pt-2 border-t mt-2 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {userData.balance < totalAmount && (
                <div className="bg-destructive/10 border-destructive/20 border rounded-md p-3 text-sm">
                  <p className="font-medium text-destructive mb-1">Insufficient funds</p>
                  <p className="text-destructive/80">
                    You need to add ${(totalAmount - userData.balance).toFixed(2)} to your wallet to complete this
                    booking.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => router.push("/seeker/wallet")}
                  >
                    Go to Wallet
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                className="w-full"
                onClick={handleConfirmBooking}
                disabled={userData.balance < totalAmount || isLoading}
              >
                {isLoading ? "Processing..." : "Confirm & Pay"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By clicking Confirm, you agree to our{" "}
                <Link href="#" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline">
                  Cancellation Policy
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
