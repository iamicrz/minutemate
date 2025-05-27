"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { ArrowUp, Calendar, DollarSign, Download, LineChart, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface EarningsData {
  totalEarnings: number
  monthlyEarnings: number
  weeklyEarnings: number
  pendingEarnings: number
  sessionsCompleted: number
  clientsServed: number
}

interface Transaction {
  id: string
  seeker_name: string
  created_at: string
  amount: number
  status: string
  description: string
}

export default function EarningsPage() {
  const router = useRouter()
  const { userData } = useUserData()
  const { toast } = useToast()
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    pendingEarnings: 0,
    sessionsCompleted: 0,
    clientsServed: 0,
  })
  const [completedTransactions, setCompletedTransactions] = useState<Transaction[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")

  useEffect(() => {
    if (!userData || userData.role !== "provider") {
      if (!loading && userData && userData.role !== "provider") {
        router.push("/seeker/dashboard")
      }
      return
    }
    fetchEarningsData()
  }, [userData, loading, router])

  const fetchEarningsData = async () => {
    if (!userData) return

    try {
      // Get professional profile
      const { data: profile } = await supabase
        .from("professional_profiles")
        .select("id, total_sessions")
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

      // Get all earnings transactions
      const { data: allTransactions, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          bookings!transactions_booking_id_fkey(
            users!bookings_seeker_id_fkey(name)
          )
        `)
        .eq("user_id", userData.id)
        .eq("type", "payout")
        .order("created_at", { ascending: false })

      if (transactionsError) throw transactionsError

      // Calculate earnings
      const completedTxns = allTransactions?.filter((t) => t.status === "completed") || []
      const pendingTxns = allTransactions?.filter((t) => t.status === "pending") || []

      const totalEarnings = completedTxns.reduce((sum, t) => sum + Number(t.amount), 0)
      const pendingEarnings = pendingTxns.reduce((sum, t) => sum + Number(t.amount), 0)

      // Calculate monthly earnings
      const currentMonth = new Date().toISOString().slice(0, 7)
      const monthlyTxns = completedTxns.filter((t) => t.created_at.startsWith(currentMonth))
      const monthlyEarnings = monthlyTxns.reduce((sum, t) => sum + Number(t.amount), 0)

      // Calculate weekly earnings
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const weeklyTxns = completedTxns.filter((t) => new Date(t.created_at) >= oneWeekAgo)
      const weeklyEarnings = weeklyTxns.reduce((sum, t) => sum + Number(t.amount), 0)

      // Get unique clients count
      const uniqueClients = new Set(completedTxns.map((t) => t.bookings?.users?.name).filter((name) => name)).size

      setEarningsData({
        totalEarnings,
        monthlyEarnings,
        weeklyEarnings,
        pendingEarnings,
        sessionsCompleted: profile.total_sessions,
        clientsServed: uniqueClients,
      })

      // Format transactions for display
      const formattedCompleted = completedTxns.map((t) => ({
        id: t.id,
        seeker_name: t.bookings?.users?.name || "Unknown",
        created_at: t.created_at,
        amount: Number(t.amount),
        status: t.status,
        description: t.description || "",
      }))

      const formattedPending = pendingTxns.map((t) => ({
        id: t.id,
        seeker_name: t.bookings?.users?.name || "Unknown",
        created_at: t.created_at,
        amount: Number(t.amount),
        status: t.status,
        description: t.description || "",
      }))

      setCompletedTransactions(formattedCompleted)
      setPendingTransactions(formattedPending)
    } catch (error) {
      console.error("Error fetching earnings data:", error)
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading earnings...</div>
      </div>
    )
  }

  const getCurrentPeriodEarnings = () => {
    switch (period) {
      case "week":
        return earningsData.weeklyEarnings
      case "month":
        return earningsData.monthlyEarnings
      case "year":
      case "all":
        return earningsData.totalEarnings
      default:
        return earningsData.monthlyEarnings
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Earnings</h1>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {period === "week" ? "Weekly" : period === "month" ? "Monthly" : "Total"} Earnings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getCurrentPeriodEarnings().toFixed(2)}</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>Growth from previous {period}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${earningsData.pendingEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Expected within 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Clients Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earningsData.clientsServed}</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>Unique clients</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
          <CardDescription>Your earnings over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <LineChart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Earnings chart visualization would appear here</p>
            <p className="text-xs text-muted-foreground mt-2">
              Total of {earningsData.sessionsCompleted} sessions completed
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="completed">
        <TabsList>
          <TabsTrigger value="completed">Completed Payments ({completedTransactions.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Payments ({pendingTransactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent payments</CardDescription>
            </CardHeader>
            <CardContent>
              {completedTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No completed payments yet</div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 md:grid-cols-4 px-4 py-3 border-b bg-muted/50">
                    <div className="font-medium text-sm">Client</div>
                    <div className="font-medium text-sm hidden md:block">Date</div>
                    <div className="font-medium text-sm">Amount</div>
                    <div className="font-medium text-sm text-right">Status</div>
                  </div>
                  <div className="divide-y">
                    {completedTransactions.map((transaction) => (
                      <div key={transaction.id} className="grid grid-cols-3 md:grid-cols-4 px-4 py-3 items-center">
                        <div className="font-medium">{transaction.seeker_name}</div>
                        <div className="text-sm text-muted-foreground hidden md:block">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                        <div>${transaction.amount.toFixed(2)}</div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Paid
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Payments that are being processed</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No pending payments</h3>
                  <p className="text-sm text-muted-foreground">All your payments have been processed</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 md:grid-cols-4 px-4 py-3 border-b bg-muted/50">
                    <div className="font-medium text-sm">Client</div>
                    <div className="font-medium text-sm hidden md:block">Date</div>
                    <div className="font-medium text-sm">Amount</div>
                    <div className="font-medium text-sm text-right">Status</div>
                  </div>
                  <div className="divide-y">
                    {pendingTransactions.map((transaction) => (
                      <div key={transaction.id} className="grid grid-cols-3 md:grid-cols-4 px-4 py-3 items-center">
                        <div className="font-medium">{transaction.seeker_name}</div>
                        <div className="text-sm text-muted-foreground hidden md:block">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                        <div>${transaction.amount.toFixed(2)}</div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
