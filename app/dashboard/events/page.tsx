"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Users, LucideLink, ExternalLink, Calendar } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase/client"
import type { Event } from "@/lib/types"
import Link from "next/link"

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: true })

        if (error) throw error

        setEvents(data || [])
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${format(start, "M/d/yyyy")} - ${format(end, "M/d/yyyy")}`
  }

  // Function to determine status badge
  const getStatusBadge = (event: Event) => {
    const now = new Date()
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)

    if (now > endDate) {
      return <span className="badge-status bg-gray-100 text-gray-800">Completed</span>
    } else if (now >= startDate && now <= endDate) {
      return <span className="badge-status badge-success">Active</span>
    } else {
      return <span className="badge-status badge-info">Upcoming</span>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">Manage your organization's events</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/dashboard/events/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first event.</p>
            <Link href="/dashboard/events/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Event
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">{event.name}</h2>
                        <div className="ml-2">
                          {event.id === "1" || event.id === "2" ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateRange(event.start_date, event.end_date)} • {event.location}
                      </div>
                      <p className="text-sm mt-2">{event.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-medium">{event.id === "1" ? "500" : event.id === "2" ? "250" : "300"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Deadline</p>
                      <p className="font-medium">
                        {event.id === "1" ? "6/2/2025" : event.id === "2" ? "7/16/2025" : "8/2/2025"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {event.id === "1" ? "2/10/2024" : event.id === "2" ? "3/1/2024" : "3/5/2024"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6">
                    <Link href={`/dashboard/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/dashboard/events/${event.id}/registrations`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> Manage Registrations
                      </Button>
                    </Link>
                    <div className="flex-1"></div>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <LucideLink className="h-4 w-4" /> Embed
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" /> Registration Page
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
