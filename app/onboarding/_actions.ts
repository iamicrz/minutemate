'use server'

import { clerkClient } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"

export async function updateUserRole(userId: string, role: "seeker" | "provider" | "admin") {
  console.log("Debug - Updating user role:", { userId, role })
  
  try {
    // Update Clerk metadata
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role
      }
    })
    
    // Verify Clerk update was successful
    const user = await client.users.getUser(userId)
    const updatedRole = user.publicMetadata.role
    console.log("Debug - Clerk role update result:", { updatedRole, matches: updatedRole === role })
    
    if (updatedRole !== role) {
      throw new Error("Role update in Clerk failed to persist")
    }

    // Update Supabase
    const { data: userData, error: userError } = await supabase
      .from("users")
      .update({ role })
      .eq("clerk_id", userId)
      .select()
      .single()

    if (userError) {
      console.error("Debug - Supabase update error:", userError)
      throw userError
    }

    console.log("Debug - Role update successful in both systems:", {
      clerk: updatedRole,
      supabase: userData?.role
    })

    return { success: true }
  } catch (error) {
    console.error("Debug - Error updating user role:", error)
    return { success: false, error }
  }
} 