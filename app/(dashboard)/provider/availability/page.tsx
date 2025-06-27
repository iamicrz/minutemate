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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useUserData } from "@/hooks/use-user"
import { supabase, createSupabaseClientWithToken } from "@/lib/supabase"
import { useAuth } from "@clerk/nextjs"
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
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useUserData()
  // We need both IDs for different operations
  const [clerkId, setClerkId] = useState<string>(""); // The Clerk user_id (text)
  const [supabaseId, setSupabaseId] = useState<string>(""); // The Supabase UUID
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
const [blocking, setBlocking] = useState(false)
  const [newTimeSlot, setNewTimeSlot] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  })
  const [sessionRate, setSessionRate] = useState("75")
  const [bufferTime, setBufferTime] = useState("15")
  const [maxAdvanceBookingDays, setMaxAdvanceBookingDays] = useState(30)
  const [minAdvanceBookingHours, setMinAdvanceBookingHours] = useState(24)
  const [autoAcceptBookings, setAutoAcceptBookings] = useState(true)

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
    console.log("[fetchData] userData:", userData);
    if (userData) {
      console.log("[fetchData] userData.id:", userData.id);
    }

    if (!userData) return

    try {
      // Get professional profile
      const { data: profile, error: profileError } = await supabase
        .from("professional_profiles")
        .select("*")
        .eq("user_id", userData.clerk_id)
        .single();
      console.log("[fetchData] profile fetch result:", profile, "error:", profileError);

      if (profileError) throw profileError

      // Store both IDs for different operations
      if (!userData?.clerk_id) throw new Error("No Clerk user ID found");
      setClerkId(userData.clerk_id); // The Clerk ID for querying professional_profiles
      setSupabaseId(userData.id); // The Supabase UUID for other operations
      
      // Set the default session rate from professional_profiles
      setSessionRate(profile.rate_per_15min?.toString?.() ?? "75");
      
      // Check if we have session_settings data (which overrides professional_profiles)
      const { data: sessionSettings, error: settingsError } = await supabase
        .from("session_settings")
        .select("*")
        .eq("professional_id", userData.clerk_id)
        .maybeSingle();
      
      console.log("[fetchData] session settings fetch result:", sessionSettings, "error:", settingsError);
      
      if (!settingsError && sessionSettings) {
        // We have session settings, so use the buffer time and other settings from there
        setBufferTime(sessionSettings.buffer_time_minutes?.toString() ?? "15");
        setMaxAdvanceBookingDays(sessionSettings.max_advance_booking_days ?? 30);
        setMinAdvanceBookingHours(sessionSettings.min_advance_booking_hours ?? 24);
        setAutoAcceptBookings(sessionSettings.auto_accept_bookings ?? true);
      }

      // Fetch availability slots using clerk_id
      const { data: slotsData, error: slotsError } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("professional_id", userData.clerk_id)
        .order("day_of_week")
        .order("start_time");

      if (slotsError) throw slotsError;
      setTimeSlots(slotsData || []);

      // Fetch blocked dates using clerk_id
      const { data: blockedData, error: blockedError } = await supabase
        .from("blocked_dates")
        .select("*")
        .eq("professional_id", userData.clerk_id)
        .gte("blocked_date", new Date().toISOString().split("T")[0])
        .order("blocked_date");

      if (blockedError) throw blockedError;
      setBlockedDates(blockedData || []);
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

  // Ensure async for getToken
  const addTimeSlot = async () => {
    if (!clerkId || !isSignedIn) {
      toast({ title: "Error", description: "Not signed in or missing provider info", variant: "destructive" });
      return;
    }
    console.log("[addTimeSlot] called", newTimeSlot, "clerkId:", clerkId);
    console.log("[addTimeSlot] called", newTimeSlot);

    if (!clerkId) return

    try {
      const token = await getToken();
      if (!token) {
        toast({ title: "Error", description: "Could not get authentication token", variant: "destructive" });
        return;
      }
      const supabaseAuthAvailability = createSupabaseClientWithToken(token, supabaseId);
      const { data, error } = await supabaseAuthAvailability
        .from("availability_slots")
        .insert([
          {
            professional_id: clerkId,
            day_of_week: newTimeSlot.day_of_week,
            start_time: newTimeSlot.start_time,
            end_time: newTimeSlot.end_time,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setTimeSlots(prev => {
        const updated = [...prev, data];
        console.log("[addTimeSlot] Updated timeSlots:", updated);
        return updated;
      })
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

  // Ensure async for getToken
  const removeTimeSlot = async (id: string) => {
    if (!clerkId || !isSignedIn) {
      toast({ title: "Error", description: "Not signed in or missing provider info", variant: "destructive" });
      return;
    }
    console.log("[removeTimeSlot] called", id, "clerkId:", clerkId);
    console.log("[removeTimeSlot] called", id);
    if (!clerkId) return;
    try {
      const token = await getToken();
      if (!token) {
        toast({ title: "Error", description: "Could not get authentication token", variant: "destructive" });
        return;
      }
      const supabaseAuthAvailability = createSupabaseClientWithToken(token, supabaseId);
      const { error } = await supabaseAuthAvailability.from("availability_slots").delete().eq("id", id);

      if (error) throw error;

      setTimeSlots(prev => prev.filter(slot => slot.id !== id))
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

  // Ensure async for getToken
  const saveSettings = async () => {
    if (!clerkId || !supabaseId || !isSignedIn) {
      toast({ title: "Error", description: "Not signed in or missing provider info", variant: "destructive" });
      return;
    }
    // Log all arguments for debugging
    console.log("[saveSettings] called", { 
      sessionRate, 
      bufferTime, 
      maxAdvanceBookingDays, 
      minAdvanceBookingHours, 
      autoAcceptBookings, 
      clerkId, 
      supabaseId 
    });
    setSaving(true);
    try {
      // STEP 1: Update professional_profiles table using basic supabase client
      // This avoids UUID issues since professional_profiles uses TEXT IDs
      const token = await getToken();
      if (!token) {
        toast({ title: "Error", description: "Could not get authentication token", variant: "destructive" });
        return;
      }
      const supabaseAuthAvailability = createSupabaseClientWithToken(token, supabaseId);
      const profileUpdatePayload = {
        rate_per_15min: Number.parseFloat(sessionRate)
      };
      
      console.log("[saveSettings] updating professional_profiles", {
        payload: profileUpdatePayload,
        filter: { user_id: clerkId }
      });
      
      // For professional_profiles, use the regular supabase client
      const { error: profileError } = await supabase
        .from("professional_profiles")
        .update(profileUpdatePayload)
        .eq("user_id", clerkId); // Use clerk_id for professional_profiles (TEXT type)
      
      if (profileError) {
        console.error("Error updating professional profile:", profileError);
        throw profileError;
      }
      
      // STEP 2: Now add/update session_settings
      // First check if a session_settings record exists
      const { data: existingSettings, error: checkError } = await supabase
        .from("session_settings")
        .select("id")
        .eq("professional_id", clerkId)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking session settings:", checkError);
        throw checkError;
      }
      
      const sessionSettingsPayload = {
        buffer_time_minutes: parseInt(bufferTime),
        rate_per_15min: Number.parseFloat(sessionRate),
        max_advance_booking_days: maxAdvanceBookingDays,
        min_advance_booking_hours: minAdvanceBookingHours,
        auto_accept_bookings: autoAcceptBookings,
        updated_at: new Date().toISOString()
      };
      let settingsResult;
      const supabaseAuthSettings = createSupabaseClientWithToken(token, clerkId);
      if (existingSettings?.id) {
        // Update existing settings record
        console.log("[saveSettings] updating existing session_settings", {
          id: existingSettings.id,
          payload: sessionSettingsPayload
        });
        settingsResult = await supabaseAuthSettings
          .from("session_settings")
          .update(sessionSettingsPayload)
          .eq("id", existingSettings.id)
          .select();
      } else {
        // Create new settings record
        console.log("[saveSettings] creating new session_settings", {
          professional_id: clerkId,
          payload: sessionSettingsPayload
        });
        // Log the final payload
        console.log("[saveSettings] final insert payload:", {
          professional_id: clerkId,
          ...sessionSettingsPayload
        });
        // Explicitly construct the payload to ensure only correct fields are sent
        const insertPayload = {
          professional_id: clerkId,
          buffer_time_minutes: parseInt(bufferTime),
          rate_per_15min: Number.parseFloat(sessionRate),
          max_advance_booking_days: maxAdvanceBookingDays,
          min_advance_booking_hours: minAdvanceBookingHours,
          auto_accept_bookings: autoAcceptBookings,
          updated_at: new Date().toISOString()
        };
        console.log("[saveSettings] KEYS OF FINAL INSERT PAYLOAD:", Object.keys(insertPayload));
        console.log("[saveSettings] VALUES OF FINAL INSERT PAYLOAD:", insertPayload);
        settingsResult = await supabaseAuthSettings
          .from("session_settings")
          .insert(insertPayload);
      }
      if (settingsResult.error) {
        console.error("Error with session settings operation:", settingsResult.error);
        throw settingsResult.error;
      }
      toast({
        title: "Settings saved",
        description: "Your session settings have been updated",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings: " + (error?.message || JSON.stringify(error)),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // Ensure async for getToken
  const blockDate = async () => {
    if (blocking) return;
    setBlocking(true);

    if (!clerkId || !isSignedIn) {
      toast({ title: "Error", description: "Not signed in or missing provider info", variant: "destructive" });
      return;
    }
    console.log("[blockDate] called", date, "clerkId:", clerkId);
    console.log("[blockDate] called", date);
    if (!date || !clerkId) {
      console.warn("[blockDate] missing date or clerkId", { date, clerkId });
      toast({ title: "Error", description: "Missing date or provider profile. Please reload the page or contact support.", variant: "destructive" });
      setBlocking(false);
      return;
    }

    const dateString = formatDateYYYYMMDD(date)

    try {
      const token = await getToken();
      if (!token) {
        toast({ title: "Error", description: "Could not get authentication token", variant: "destructive" });
        return;
      }
      const supabaseAuthAvailability = createSupabaseClientWithToken(token, supabaseId);
      const { data, error } = await supabaseAuthAvailability
        .from("blocked_dates")
        .insert([
          {
            professional_id: clerkId,
            blocked_date: dateString,
            reason: "Unavailable",
          },
        ])
        .select()
        .single()

      if (error) throw error

      setBlockedDates(prev => {
        const updated = [...prev, data];
        console.log("[blockDate] Updated blockedDates:", updated);
        return updated;
      })
      toast({
        title: "Date blocked",
        description: `${date.toLocaleDateString()} has been marked as unavailable`,
      })
      setDate(undefined); // Clear the selected date after successful block
    } catch (error) {
      let errorMsg = "Failed to block date";
      let isDuplicate = false;
      if (error && typeof error === "object" && "code" in error && (error as any).code === "23505") {
        errorMsg = "This date is already blocked.";
        isDuplicate = true;
      } else {
        // Only log unexpected errors
        console.error("Error blocking date:", error);
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setBlocking(false);
    }
  }

  const removeBlockedDate = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast({
          title: "Error",
          description: "Could not get authentication token",
          variant: "destructive",
        });
        return;
      }
      const supabaseAuthAvailability = createSupabaseClientWithToken(token, supabaseId);
      const { error } = await supabaseAuthAvailability.from("blocked_dates").delete().eq("id", id);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove blocked date",
          variant: "destructive",
        });
        return;
      }
      setBlockedDates(prev => prev.filter((date) => date.id !== id));
      toast({ title: "Blocked date removed" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove blocked date",
        variant: "destructive",
      });
    }
  }

  if (!userData) return null

  // Utility to format date as YYYY-MM-DD in local time
  function formatDateYYYYMMDD(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Prevent duplicate blocked dates
  const isDateBlocked = !!blockedDates.find(
    (d) => d.blocked_date === (date ? formatDateYYYYMMDD(date) : undefined)
  );

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
            {/* Calendar and Block Date */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Block specific dates or add special availability</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar mode="single" selected={date} onSelect={setDate} className="border rounded-md" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={blockDate}
                  disabled={!date || !clerkId || blocking || isDateBlocked}
                >
                  {blocking
                    ? "Blocking..."
                    : isDateBlocked
                    ? "Already Blocked"
                    : "Block Date"}
                </Button>
              </CardFooter>
            </Card>
            {/* Upcoming Blocked Dates */}
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
  {/* Top row: Session Rate input and Auto Accept Switch */}
  <div className="flex flex-col gap-2 max-w-xs">
    <Label>Session Rate ($/15min)</Label>
    <Input
      type="number"
      min={0}
      value={sessionRate}
      onChange={(e) => setSessionRate(e.target.value)}
      className="w-32"
    />
    <div className="flex items-center gap-2 mt-2">
      <Switch
        id="auto-accept-bookings"
        checked={autoAcceptBookings}
        onCheckedChange={setAutoAcceptBookings}
        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted border-2 border-primary"
      />
      <Label htmlFor="auto-accept-bookings" className="text-muted-foreground text-sm font-normal">Auto Accept Bookings</Label>
    </div>
  </div>

  {/* Sliders and Previews side by side */}
  <div className="flex flex-col md:flex-row md:gap-10">
    {/* Sliders */}
    <div className="flex-1 flex items-stretch">
      <div className="flex flex-col justify-between w-full min-h-[220px] bg-white rounded-l-md border-l border-t border-b border-muted/30 shadow-lg p-6 gap-7">
        <div>
          <Label>Buffer Time (min)</Label>
          <div className="flex items-center gap-4 mt-1">
            <Slider
              min={0}
              max={120}
              step={5}
              value={[Number(bufferTime)]}
              onValueChange={([val]: number[]) => setBufferTime(val.toString())}
              className="w-64"
            />
            <span className="w-14 text-right font-medium">{bufferTime} min</span>
          </div>
        </div>
        <div>
          <Label htmlFor="max-advance-booking-days">Max Advance Booking Days</Label>
          <div className="flex items-center gap-4 mt-1">
            <Slider
              min={1}
              max={90}
              step={1}
              value={[maxAdvanceBookingDays]}
              onValueChange={([val]: number[]) => setMaxAdvanceBookingDays(val)}
              className="w-64"
            />
            <span className="w-14 text-right font-medium">{maxAdvanceBookingDays} days</span>
          </div>
        </div>
        <div>
          <Label htmlFor="min-advance-booking-hours">Min Advance Booking Hours</Label>
          <div className="flex items-center gap-4 mt-1">
            <Slider
              min={0}
              max={72}
              step={1}
              value={[minAdvanceBookingHours]}
              onValueChange={([val]: number[]) => setMinAdvanceBookingHours(val)}
              className="w-64"
            />
            <span className="w-14 text-right font-medium">{minAdvanceBookingHours} hrs</span>
          </div>
        </div>
      </div>
    </div>
    {/* Pricing Preview Table */}
    <div className="flex-1 flex items-stretch mt-8 md:mt-0">
      <div className="rounded-md border border-muted/30 shadow-lg bg-white px-6 py-5 flex flex-col justify-center w-full min-h-[220px]">
        <div className="font-semibold text-base mb-3 text-primary">Pricing Preview</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="text-left font-normal pb-1">Duration</th>
              <th className="text-right font-normal pb-1">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pl-1 py-1 text-base font-medium text-foreground">15 minutes</td>
              <td className="text-right pr-1 py-1 font-semibold text-primary">${Number(sessionRate).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="pl-1 py-1 text-base font-medium text-foreground">30 minutes</td>
              <td className="text-right pr-1 py-1 font-semibold text-primary">${(Number(sessionRate) * 2).toFixed(2)}</td>
            </tr>
            <tr className="bg-[#f3e8ff] rounded-md">
              <td className="pl-1 py-1 text-base font-bold text-[#7c3aed]">60 minutes</td>
              <td className="text-right pr-1 py-1 font-bold text-[#7c3aed]">${(Number(sessionRate) * 4).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
