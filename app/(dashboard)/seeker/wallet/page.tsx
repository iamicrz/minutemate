"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useUserData } from "@/hooks/use-user"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase"
import { CreditCard, DollarSign, Download, Plus, ShoppingCart, Wallet, Clock } from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  created_at: string
}

export default function WalletPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userData, loading: userLoading } = useUserData()
  const { isSignedIn } = useUser()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")

  useEffect(() => {
    if (!isSignedIn || (!userData && !userLoading)) {
      router.push("/auth/login")
      return
    }
    if (userData) fetchTransactions()
  }, [userData, userLoading, isSignedIn, router])

  const fetchTransactions = async () => {
    if (!userData) return

    try {
      // Fetch completed transactions
      const { data: completedData, error: completedError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userData.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })

      if (completedError) throw completedError

      // Fetch pending transactions
      const { data: pendingData, error: pendingError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userData.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (pendingError) throw pendingError

      setTransactions(completedData || [])
      setPendingTransactions(pendingData || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddFunds = async () => {
    const amountNum = Number.parseFloat(amount)

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to add",
        variant: "destructive",
      })
      return
    }

    if (!userData) return

    setIsLoading(true)

    try {
      // Create transaction record
      const { error: transactionError } = await supabase.from("transactions").insert([
        {
          user_id: userData.id,
          type: "add_funds",
          amount: amountNum,
          description: "Added funds to wallet",
          status: "completed",
        },
      ])

      if (transactionError) throw transactionError

      // Update user balance
      const newBalance = userData.balance + amountNum
      const { error: balanceError } = await supabase.from("users").update({ balance: newBalance }).eq("id", userData.id)

      if (balanceError) throw balanceError

      // Create notification
      await supabase.from("notifications").insert([
        {
          user_id: userData.id,
          title: "Funds Added",
          message: `$${amountNum.toFixed(2)} has been added to your wallet`,
          type: "wallet",
        },
      ])

      toast({
        title: "Funds added successfully",
        description: `$${amountNum.toFixed(2)} has been added to your wallet`,
      })

      setAmount("")
      await fetchTransactions() // Refresh transaction history
    } catch (error) {
      console.error("Error adding funds:", error)
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading wallet...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Wallet</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>Your current wallet balance and transaction history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col space-y-1.5">
              <div className="text-sm text-muted-foreground">Available Balance</div>
              <div className="text-3xl font-bold">${userData.balance.toFixed(2)}</div>
            </div>

            <Tabs defaultValue="transactions">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingTransactions.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="transactions" className="mt-4">
                <div className="space-y-2">
                  {transactions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">No transactions found</div>
                  ) : (
                    transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between border rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`rounded-full p-2 ${
                              transaction.type === "add_funds"
                                ? "bg-green-100 text-green-700"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {transaction.type === "add_funds" ? (
                              <Download className="h-4 w-4" />
                            ) : (
                              <ShoppingCart className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className={`font-medium ${transaction.type === "add_funds" ? "text-green-600" : ""}`}>
                          {transaction.type === "add_funds" ? "+" : "-"}${Number(transaction.amount).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="pending" className="mt-4">
                {pendingTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <DollarSign className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">No pending transactions</h3>
                    <p className="text-sm text-muted-foreground mt-1">All your transactions have been processed</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between border rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full p-2 bg-yellow-100 text-yellow-700">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="font-medium text-yellow-600">${Number(transaction.amount).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Funds</CardTitle>
            <CardDescription>Add money to your wallet to book professional sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick Amounts</Label>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup defaultValue="credit-card" value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label htmlFor="credit-card" className="flex-1 cursor-pointer flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    PayPal
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleAddFunds} disabled={isLoading || !amount}>
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Funds
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
