import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL")
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("Debug - Initializing Supabase client with:", {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
})

// Create a singleton instance to prevent multiple connections
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// Add retry functionality for Supabase queries
export const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.error(`Supabase query failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      
      // If this is a rate limit error or insufficient resources error, wait longer
      if (error.message?.includes('rate limit') || error.message?.includes('insufficient resources')) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      } else if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Re-throw on last attempt
      }
    }
  }
  
  throw lastError;
};

// Get or create the Supabase client
export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'minutemate-web'
        }
      }
    });
  }
  
  return supabaseInstance;
};

// Export the singleton instance
export const supabase = getSupabase();

export function createSupabaseClientWithToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

// Test the connection with retries
const testConnection = async (retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Debug - Testing Supabase connection (attempt ${i + 1}/${retries})...`)
      const { data, error } = await supabase.from('users').select('count').limit(1)
      
      if (error) {
        console.error("Debug - Connection test error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
      
      console.log("Debug - Successfully connected to Supabase")
      return true
    } catch (error: any) {
      console.error(`Debug - Attempt ${i + 1}/${retries} - Error connecting to Supabase:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      })
      
      if (i < retries - 1) {
        console.log(`Debug - Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  console.error("Debug - Failed to connect to Supabase after all retries")
  return false
}

// Initialize connection
testConnection().catch(error => {
  console.error("Debug - Fatal error testing Supabase connection:", {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    stack: error?.stack
  })
})

// Server-side client for admin operations
export const createServerSupabaseClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY")
  }
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'minutemate-server'
        }
      }
    }
  )
}
