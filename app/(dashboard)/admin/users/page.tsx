"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { Ban, CheckCircle2, Search, UserCog } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface User {
  id: string
  clerk_id: string
  email: string
  name: string
  role: "seeker" | "provider" | "admin"
  is_active: boolean
  balance: number
  created_at: string
  professional_profiles?: {
    is_verified: boolean
    title: string
  }[]
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useUserData()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!userData) return
    if (userData.role !== "admin") {
      router.push("/auth/login")
      return
    }
    fetchUsers()
  }, [userData, router])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          professional_profiles (
            is_verified,
            title
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    // Filter by search query
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by role
    const matchesRole = roleFilter === "all" || user.role === roleFilter

    // Filter by status
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.is_active : !user.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
  }

  const handleSuspendUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("users").update({ is_active: false }).eq("id", selectedUser.id)

      if (error) throw error

      // Create notification
      await supabase.from("notifications").insert([
        {
          user_id: selectedUser.id,
          title: "Account Suspended",
          message: "Your account has been suspended. Please contact support for more information.",
          type: "account",
        },
      ])

      toast({
        title: "User suspended",
        description: `${selectedUser.name} has been suspended`,
      })

      await fetchUsers()
      setSelectedUser(null)
    } catch (error) {
      console.error("Error suspending user:", error)
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActivateUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("users").update({ is_active: true }).eq("id", selectedUser.id)

      if (error) throw error

      // Create notification
      await supabase.from("notifications").insert([
        {
          user_id: selectedUser.id,
          title: "Account Activated",
          message: "Your account has been reactivated. Welcome back to MinuteMate!",
          type: "account",
        },
      ])

      toast({
        title: "User activated",
        description: `${selectedUser.name} has been activated`,
      })

      await fetchUsers()
      setSelectedUser(null)
    } catch (error) {
      console.error("Error activating user:", error)
      toast({
        title: "Error",
        description: "Failed to activate user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Manage Users</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>View and manage all users on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="provider">Providers</SelectItem>
                <SelectItem value="seeker">Seekers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <div className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_2fr_1fr_1fr_auto] px-4 py-3 border-b bg-muted/50">
              <div className="font-medium text-sm">User</div>
              <div className="font-medium text-sm hidden md:block">Email</div>
              <div className="font-medium text-sm hidden md:block">Role</div>
              <div className="font-medium text-sm hidden md:block">Status</div>
              <div className="font-medium text-sm text-right">Actions</div>
            </div>
            <div className="divide-y">
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No users found matching your filters
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_2fr_1fr_1fr_auto] px-4 py-3 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground md:hidden">{user.email}</span>
                      </div>
                    </div>
                    <div className="hidden md:block text-sm">{user.email}</div>
                    <div className="hidden md:block">
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    <div className="hidden md:block">
                      <Badge variant={user.is_active ? "default" : "destructive"} className="capitalize">
                        {user.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewUser(user)}>
                        <UserCog className="h-4 w-4" />
                        <span className="sr-only">Manage</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View and manage user information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {selectedUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Role</h4>
                  <p className="capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <Badge variant={selectedUser.is_active ? "default" : "destructive"} className="capitalize mt-1">
                    {selectedUser.is_active ? "Active" : "Suspended"}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Join Date</h4>
                  <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Balance</h4>
                  <p>${selectedUser.balance.toFixed(2)}</p>
                </div>
                {selectedUser.role === "provider" && selectedUser.professional_profiles?.[0] && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Professional Title</h4>
                      <p>{selectedUser.professional_profiles[0].title}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Verification</h4>
                      <Badge
                        variant={selectedUser.professional_profiles[0].is_verified ? "default" : "outline"}
                        className="mt-1"
                      >
                        {selectedUser.professional_profiles[0].is_verified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
              <div className="flex gap-2">
                {selectedUser.is_active ? (
                  <Button type="button" variant="destructive" onClick={handleSuspendUser} disabled={isSubmitting}>
                    <Ban className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Processing..." : "Suspend User"}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleActivateUser} disabled={isSubmitting}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Processing..." : "Activate User"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
