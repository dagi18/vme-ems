import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Make sure we're using the correct environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Create a singleton pattern for the Supabase client
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Please check your environment variables.")

    // In development, provide more helpful error messages
    if (process.env.NODE_ENV === "development") {
      console.log("Expected environment variables:")
      console.log("- NEXT_PUBLIC_SUPABASE_URL")
      console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }

    throw new Error("Supabase configuration is incomplete. Check console for details.")
  }

  // Initialize the client only once
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return supabaseInstance
}

// Export the supabase client for backward compatibility
export const supabase = isBrowser && supabaseUrl && supabaseAnonKey ? getSupabaseClient() : null

// Subscribe to real-time changes
export function subscribeToGuests(eventId: string | null, callback: (payload: any) => void) {
  const client = getSupabaseClient()

  const channel = client
    .channel("guests-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "guests",
        filter: eventId ? `event_id=eq.${eventId}` : undefined,
      },
      callback,
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

// Subscribe to real-time changes for check-ins
export function subscribeToCheckIns(eventId: string | null, callback: (payload: any) => void) {
  const client = getSupabaseClient()

  const channel = client
    .channel("check-ins-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "check_ins",
        filter: eventId ? `event_id=eq.${eventId}` : undefined,
      },
      callback,
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}
