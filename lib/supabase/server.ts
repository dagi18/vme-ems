import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export function createServerClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Please check your environment variables.")

    // In development, provide more helpful error messages
    if (process.env.NODE_ENV === "development") {
      console.log("Expected environment variables:")
      console.log("- SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
      console.log("- SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }

    throw new Error("Supabase configuration is incomplete. Check console for details.")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
