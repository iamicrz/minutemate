"use client"

import { useUser } from "@clerk/nextjs"
import { useContext, useEffect, useState, useCallback } from "react"
import { supabase, withRetry } from "@/lib/supabase"
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

  // Track if a fetch is in progress to prevent duplicate calls
  const [isFetching, setIsFetching] = useState(false)
  
  const fetchUserData = useCallback(async () => {
    // Skip if already fetching or if we already have user data
    if (isFetching || (userData && userData.id)) {
      return
    }
    
    setIsFetching(true)
    console.log("Debug - Starting fetchUserData:", {
      isLoaded,
      isSignedIn,
      clerkUserId: clerkUser?.id
    })

    // Reset states when Clerk is not ready
    if (!isLoaded) {
      console.log("Debug - Clerk not loaded yet")
      setLoading(true)
      setIsFetching(false)
      return
    }

    // Handle signed out state
    if (!isSignedIn || !clerkUser?.id) {
      console.log("Debug - User not signed in or no Clerk ID")
      setUserData(null)
      setLoading(false)
      setIsFetching(false)
      return
    }

    try {
      console.log("Debug - Fetching user data from Supabase...")
      if (clerkUser && clerkUser.id) {
        console.log("Debug - Fetching user by clerk_id:", clerkUser.id)
      }
      
      // Use retry functionality for fetching user data
      let existingUser: Database["public"]["Tables"]["users"]["Row"] | null = null;
      let error: any = null;
      
      try {
        const result = await withRetry(async () => {
          return await supabase
            .from("users")
            .select("*")
            .eq("clerk_id", clerkUser.id)
            .single();
        }, 3, 1000);
        
        existingUser = result.data;
        error = result.error;
      } catch (err: any) {
        console.error("Error after retries:", err);
        error = err;
      }

      // If not found by clerk_id, try by email
      if (error && typeof error === 'object' && 'code' in error && error.code === "PGRST116") {
        console.log("Debug - No user found by clerk_id, trying by email...");
        const emailToFetch = clerkUser.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress ? clerkUser.emailAddresses[0].emailAddress : ""
        if (emailToFetch) {
          console.log("Debug - Fetching user by email:", emailToFetch)
        }
        
        let userByEmail = null;
        let emailError = null;
        
        try {
          const result = await withRetry(async () => {
            return await supabase
              .from("users")
              .select("*")
              .eq("email", emailToFetch)
              .single();
          }, 3, 1000);
          
          userByEmail = result.data;
          emailError = result.error;
        } catch (err) {
          console.error("Error fetching by email after retries:", err);
          emailError = err;
        }

        if (!emailError && userByEmail) {
          // Update user to add clerk_id linkage
          console.log("Debug - Found user by email, updating clerk_id...");
          
          let updatedUser = null;
          let updateError = null;
          
          try {
            const result = await withRetry(async () => {
              return await supabase
                .from("users")
                .update({ clerk_id: clerkUser.id })
                .eq("id", userByEmail.id)
                .select()
                .single();
            }, 3, 1000);
            
            updatedUser = result.data;
            updateError = result.error;
          } catch (err) {
            console.error("Error updating user after retries:", err);
            updateError = err;
          }
          if (!updateError && updatedUser) {
            existingUser = updatedUser;
          } else {
            existingUser = userByEmail; // fallback
          }
        }
      }

      if (error && !existingUser) {
        const errorMsg = typeof error === 'object' && 'message' in error ? error.message : 'Unknown error fetching user from Supabase';
        setError(errorMsg);
        console.error("Debug - Error fetching user (full error object):", error);
        console.error("Debug - Error fetching user (details):", {
          code: typeof error === 'object' && 'code' in error ? error.code : 'unknown',
          message: typeof error === 'object' && 'message' in error ? error.message : 'unknown',
          details: typeof error === 'object' && 'details' in error ? error.details : 'unknown',
          hint: typeof error === 'object' && 'hint' in error ? error.hint : 'unknown'
        });

        if (typeof error === 'object' && 'code' in error && error.code === "PGRST116") {
          console.log("Debug - User doesn't exist in Supabase, creating new user...")
          const newUser = {
            clerk_id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.firstName || "User",
            role: "seeker",
            balance: 0,
            is_active: true // All new users are active by default
          }

          console.log("Debug - Attempting to create new user:", newUser)

          let createdUser = null;
          let createError = null;
          
          try {
            const result = await withRetry(async () => {
              return await supabase
                .from("users")
                .insert([newUser])
                .select()
                .single();
            }, 3, 1000);
            
            createdUser = result.data;
            createError = result.error;
          } catch (err) {
            console.error("Error creating user after retries:", err);
            createError = err;
          }

          if (createError) {
            console.error("Debug - Error creating user:", {
              code: typeof createError === 'object' && 'code' in createError ? createError.code : 'unknown',
              message: typeof createError === 'object' && 'message' in createError ? createError.message : 'unknown',
              details: typeof createError === 'object' && 'details' in createError ? createError.details : 'unknown',
              hint: typeof createError === 'object' && 'hint' in createError ? createError.hint : 'unknown'
            })
            const errorMsg = typeof createError === 'object' && 'message' in createError ? 
              (typeof createError.message === 'string' ? createError.message : 'Failed to create user in Supabase') : 
              'Failed to create user in Supabase';
            setSupabaseError(errorMsg);
            toast({
              title: 'Supabase User Creation Error',
              description: errorMsg,
              variant: 'destructive',
            });
            throw createError
          }

          if (createdUser) {
            console.log("Debug - New user created successfully:", createdUser)
            // If the new user is a provider, create a professional_profiles row
            if (createdUser.role === "provider") {
              try {
                const { error: profileError } = await supabase
                  .from("professional_profiles")
                  .insert([
                    {
                      id: createdUser.clerk_id,
                      // Add any other required default fields here
                    },
                  ])
                if (profileError) {
                  console.error("Error creating professional profile for provider:", profileError)
                  toast({
                    title: 'Professional Profile Creation Error',
                    description: profileError.message || 'Failed to create provider profile',
                    variant: 'destructive',
                  })
                } else {
                  console.log("Professional profile created for provider", createdUser.id)
                }
              } catch (profileCatchError: any) {
                console.error("Exception creating professional profile for provider:", profileCatchError)
                toast({
                  title: 'Professional Profile Creation Exception',
                  description: profileCatchError.message || 'Failed to create provider profile',
                  variant: 'destructive',
                })
              }
            }
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
        if (existingUser && !existingUser.is_active) {
          console.log("Debug - User account is suspended:", existingUser)
          toast({
            title: "Account Suspended",
            description: "Your account has been suspended. Please contact support.",
            variant: "destructive",
          })
          setUserData(null)
          session?.setUser(null)
          setIsFetching(false)
          return
        }

        console.log("Debug - Existing user found:", existingUser)
        if (existingUser) {
          setUserData(existingUser)
          session?.setUser({
            id: existingUser.clerk_id,
            name: existingUser.name,
            email: existingUser.email,
            image: clerkUser?.imageUrl,
            role: existingUser.role || 'seeker', // Default to seeker if null
            balance: existingUser.balance,
            is_active: existingUser.is_active,
          })
          // Ensure loading is set to false after user data is loaded
          setLoading(false)
        }

      }
    } catch (error: any) {
      console.error("Debug - Error in fetchUserData:", error)
      setError(error.message || "Failed to fetch user data")
      setLoading(false)
    } finally {
      setIsFetching(false)
    }
  }, [clerkUser, isLoaded, isSignedIn, session, toast])

  useEffect(() => {
    // Only fetch if we don't have user data yet and clerk is loaded
    if (!userData && isLoaded) {
      // Add a small delay to prevent rapid consecutive calls
      const timer = setTimeout(() => {
        fetchUserData()
      }, 300)
      
      return () => clearTimeout(timer)
    } else if (userData && loading) {
      // If we have user data but loading is still true, set it to false
      setLoading(false)
    }
  }, [fetchUserData, isLoaded, isSignedIn, clerkUser?.id, userData, loading])

  return { userData, loading: loading || !isLoaded, isLoaded, isSignedIn, error, stats, recommendedProfessionals }
}
