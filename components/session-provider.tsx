"use client"

import { useUser } from "@clerk/nextjs"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createSupabaseClientWithToken } from "@/lib/supabase"
import { useAuth } from "@clerk/nextjs" // For getToken
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

    const { getToken } = useAuth();
    const syncUserData = async () => {
      console.log("Debug - Starting syncUserData with:", {
        clerkUserId: clerkUser.id,
        publicMetadata: clerkUser.publicMetadata,
        emailAddresses: clerkUser.emailAddresses,
        fullName: clerkUser.fullName,
        firstName: clerkUser.firstName
      })
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) throw new Error("No Clerk Supabase JWT available for user sync");
        const supabase = createSupabaseClientWithToken(token);

        // Fetch user from Supabase
        const { data: existingUser, error } = await supabase
          .from("users")
          .select("*")
          .eq("clerk_id", clerkUser.id)
          .single();

        // Clerk role from publicMetadata
        let clerkRole = clerkUser.publicMetadata?.role as User["role"] | undefined;
        let supabaseRole = existingUser?.role as User["role"] | undefined;

        // If user does not exist in Supabase, create them and set Clerk role if missing
        if (error) {
          console.error("Debug - Error fetching user:", error);
          if (error.code === "PGRST116") {
            // New user: assign role
            let newRole: User["role"] = clerkRole || "seeker";
            if (!clerkRole) {
              // Set Clerk publicMetadata.role to 'seeker' if not present
              try {
                await clerkUser.update({ publicMetadata: { ...clerkUser.publicMetadata, role: newRole } });
              } catch (e) {
                console.error("Failed to update Clerk publicMetadata.role on new user", e);
              }
            }
            const newUser = {
              clerk_id: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress || "",
              name: clerkUser.fullName || clerkUser.firstName || "User",
              role: newRole,
              balance: 0,
              is_active: true,
            };
            const { data: createdUser, error: createError } = await supabase
              .from("users")
              .insert([newUser])
              .select()
              .single();
            if (createError) {
              console.error("Debug - Error creating user:", createError);
              throw createError;
            }
            if (createdUser && isMounted) {
              setUser({
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                image: clerkUser.imageUrl,
                role: createdUser.role,
                balance: createdUser.balance,
                is_active: createdUser.is_active,
              });
            }
          } else {
            throw error;
          }
        } else if (existingUser && isMounted) {
          // Existing user: ensure roles are in sync (prefer Clerk as source of truth)
          if (!clerkRole) {
            // If Clerk role is missing, set it from Supabase
            try {
              await clerkUser.update({ publicMetadata: { ...clerkUser.publicMetadata, role: supabaseRole || "seeker" } });
              clerkRole = supabaseRole || "seeker";
            } catch (e) {
              console.error("Failed to update Clerk publicMetadata.role from Supabase", e);
            }
          } else if (supabaseRole !== clerkRole) {
            // If roles differ, update Supabase to match Clerk
            const { error: updateRoleError } = await supabase
              .from("users")
              .update({ role: clerkRole })
              .eq("clerk_id", clerkUser.id);
            if (updateRoleError) {
              console.error("Failed to sync Supabase role to match Clerk", updateRoleError);
            }
          }
          setUser({
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            image: clerkUser.imageUrl,
            role: clerkRole || existingUser.role,
            balance: existingUser.balance,
            is_active: existingUser.is_active,
          });
        }
      } catch (error: any) {
        console.error("Debug - Error in syncUserData:", error);
        toast({
          title: "Error",
          description: "Failed to sync user data. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
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
