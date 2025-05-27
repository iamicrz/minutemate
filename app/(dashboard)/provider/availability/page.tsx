"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { CalendarDays, Plus, Save, Trash2 } from "lucide-react"

interface TimeSlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface BlockedDate {
  id: string
  blocked_date: string
  reason?: string
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
]

export default function AvailabilityPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useUserData()
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [newTimeSlot, setNewTimeSlot] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  })
  const [sessionRate, setSessionRate] = useState("75")
  const [bufferTime, setBufferTime] = useState("15")

  useEffect(() => {
    if (!userData || userData.role !== "provider") {
      if (!loading && userData && userData.role !== "provider") {
        router.push("/seeker/dashboard")
      }
      return
    }
    fetchData()
  }, [userData, loading, router])

  const fetchData = async () => {
    if (!userData) return

    try {
      // Get professional profile
      const { data: profile, error: profileError } = await supabase
        .from("professional_profiles")
        .select("*")
        .eq("user_id", userData.id)
        .single()

      if (profileError) throw profileError

      setProfessionalId(profile.id)
      setSessionRate(profile.rate_per_15min.toString())

      // Fetch availability slots
      const { data: slotsData, error: slotsError } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("professional_id", profile.id)
        .order("day_of_week")
        .order("start_time")

      if (slotsError) throw slotsError

      setTimeSlots(slotsData || [])

      // Fetch blocked dates
      const { data: blockedData, error: blockedError } = await supabase
        .from("blocked_dates")
        .select("*")
        .eq("professional_id", profile.id)
        .gte("blocked_date", new Date().toISOString().split("T")[0])
        .order("blocked_date")

      if (blockedError) throw blockedError

      setBlockedDates(blockedData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load availability data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addTimeSlot = async () => {
    if (!professionalId) return

    try {
      const { data, error } = await supabase
        .from("availability_slots")
        .insert([
          {
            professional_id: professionalId,
            day_of_week: newTimeSlot.day_of_week,
            start_time: newTimeSlot.start_time,
            end_time: newTimeSlot.end_time,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setTimeSlots([...timeSlots, data])
      toast({
        title: "Time slot added",
        description: `Added ${newTimeSlot.start_time} - ${newTimeSlot.end_time} on ${DAYS_OF_WEEK.find((d) => d.value === newTimeSlot.day_of_week)?.label}`,
      })
    } catch (error) {
      console.error("Error adding time slot:", error)
      toast({
        title: "Error",
        description: "Failed to add time slot",
        variant: "destructive",
      })
    }
  }

  const removeTimeSlot = async (id: string) => {
    try {
      const { error } = await supabase.from("availability_slots").delete().eq("id", id)

      if (error) throw error

      setTimeSlots(timeSlots.filter((slot) => slot.id !== id))
      toast({
        title: "Time slot removed",
      })
    } catch (error) {
      console.error("Error removing time slot:", error)
      toast({
        title: "Error",
        description: "Failed to remove time slot",
        variant: "destructive",
      })
    }
  }

  const saveSettings = async () => {
    if (!professionalId) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("professional_profiles")
        .update({
          rate_per_15min: Number.parseFloat(sessionRate),
        })
        .eq("id", professionalId)

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Your availability settings have been updated",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const blockDate = async () => {
    if (!date || !professionalId) return

    const dateString = date.toISOString().split("T")[0]

    try {
      const { data, error } = await supabase
        .from("blocked_dates")
        .insert([
          {
            professional_id: professionalId,
            blocked_date: dateString,
            reason: "Unavailable",
          },
        ])
        .select()
        .single()

      if (error) throw error

      setBlockedDates([...blockedDates, data])
      toast({
        title: "Date blocked",
        description: `${date.toLocaleDateString()} has been marked as unavailable`,
      })
    } catch (error) {
      console.error("Error blocking date:", error)
      toast({
        title: "Error",
        description: "Failed to block date",
        variant: "destructive",
      })
    }
  }

  const removeBlockedDate = async (id: string) => {
    try {
      const { error } = await supabase.from("blocked_dates").delete().eq("id", id)

      if (error) throw error

      setBlockedDates(blockedDates.filter((date) => date.id !== id))
      toast({
        title: "Blocked date removed",
      })
    } catch (error) {
      console.error("Error removing blocked date:", error)
      toast({
        title: "Error",
        description: "Failed to remove blocked date",
        variant: "destructive",
      })
    }
  }

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading availability settings...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Manage Availability</h1>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="settings">Session Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>Set your regular weekly availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Time Slots</h3>
                  <div className="flex items-center gap-2">
                    <Select
                      value={newTimeSlot.day_of_week.toString()}
                      onValueChange={(value) => setNewTimeSlot({ ...newTimeSlot, day_of_week: Number.parseInt(value) })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={newTimeSlot.start_time}
                        onChange={(e) => setNewTimeSlot({ ...newTimeSlot, start_time: e.target.value })}
                        className="w-[120px]"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={newTimeSlot.end_time}
                        onChange={(e) => setNewTimeSlot({ ...newTimeSlot, end_time: e.target.value })}
                        className="w-[120px]"
                      />
                    </div>
                    <Button size="sm" onClick={addTimeSlot}>
                      <Plus className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">Add</span>
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md">
                  <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_2fr_auto] px-4 py-2 border-b bg-muted/50">
                    <div className="font-medium text-sm">Day</div>
                    <div className="font-medium text-sm hidden md:block">Hours</div>
                    <div className="font-medium text-sm text-right">Actions</div>
                  </div>
                  <div className="divide-y">
                    {timeSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_2fr_auto] px-4 py-3 items-center"
                      >
                        <div>{DAYS_OF_WEEK.find((d) => d.value === slot.day_of_week)?.label}</div>
                        <div className="hidden md:block">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" onClick={() => removeTimeSlot(slot.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {timeSlots.length === 0 && (
                      <div className="px-4 py-3 text-center text-sm text-muted-foreground">No time slots added yet</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Block specific dates or add special availability</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar mode="single" selected={date} onSelect={setDate} className="border rounded-md" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={blockDate} disabled={!date}>
                  Block Date
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Blocked Dates</CardTitle>
                <CardDescription>Dates you've marked as unavailable</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blockedDates.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No blocked dates</div>
                  ) : (
                    blockedDates.map((blockedDate) => (
                      <div key={blockedDate.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(blockedDate.blocked_date).toLocaleDateString()}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeBlockedDate(blockedDate.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Settings</CardTitle>
              <CardDescription>Configure your session pricing and durations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="session-rate">Rate per 15 minutes (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    id="session-rate"
                    type="number"
                    className="pl-7"
                    value={sessionRate}
                    onChange={(e) => setSessionRate(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This is the base rate for a 15-minute session. Longer sessions will be priced accordingly.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Pricing Preview</Label>
                <div className="border rounded-md divide-y">
                  <div className="grid grid-cols-2 px-4 py-3">
                    <div className="font-medium">15 minutes</div>
                    <div className="text-right">${Number(sessionRate).toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-3">
                    <div className="font-medium">30 minutes</div>
                    <div className="text-right">${(Number(sessionRate) * 2).toFixed(2)}</div>
                  </div>
                  <div className="grid grid-cols-2 px-4 py-3">
                    <div className="font-medium">60 minutes</div>
                    <div className="text-right">${(Number(sessionRate) * 4).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Buffer Time Between Sessions</Label>
                <Select value={bufferTime} onValueChange={setBufferTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select buffer time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Buffer time ensures you have a break between consecutive sessions.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
