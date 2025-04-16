"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Tag, PlusCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Guest, Event } from "@/lib/types"
import { BadgeGenerator } from "@/components/badge-generator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function BadgesPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("standard")
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase.from("events").select("*")
        if (eventsError) throw eventsError

        // Fetch guests
        const { data: guestsData, error: guestsError } = await supabase.from("guests").select("*")
        if (guestsError) throw guestsError

        setEvents(eventsData || [])
        setGuests(guestsData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter guests by selected event
  const filteredGuests = selectedEvent === "all" ? guests : guests.filter((guest) => guest.event_id === selectedEvent)

  // Get event name by ID
  const getEventName = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    return event ? event.name : "Unknown Event"
  }

  // Handle badge printing
  const handlePrintBadge = async (guest: Guest) => {
    try {
      // Update badge_printed status in database
      const { error } = await supabase.from("guests").update({ badge_printed: true }).eq("id", guest.id)

      if (error) throw error

      // Update local state
      setGuests(guests.map((g) => (g.id === guest.id ? { ...g, badge_printed: true } : g)))
    } catch (error) {
      console.error("Error updating badge status:", error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-700">Badge Printing</h1>
            <p className="text-muted-foreground">Design and print badges for event attendees</p>
          </div>
          <div className="mt-4 flex space-x-2 md:mt-0">
            <Link href="/dashboard/badges/templates">
              <Button variant="outline" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Badge Templates
              </Button>
            </Link>
            <Link href="/dashboard/badges/bulk-print">
              <Button className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Bulk Print
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Print Badges</CardTitle>
              <CardDescription>Print badges for event attendees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Event</label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Badge Template</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Standard Badge (Default)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Badge (Default)</SelectItem>
                      <SelectItem value="vip">VIP Badge</SelectItem>
                      <SelectItem value="staff">Staff Badge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">NAME</TableHead>
                      <TableHead>EVENT</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Loading attendees...
                        </TableCell>
                      </TableRow>
                    ) : filteredGuests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          No attendees found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGuests.slice(0, 5).map((guest) => (
                        <TableRow key={guest.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {guest.first_name} {guest.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">{guest.company || "N/A"}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getEventName(guest.event_id)}</TableCell>
                          <TableCell>
                            {guest.badge_printed ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Printed
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                Not Printed
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  onClick={() => setSelectedGuest(guest)}
                                >
                                  <Printer className="h-4 w-4" /> Print Badge
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Print Badge</DialogTitle>
                                  <DialogDescription>
                                    Print a badge for {guest.first_name} {guest.last_name}.
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedGuest && (
                                  <BadgeGenerator
                                    guest={selectedGuest}
                                    eventName={getEventName(selectedGuest.event_id)}
                                    onPrint={() => handlePrintBadge(selectedGuest)}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredGuests.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/dashboard/badges/bulk-print">
                    <Button variant="outline">View All Guests</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badge Templates</CardTitle>
              <CardDescription>Manage your badge templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Standard Badge</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Default</span>
                  </div>
                  <div className="aspect-[1.6/1] bg-muted rounded-md flex items-center justify-center mb-4">
                    <p className="text-sm text-muted-foreground">Standard Badge Preview</p>
                  </div>
                  <Link href="/dashboard/badges/templates">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit Template
                    </Button>
                  </Link>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">VIP Badge</h3>
                  <div className="aspect-[1.6/1] bg-muted rounded-md flex items-center justify-center mb-4">
                    <p className="text-sm text-muted-foreground">VIP Badge Preview</p>
                  </div>
                  <Link href="/dashboard/badges/templates">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit Template
                    </Button>
                  </Link>
                </div>

                <Link href="/dashboard/badges/templates">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-16">
                    <PlusCircle className="h-5 w-5" />
                    <span>Create New Template</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
