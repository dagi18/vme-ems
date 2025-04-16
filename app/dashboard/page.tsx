import { Suspense } from "react"
import type { Metadata } from "next"
import { CalendarDays, CheckCircle, Clock, Users, Shield, Settings } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getServerUserRole } from "@/lib/auth-utils"
import { createServerSupabaseClient } from "@/lib/supabase/auth"
import { RegistrationAnalytics } from "@/components/registration-analytics"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Dashboard | Validity Events",
  description: "Event management dashboard for Validity Events",
}

export default async function DashboardPage() {
  // Get user role and information
  const { role, firstName, lastName, userId } = await getServerUserRole()

  // Get stats from Supabase
  const supabase = createServerSupabaseClient()

  // Get total events
  const { data: eventsData, error: eventsError } = await supabase.from("events").select("id", { count: "exact" })

  // Get total guests
  const { data: guestsData, error: guestsError } = await supabase.from("guests").select("id", { count: "exact" })

  // Get total checked-in guests
  const { data: checkedInData, error: checkedInError } = await supabase
    .from("guests")
    .select("id", { count: "exact" })
    .not("check_in_time", "is", null)

  // Get upcoming events (events with start_date > now)
  const { data: upcomingEventsData, error: upcomingEventsError } = await supabase
    .from("events")
    .select("id", { count: "exact" })
    .gt("start_date", new Date().toISOString())

  // Get users count (admin only)
  let usersCount = 0
  if (role === "super_admin" || role === "admin") {
    const { count: usersData, error: usersError } = await supabase.from("users").select("id", { count: "exact" })

    if (!usersError) {
      usersCount = usersData || 0
    }
  }

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const totalEvents = eventsError ? 0 : eventsData?.length || 0
  const totalGuests = guestsError ? 0 : guestsData?.length || 0
  const totalCheckedIn = checkedInError ? 0 : checkedInData?.length || 0
  const upcomingEvents = upcomingEventsError ? 0 : upcomingEventsData?.length || 0

  // Calculate check-in rate
  const checkInRate = totalGuests > 0 ? Math.round((totalCheckedIn / totalGuests) * 100) : 0

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {role === "super_admin" ? "Super Admin Dashboard" : role === "admin" ? "Admin Dashboard" : "Dashboard"}
        </h2>
      </div>

      {/* Role-specific welcome message */}
      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium">
          Welcome, {firstName} {lastName}
          {role === "super_admin" && " (Super Admin)"}
          {role === "admin" && " (Admin)"}
          {role === "staff" && " (Staff)"}
        </h3>
        <p className="text-muted-foreground mt-1">
          {role === "super_admin"
            ? "You have full access to all features, including user management."
            : role === "admin"
              ? "You have access to manage events, guests, and reports."
              : "You have access to manage events and guests."}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {(role === "super_admin" || role === "admin") && <TabsTrigger value="admin">Admin View</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalEvents)}</div>
                <p className="text-xs text-muted-foreground">{upcomingEvents} upcoming</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalGuests)}</div>
                <p className="text-xs text-muted-foreground">Across all events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{checkInRate}%</div>
                <p className="text-xs text-muted-foreground">{formatNumber(totalCheckedIn)} checked in</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {role === "super_admin" ? "User Accounts" : "Upcoming Events"}
                </CardTitle>
                {role === "super_admin" ? (
                  <Users className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {role === "super_admin" ? formatNumber(usersCount) : formatNumber(upcomingEvents)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {role === "super_admin" ? "Total user accounts" : "Events in the future"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Recent events list would go here */}
                <p className="text-sm text-muted-foreground">Recent events will be displayed here.</p>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Role-specific quick actions */}
                {role === "super_admin" && (
                  <Link href="/dashboard/users">
                    <div className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      <span className="text-sm">Manage Users</span>
                    </div>
                  </Link>
                )}
                <Link href="/dashboard/events/create">
                  <div className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span className="text-sm">Create New Event</span>
                  </div>
                </Link>
                <Link href="/dashboard/guests/register">
                  <div className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span className="text-sm">Register Guest</span>
                  </div>
                </Link>
                <Link href="/dashboard/check-in">
                  <div className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span className="text-sm">Check-in Guests</span>
                  </div>
                </Link>
                {(role === "super_admin" || role === "admin") && (
                  <Link href="/dashboard/reports">
                    <div className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span className="text-sm">System Settings</span>
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Analytics</CardTitle>
              <CardDescription>Guest registration trends over time</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Suspense fallback={<div>Loading analytics...</div>}>
                <RegistrationAnalytics eventId="all" />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {(role === "super_admin" || role === "admin") && (
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Overview</CardTitle>
                <CardDescription>
                  {role === "super_admin" ? "Super admin privileged information" : "Admin privileged information"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {role === "super_admin" && (
                    <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                      <h4 className="font-medium text-amber-800">Super Admin Access</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        You have super admin privileges. You can manage all aspects of the system, including user
                        accounts.
                      </p>
                      <div className="mt-4">
                        <Link href="/dashboard/users">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200 hover:text-amber-900"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Users
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {role === "admin" && (
                    <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                      <h4 className="font-medium text-blue-800">Admin Access</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        You have admin privileges. You can manage events, guests, and view reports.
                      </p>
                      <div className="mt-4">
                        <Link href="/dashboard/reports">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200 hover:text-blue-900"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            View Reports
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-md bg-muted p-4">
                      <h4 className="font-medium">System Status</h4>
                      <p className="text-sm text-muted-foreground mt-1">All systems operational</p>
                    </div>

                    <div className="rounded-md bg-muted p-4">
                      <h4 className="font-medium">Last Login</h4>
                      <p className="text-sm text-muted-foreground mt-1">Today at {new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
