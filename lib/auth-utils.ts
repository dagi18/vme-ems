import { createServerSupabaseClient } from "@/lib/supabase/auth"
import { supabase } from "@/lib/supabase/client"

export async function getUserRole() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (error) throw error

    return data?.role || null
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

export async function getServerUserRole() {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from("users")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .single()

    if (error) throw error

    return {
      role: data?.role || null,
      firstName: data?.first_name || null,
      lastName: data?.last_name || null,
      userId: user.id,
    }
  } catch (error) {
    console.error("Error getting server user role:", error)
    return {
      role: null,
      firstName: null,
      lastName: null,
      userId: null,
    }
  }
}

export function isSuperAdmin(role: string | null) {
  return role === "super_admin"
}

export function isAdmin(role: string | null) {
  return role === "admin" || role === "super_admin"
}

export function isStaff(role: string | null) {
  return role === "staff" || role === "admin" || role === "super_admin"
}
