"use client"

import { useUser } from "@clerk/nextjs"
import { useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { SessionContext } from "@/components/session-provider"
import { useToast } from "@/components/ui/use-toast"

type User = Database["public"]["Tables"]["users"]["Row"]

export function useUserData() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const session = useContext(SessionContext)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", clerkUser.id)
        .single()

      if (error) {
        console.error("Debug - Error fetching user:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })

        if (error.code === "PGRST116") {
          console.log("Debug - User doesn't exist in Supabase, creating new user...")
          const newUser = {
            clerk_id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.firstName || "User",
            role: "seeker",
            balance: 0,
            is_active: true,
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
    fetchUserData()
  }, [fetchUserData])

  return { userData, loading: loading || !isLoaded, isLoaded, isSignedIn }
}
