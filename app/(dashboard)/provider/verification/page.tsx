"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useUserData } from "@/hooks/use-user"
import { createClient } from "@supabase/supabase-js"
import { useAuth } from "@clerk/nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
import { AlertCircle, CheckCircle2, Clock, FileText, Upload } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface VerificationRequest {
  id: string
  professional_title: string
  category: string
  bio: string
  credentials: string
  experience: string
  status: "pending" | "approved" | "rejected"
  feedback?: string
  submitted_at: string
  reviewed_at?: string
}

export default function VerificationPage() {
  const { getToken } = useAuth();
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useUserData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null)
  const [formData, setFormData] = useState({
    professional_title: "",
    category: "",
    bio: "",
    credentials: "",
    experience: "",
  })

  useEffect(() => {
    if (!userData) return
    if (userData.role !== "provider") {
      router.push("/seeker/dashboard")
      return
    }
    fetchVerificationStatus()
  }, [userData, router])

  const fetchVerificationStatus = async () => {
    if (!userData) return;
    try {
      const token = await getToken({ template: "supabase" });
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", userData.clerk_id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      setVerificationRequest(data);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      toast({
        title: "Error",
        description: "Failed to load verification status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    setIsSubmitting(true)

    // Step 3: Log the payload
    const payload = {
      user_id: userData.clerk_id,
      professional_title: formData.professional_title,
      category: formData.category,
      bio: formData.bio,
      credentials: formData.credentials,
      experience: formData.experience,
      status: "pending",
    }
    console.log("Submitting verification request payload:", payload)

    try {
      const token = await getToken({ template: "supabase" });
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      const { error } = await supabase.from("verification_requests").insert([payload]);

      // Step 3: Log the error if present
      if (error) {
        console.error("Supabase insert error:", error)
        throw error
      }

      toast({
        title: "Verification submitted",
        description: "Your verification request has been submitted for review",
      })

      // Refresh the verification status
      await fetchVerificationStatus()
    } catch (error) {
      console.error("Error submitting verification:", error)
      toast({
        title: "Error",
        description: "Failed to submit verification request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResubmit = () => {
    if (verificationRequest) {
      setFormData({
        professional_title: verificationRequest.professional_title,
        category: verificationRequest.category,
        bio: verificationRequest.bio,
        credentials: verificationRequest.credentials,
        experience: verificationRequest.experience,
      })
      setVerificationRequest(null)
    }
  }

  if (!userData) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading verification status...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Verification</h1>
      </div>

      {!verificationRequest ? (
        <Card>
          <CardHeader>
            <CardTitle>Professional Verification</CardTitle>
            <CardDescription>
              Complete the verification process to start offering your services on MinuteMate
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profession">Professional Title</Label>
                  <Input
                    id="profession"
                    placeholder="e.g. Legal Consultant, UX Designer, Career Coach"
                    value={formData.professional_title}
                    onChange={(e) => setFormData({ ...formData, professional_title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="coaching">Coaching</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Describe your expertise, experience, and the services you offer"
                    className="min-h-[120px]"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credentials">Credentials</Label>
                  <Textarea
                    id="credentials"
                    placeholder="List your relevant qualifications, certifications, and education"
                    className="min-h-[80px]"
                    value={formData.credentials}
                    onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Professional Experience</Label>
                  <Textarea
                    id="experience"
                    placeholder="Describe your work experience relevant to your services"
                    className="min-h-[80px]"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Credentials (Optional)</Label>
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Drag and drop files here or click to browse</p>
                    <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                    <Button type="button" variant="outline" size="sm" className="mt-4">
                      Browse Files
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to our verification process and professional standards
              </p>
            </CardFooter>
          </form>
        </Card>
      ) : verificationRequest.status === "pending" ? (
        <Card>
          <CardHeader>
            <CardTitle>Verification in Progress</CardTitle>
            <CardDescription>Your verification request is being reviewed by our team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-yellow-100 p-3 mb-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verification Pending</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're reviewing your professional credentials. This process typically takes 1-3 business days.
              </p>
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Verification Progress</span>
                  <span>50%</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            </div>

            <div className="border rounded-md divide-y">
              <div className="flex items-center p-4">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="font-medium">Application Received</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(verificationRequest.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4">
                <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                <div>
                  <p className="font-medium">Under Review</p>
                  <p className="text-sm text-muted-foreground">Our team is reviewing your credentials</p>
                </div>
              </div>
              <div className="flex items-center p-4">
                <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
                <div>
                  <p className="font-medium text-muted-foreground">Verification Decision</p>
                  <p className="text-sm text-muted-foreground">Pending review completion</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              View Submission
            </Button>
          </CardFooter>
        </Card>
      ) : verificationRequest.status === "approved" ? (
        <Card>
          <CardHeader>
            <CardTitle>Verification Approved</CardTitle>
            <CardDescription>Congratulations! Your professional verification has been approved</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verification Complete</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your profile is now verified and visible to potential clients. You can start receiving booking requests.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full" asChild>
              <a href="/provider/availability">Set Your Availability</a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="/provider/dashboard">Go to Dashboard</a>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Verification Rejected</CardTitle>
            <CardDescription>Your verification request needs additional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Additional Information Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We need additional information to complete your verification. Please review the feedback below and
                resubmit.
              </p>
            </div>

            {verificationRequest.feedback && (
              <div className="border rounded-md p-4 bg-muted/30">
                <h4 className="font-medium mb-2">Feedback from our team:</h4>
                <p className="text-sm text-muted-foreground">{verificationRequest.feedback}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleResubmit}>
              Update Verification Information
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
