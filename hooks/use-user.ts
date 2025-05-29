"use client"

import { useUser } from "@clerk/nextjs"
import { useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { SessionContext } from "@/components/session-provider"
import { useToast } from "@/components/ui/use-toast"

type User = Database["public"]["Tables"]["users"]["Row"]

export function useUserData() {
  // --- Added for landing page preview ---
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    completedSessions: 0,
    totalSpent: 0,
  });
  const [recommendedProfessionals, setRecommendedProfessionals] = useState([
    {
      id: "650e8400-e29b-41d4-a716-446655440002",
      name: "Provider 2",
      title: "UX/UI Designer",
      category: "Design",
      rate_per_15min: 60,
      average_rating: 4.9,
      total_reviews: 38,
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440001",
      name: "Provider 1",
      title: "Legal Consultant",
      category: "Legal",
      rate_per_15min: 75,
      average_rating: 4.8,
      total_reviews: 47,
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440003",
      name: "Provider 3",
      title: "Career Coach",
      category: "Coaching",
      rate_per_15min: 50,
      average_rating: 4.7,
      total_reviews: 29,
    },
  ]);
  // --- END ---
  // State for Supabase-specific errors
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const session = useContext(SessionContext)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchUserData = useCallback(async () => {
    console.log("Debug - Starting fetchUserData:", {
      isLoaded,
      isSignedIn,
      clerkUserId: clerkUser?.id
    })

    // Reset states when Clerk is not ready
    if (!isLoaded) {
      console.log("Debug - Clerk not loaded yet")
      setLoading(true)
      return
    }

    // Handle signed out state
    if (!isSignedIn || !clerkUser?.id) {
      console.log("Debug - User not signed in or no Clerk ID")
      setUserData(null)
      setLoading(false)
      return
    }

    try {
      console.log("Debug - Fetching user data from Supabase...")
      if (clerkUser && clerkUser.id) {
        console.log("Debug - Fetching user by clerk_id:", clerkUser.id)
      }
      let { data: existingUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", clerkUser.id)
        .single()

      // If not found by clerk_id, try by email
      if (error && error.code === "PGRST116") {
        console.log("Debug - No user found by clerk_id, trying by email...");
        const emailToFetch = clerkUser.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress ? clerkUser.emailAddresses[0].emailAddress : ""
        if (emailToFetch) {
          console.log("Debug - Fetching user by email:", emailToFetch)
        }
        const { data: userByEmail, error: emailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", emailToFetch)
          .single();

        if (!emailError && userByEmail) {
          // Update user to add clerk_id linkage
          console.log("Debug - Found user by email, updating clerk_id...");
          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({ clerk_id: clerkUser.id })
            .eq("id", userByEmail.id)
            .select()
            .single();
          if (!updateError && updatedUser) {
            existingUser = updatedUser;
          } else {
            existingUser = userByEmail; // fallback
          }
        }
      }

      if (error && !existingUser) {
        setError(error.message || 'Unknown error fetching user from Supabase');
        console.error("Debug - Error fetching user (full error object):", error);
        console.error("Debug - Error fetching user (details):", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        if (error.code === "PGRST116") {
          console.log("Debug - User doesn't exist in Supabase, creating new user...")
          const newUser = {
            clerk_id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.firstName || "User",
            role: "seeker",
            balance: 0
          }

          console.log("Debug - Attempting to create new user:", newUser)

          const { data: createdUser, error: createError } = await supabase
            .from("users")
            .insert([newUser])
            .select()
            .single()

          if (createError) {
            console.error("Debug - Error creating user:", {
              code: createError.code,
              message: createError.message,
              details: createError.details,
              hint: createError.hint
            })
            setSupabaseError(createError.message || 'Failed to create user in Supabase');
            toast({
              title: 'Supabase User Creation Error',
              description: createError.message || 'Failed to create user in Supabase',
              variant: 'destructive',
            });
            throw createError
          }

          if (createdUser) {
            console.log("Debug - New user created successfully:", createdUser)
            setUserData(createdUser)
            session?.setUser({
              id: createdUser.id,
              name: createdUser.name,
              email: createdUser.email,
              image: clerkUser.imageUrl,
              role: createdUser.role,
              balance: createdUser.balance,
              is_active: createdUser.is_active,
            })
          }
        } else {
          throw error
        }
      } else {
        if (!existingUser.is_active) {
          console.log("Debug - User account is suspended:", existingUser)
          toast({
            title: "Account Suspended",
            description: "Your account has been suspended. Please contact support.",
            variant: "destructive",
          })
          setUserData(null)
          session?.setUser(null)
          return
        }

        console.log("Debug - Existing user found:", existingUser)
        setUserData(existingUser)
        session?.setUser({
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          image: clerkUser?.imageUrl,
          role: existingUser.role,
          balance: existingUser.balance,
          is_active: existingUser.is_active,
        })
      }
    } catch (err: any) {
      console.error("Debug - Error in fetchUserData:", {
        name: err.name,
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack
      })
      toast({
        title: "Error",
        description: "Failed to load user data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [clerkUser, isLoaded, isSignedIn, session, toast])

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser?.id) {
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, clerkUser?.id, fetchUserData]);

  return { userData, loading: loading || !isLoaded, isLoaded, isSignedIn, error, stats, recommendedProfessionals }
}
