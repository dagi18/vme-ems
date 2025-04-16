import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Allow access to the setup page
    if (req.nextUrl.pathname === "/auth/setup") {
      // If there's a session and the user is trying to access the setup page, redirect to dashboard
      if (session) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }
      return res
    }

    // If there's no session and the user is trying to access a protected route
    if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/auth/signin"
      redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If there's a session and the user is trying to access auth routes or the home page
    if (session && (req.nextUrl.pathname.startsWith("/auth/signin") || req.nextUrl.pathname === "/")) {
      // Get user role for proper redirection
      const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

      if (error) {
        console.error("Error fetching user role:", error)
        // Default redirect to dashboard if role can't be determined
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }

      // Redirect based on role
      const redirectUrl = req.nextUrl.clone()

      // All roles go to the dashboard page, but we could customize this further
      redirectUrl.pathname = "/dashboard"

      return NextResponse.redirect(redirectUrl)
    }

    // Check role-based access for user management
    if (session && req.nextUrl.pathname.startsWith("/dashboard/users")) {
      try {
        // Get user role
        const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        // If there's an error or the user is not a super admin, redirect to dashboard
        if (error || userData?.role !== "super_admin") {
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = "/dashboard"
          return NextResponse.redirect(redirectUrl)
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        // If there's an error, redirect to dashboard as a fallback
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Check role-based access for admin-only pages
    if (
      session &&
      (req.nextUrl.pathname.startsWith("/dashboard/reports") || req.nextUrl.pathname.startsWith("/dashboard/settings"))
    ) {
      try {
        // Get user role
        const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        // If there's an error or the user is not an admin or super admin, redirect to dashboard
        if (error || (userData?.role !== "super_admin" && userData?.role !== "admin")) {
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = "/dashboard"
          return NextResponse.redirect(redirectUrl)
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        // If there's an error, redirect to dashboard as a fallback
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)

    // If there's an error with Supabase client, allow access to auth routes
    if (req.nextUrl.pathname.startsWith("/auth/")) {
      return res
    }

    // For other routes, redirect to sign in
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/auth/signin"
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/"],
}
