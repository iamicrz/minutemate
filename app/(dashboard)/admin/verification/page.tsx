"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useUserData } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { CheckCircle2, Clock, FileText, Search, ShieldCheck, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface VerificationRequest {
  id: string
  user_id: string
  professional_title: string
  category: string
  bio: string
  credentials: string
  experience: string
  status: "pending" | "approved" | "rejected"
  feedback?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  users: {
    name: string
    email: string
  }
}

export default function AdminVerificationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useUserData()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([])
  const [completedRequests, setCompletedRequests] = useState<VerificationRequest[]>([])

  useEffect(() => {
    if (!userData) return
    fetchVerificationRequests()
  }, [userData, router])

  const fetchVerificationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("verification_requests")
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .order("submitted_at", { ascending: false })

      if (error) throw error

      const pending = data?.filter((req) => req.status === "pending") || []
      const completed = data?.filter((req) => req.status !== "pending") || []

      setPendingRequests(pending)
      setCompletedRequests(completed)
    } catch (error) {
      console.error("Error fetching verification requests:", error)
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPendingRequests = pendingRequests.filter(
    (request) =>
      request.users.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.professional_title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredCompletedRequests = completedRequests.filter(
    (request) =>
      request.users.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.professional_title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewDetails = (request: VerificationRequest) => {
    setSelectedRequest(request)
    setFeedbackText("")
  }

  const handleApprove = async () => {
    if (!selectedRequest || !userData) return

    setIsSubmitting(true)
    try {
      // Update verification request
      const { error: updateError } = await supabase
        .from("verification_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.id,
        })
        .eq("id", selectedRequest.id)

      if (updateError) throw updateError

      // Create professional profile
      const { error: profileError } = await supabase.from("professional_profiles").insert([
        {
          user_id: selectedRequest.user_id,
          title: selectedRequest.professional_title,
          bio: selectedRequest.bio,
          credentials: selectedRequest.credentials,
          experience: selectedRequest.experience,
          category: selectedRequest.category,
          rate_per_15min: 50.0, // Default rate
          is_verified: true,
        },
      ])

      if (profileError) throw profileError

      // Create notification
      await supabase.from("notifications").insert([
        {
          user_id: selectedRequest.user_id,
          title: "Verification Approved",
          message:
            "Congratulations! Your professional verification has been approved. You can now start offering your services.",
          type: "verification",
        },
      ])

      toast({
        title: "Verification approved",
        description: `${selectedRequest.users.name} has been verified as a ${selectedRequest.professional_title}`,
      })

      await fetchVerificationRequests()
      setSelectedRequest(null)
    } catch (error) {
      console.error("Error approving verification:", error)
      toast({
        title: "Error",
        description: "Failed to approve verification",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !userData || !feedbackText) {
      toast({
        title: "Feedback required",
        description: "Please provide feedback for the rejection",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("verification_requests")
        .update({
          status: "rejected",
          feedback: feedbackText,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.id,
        })
        .eq("id", selectedRequest.id)

      if (error) throw error

      // Create notification
      await supabase.from("notifications").insert([
        {
          user_id: selectedRequest.user_id,
          title: "Verification Requires Updates",
          message: "Your verification request needs additional information. Please check the feedback and resubmit.",
          type: "verification",
        },
      ])

      toast({
        title: "Verification rejected",
        description: `Feedback has been sent to ${selectedRequest.users.name}`,
      })

      await fetchVerificationRequests()
      setSelectedRequest(null)
      setFeedbackText("")
    } catch (error) {
      console.error("Error rejecting verification:", error)
      toast({
        title: "Error",
        description: "Failed to reject verification",
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
        <div className="text-center">Loading verification requests...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Verification Requests</h1>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search requests..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="pending" className="flex-1 md:flex-initial">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 md:flex-initial">
            Completed ({completedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6 mt-6">
          {filteredPendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <ShieldCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No pending requests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "No requests match your search" : "All verification requests have been processed"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPendingRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-4">
                        {request.users.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{request.users.name}</h3>
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.professional_title}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <span>Submitted: {new Date(request.submitted_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t p-4 flex justify-between items-center">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6 mt-6">
          {filteredCompletedRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <ShieldCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No completed requests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "No requests match your search" : "No verification requests have been processed yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompletedRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-4">
                        {request.users.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{request.users.name}</h3>
                          <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                            {request.status === "approved" ? "Approved" : "Rejected"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.professional_title}</p>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <span>
                            Reviewed: {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t p-4 flex justify-between items-center">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verification Request</DialogTitle>
              <DialogDescription>Review the professional verification request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {selectedRequest.users.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedRequest.users.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRequest.users.email}</p>
                  <p className="text-sm font-medium">{selectedRequest.professional_title}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedRequest.category}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Professional Bio</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{selectedRequest.bio}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Credentials</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                    {selectedRequest.credentials}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Experience</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                    {selectedRequest.experience}
                  </p>
                </div>

                {selectedRequest.status === "rejected" && selectedRequest.feedback && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Previous Rejection Feedback</h4>
                    <p className="text-sm text-muted-foreground bg-red-50 p-3 rounded-md border border-red-200">
                      {selectedRequest.feedback}
                    </p>
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Feedback (for rejection only)</h4>
                    <Textarea
                      placeholder="Provide feedback on why this verification is being rejected"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="resize-none"
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              {selectedRequest.status !== "pending" ? (
                <Button type="button" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReject}
                    disabled={isSubmitting}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Processing..." : "Reject"}
                  </Button>
                  <Button type="button" className="flex-1" onClick={handleApprove} disabled={isSubmitting}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Processing..." : "Approve"}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
