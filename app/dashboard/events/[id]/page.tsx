"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase/client"
import type { Event, Guest } from "@/lib/types"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Download,
  Share2,
  ArrowLeft,
  CheckSquare,
  Tag,
  BarChart,
} from "lucide-react"
import { RegistrationAnalytics } from "@/components/registration-analytics"

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [registrationProgress, setRegistrationProgress] = useState(0)

  useEffect(() => {
    async function fetchEventData() {
      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single()

        if (eventError) throw eventError

        // Fetch guests for this event
        const { data: guestsData, error: guestsError } = await supabase
          .from("guests")
          .select("*")
          .eq("event_id", eventId)

        if (guestsError) throw guestsError

        setEvent(eventData)
        setGuests(guestsData || [])

        // Calculate registration progress
        const capacity = eventData.id === "1" ? 500 : eventData.id === "2" ? 250 : 300
        const progress = Math.min(100, Math.round((guestsData.length / capacity) * 100))
        setRegistrationProgress(progress)
      } catch (error) {
        console.error("Error fetching event data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <p>Loading event details...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-8">
          <h2 className="text-xl font-bold mb-2">Event not found</h2>
          <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/dashboard/events">Back to Events</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  // Format dates
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  const formattedDateRange = `${format(startDate, "MMMM d, yyyy")} - ${format(endDate, "MMMM d, yyyy")}`

  // Calculate event statistics
  const totalGuests = guests.length
  const checkedInGuests = guests.filter((guest) => guest.check_in_time).length
  const badgesPrinted = guests.filter((guest) => guest.badge_printed).length
  const selfRegistered = guests.filter((guest) => guest.registration_type === "self").length
  const onSiteRegistered = guests.filter((guest) => guest.registration_type === "on-site").length

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/events">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formattedDateRange}</span>
                <span>•</span>
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="flex items-center gap-1">
              <Edit className="h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" className="flex items-center gap-1">
              <Share2 className="h-4 w-4" /> Share
            </Button>
            <Button variant="outline" className="flex items-center gap-1 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGuests}</div>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-muted-foreground">
                  Capacity: {event.id === "1" ? "500" : event.id === "2" ? "250" : "300"}
                </div>
                <Progress value={registrationProgress} className="h-1" />
                <div className="text-xs text-muted-foreground">{registrationProgress}% filled</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{checkedInGuests}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {totalGuests > 0 ? Math.round((checkedInGuests / totalGuests) * 100) : 0}% of registered guests
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Badges Printed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{badgesPrinted}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {totalGuests > 0 ? Math.round((badgesPrinted / totalGuests) * 100) : 0}% of registered guests
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Registration Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm font-medium">Self</div>
                  <div className="text-xl font-bold">{selfRegistered}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">On-site</div>
                  <div className="text-xl font-bold">{onSiteRegistered}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="mb-6">
            <TabsTrigger value="details" className="px-4 py-2">
              Details
            </TabsTrigger>
            <TabsTrigger value="guests" className="px-4 py-2">
              Guests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="px-4 py-2">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-4 py-2">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
                <CardDescription>Comprehensive details about this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Schedule</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Date</div>
                          <div className="text-muted-foreground">{formattedDateRange}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Time</div>
                          <div className="text-muted-foreground">9:00 AM - 5:00 PM</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Location</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">{event.location}</div>
                          <div className="text-muted-foreground">
                            123 Convention Center Way
                            <br />
                            {event.location.split(" ")[0]}, CA 94103
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Registration Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Capacity</div>
                        <div className="text-muted-foreground">
                          {event.id === "1" ? "500" : event.id === "2" ? "250" : "300"} attendees
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Registration Deadline</div>
                        <div className="text-muted-foreground">
                          {event.id === "1" ? "June 2, 2025" : event.id === "2" ? "July 16, 2025" : "August 2, 2025"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Badge Type</div>
                        <div className="text-muted-foreground">Standard</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button className="flex flex-col items-center justify-center h-24 text-center" variant="outline">
                      <Users className="h-8 w-8 mb-2" />
                      <span>Register Guest</span>
                    </Button>
                    <Button className="flex flex-col items-center justify-center h-24 text-center" variant="outline">
                      <CheckSquare className="h-8 w-8 mb-2" />
                      <span>Check-in</span>
                    </Button>
                    <Button className="flex flex-col items-center justify-center h-24 text-center" variant="outline">
                      <Tag className="h-8 w-8 mb-2" />
                      <span>Print Badges</span>
                    </Button>
                    <Button className="flex flex-col items-center justify-center h-24 text-center" variant="outline">
                      <BarChart className="h-8 w-8 mb-2" />
                      <span>View Reports</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 border-l-2 border-green-500 pl-3">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">John Smith</span> registered for the event
                        </p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-l-2 border-blue-500 pl-3">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">Sarah Johnson</span> checked in
                        </p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-l-2 border-yellow-500 pl-3">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">Admin</span> printed 25 badges
                        </p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-l-2 border-purple-500 pl-3">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">Michael Brown</span> updated event details
                        </p>
                        <p className="text-xs text-muted-foreground">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guests" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Guest List</CardTitle>
                  <CardDescription>Manage registered guests for this event</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-1">
                    <Download className="h-4 w-4" /> Export
                  </Button>
                  <Button className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> Add Guest
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left font-medium">Name</th>
                        <th className="py-3 px-4 text-left font-medium">Email</th>
                        <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Company</th>
                        <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Registration</th>
                        <th className="py-3 px-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">
                            No guests registered for this event yet.
                          </td>
                        </tr>
                      ) : (
                        guests.slice(0, 5).map((guest) => (
                          <tr key={guest.id} className="border-b">
                            <td className="py-3 px-4">
                              <div className="font-medium">
                                {guest.first_name} {guest.last_name}
                              </div>
                            </td>
                            <td className="py-3 px-4">{guest.email}</td>
                            <td className="py-3 px-4 hidden md:table-cell">{guest.company || "-"}</td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              {guest.registration_type === "self" ? "Self" : "On-site"}
                            </td>
                            <td className="py-3 px-4">
                              {guest.check_in_time ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Checked In
                                </Badge>
                              ) : guest.badge_printed ? (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  Badge Printed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                  Registered
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {guests.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/events/${eventId}/guests`}>View All Guests</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration Analytics</CardTitle>
                <CardDescription>Track registration metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationAnalytics eventId={eventId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Settings</CardTitle>
                <CardDescription>Configure event settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">General Settings</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Event Status</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Published</option>
                          <option>Draft</option>
                          <option>Archived</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Registration Access</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Public</option>
                          <option>Private (Invitation Only)</option>
                          <option>Password Protected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Registration Settings</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Registration Deadline</label>
                        <input type="date" className="w-full p-2 border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Maximum Capacity</label>
                        <input type="number" className="w-full p-2 border rounded-md" placeholder="500" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="waitlist" className="rounded" />
                      <label htmlFor="waitlist">Enable waitlist when capacity is reached</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="approval" className="rounded" />
                      <label htmlFor="approval">Require approval for registrations</label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">Badge Settings</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Default Badge Template</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Standard Badge</option>
                          <option>VIP Badge</option>
                          <option>Staff Badge</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Badge Size</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>CR80 (3.375" x 2.125")</option>
                          <option>CR79 (3.303" x 2.051")</option>
                          <option>Custom Size</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-print" className="rounded" />
                      <label htmlFor="auto-print">Automatically print badges on check-in</label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
