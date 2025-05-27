import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";

async function validateRequest(req: Request) {
  const headersList = await headers();
  const webhook_secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhook_secret) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers as a plain object
  const reqHeaders = {
    "svix-id": headersList.get("svix-id"),
    "svix-timestamp": headersList.get("svix-timestamp"),
    "svix-signature": headersList.get("svix-signature"),
  };

  // If there are no headers, error out
  if (!reqHeaders["svix-id"] || !reqHeaders["svix-timestamp"] || !reqHeaders["svix-signature"]) {
    throw new Error('No svix headers');
  }

  return reqHeaders;
}

export async function POST(req: Request) {
  try {
    const validatedHeaders = await validateRequest(req);
    console.log('Validated headers:', validatedHeaders);
    
    const payload = await req.json();
    console.log('Webhook received:', payload);
    
    if (payload.type === "user.created") {
      const { id, email_addresses, unsafe_metadata } = payload.data;
      const role = unsafe_metadata?.role as "seeker" | "provider" | "admin" | undefined;
      const primaryEmail = email_addresses?.[0]?.email_address;

      console.log('Processing new user:', { id, email: primaryEmail, role });

      // Create new user record
      const { error: insertError } = await supabase
        .from("users")
        .insert([
          {
            clerk_id: id,
            email: primaryEmail,
            role: role || null, // Allow null role initially
          }
        ]);

      if (insertError) {
        console.error("Error creating user in Supabase:", insertError);
        return new Response("Error creating user", { status: 500 });
      }
    } else if (payload.type === "user.updated") {
      const { id, public_metadata } = payload.data;
      const role = public_metadata?.role as "seeker" | "provider" | "admin" | undefined;

      console.log('Processing user update:', { id, role });

      if (role) {
        const { error } = await supabase
          .from("users")
          .update({ role })
          .eq("clerk_id", id);

        if (error) {
          console.error("Error syncing role to Supabase:", error);
          return new Response("Error syncing role", { status: 500 });
        }

        console.log('Role synced successfully:', { id, role });
      }
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error('Error in webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400 }
    );
  }
} 