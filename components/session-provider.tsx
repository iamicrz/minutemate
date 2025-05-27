"use client"

import { useUser } from "@clerk/nextjs"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import type { Database } from "@/lib/database.types"

type User = {
  id: string
  name: string
  email: string
  image?: string
  role: "seeker" | "provider" | "admin"
  balance: number
  is_active: boolean
}

type SessionContextType = {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    if (!isLoaded) {
      setIsLoading(true)
      return
    }

    if (!clerkUser) {
      setUser(null)
      setIsLoading(false)
      return
    }

    const syncUserData = async () => {
      console.log("Debug - Starting syncUserData with:", {
        clerkUserId: clerkUser.id,
        publicMetadata: clerkUser.publicMetadata,
        emailAddresses: clerkUser.emailAddresses,
        fullName: clerkUser.fullName,
        firstName: clerkUser.firstName
      })

      try {
        console.log("Debug - Fetching user data from Supabase...")
        const { data: existingUser, error } = await supabase
          .from("users")
          .select("*")
          .eq("clerk_id", clerkUser.id)
          .single()

        if (error) {
          console.error("Debug - Error fetching user:", error)
          
          if (error.code === "PGRST116") {
            console.log("Debug - User doesn't exist in Supabase, creating new user...")
            const newUser = {
              clerk_id: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress || "",
              name: clerkUser.fullName || clerkUser.firstName || "User",
              role: "seeker" as const,
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

            if (createdUser && isMounted) {
              console.log("Debug - New user created successfully:", createdUser)
              setUser({
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
        } else if (existingUser && isMounted) {
          console.log("Debug - Existing user found:", existingUser)
          setUser({
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            image: clerkUser.imageUrl,
            role: existingUser.role,
            balance: existingUser.balance,
            is_active: existingUser.is_active,
          })
        }
      } catch (error: any) {
        console.error("Debug - Error in syncUserData:", {
          name: error.name,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          stack: error.stack
        })
        toast({
          title: "Error",
          description: "Failed to sync user data. Please try refreshing the page.",
          variant: "destructive",
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    syncUserData()

    return () => {
      isMounted = false
    }
  }, [clerkUser, isLoaded, toast])

  return (
    <SessionContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

export { SessionContext }
