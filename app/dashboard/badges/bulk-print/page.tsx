"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import type { Guest, Event } from "@/lib/types"
import { ArrowLeft, Printer, Search, Filter, Download } from "lucide-react"

export default function BulkPrintPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("standard")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrinting, setIsPrinting] = useState(false)

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

  // Filter guests by event and search query
  const filteredGuests = guests.filter((guest) => {
    const matchesEvent = selectedEvent === "all" || guest.event_id === selectedEvent
    const fullName = `${guest.first_name} ${guest.last_name}`.toLowerCase()
    const email = guest.email.toLowerCase()
    const company = (guest.company || "").toLowerCase()
    const query = searchQuery.toLowerCase()

    const matchesSearch = !query || fullName.includes(query) || email.includes(query) || company.includes(query)

    return matchesEvent && matchesSearch
  })

  // Get event name by ID
  const getEventName = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    return event ? event.name : "Unknown Event"
  }

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(filteredGuests.map((guest) => guest.id))
    }
    setSelectAll(!selectAll)
  }

  // Handle individual guest selection
  const handleSelectGuest = (guestId: string) => {
    if (selectedGuests.includes(guestId)) {
      setSelectedGuests(selectedGuests.filter((id) => id !== guestId))
      setSelectAll(false)
    } else {
      setSelectedGuests([...selectedGuests, guestId])
      if (selectedGuests.length + 1 === filteredGuests.length) {
        setSelectAll(true)
      }
    }
  }

  // Handle bulk print
  const handleBulkPrint = async () => {
    if (selectedGuests.length === 0) {
      toast({
        title: "No guests selected",
        description: "Please select at least one guest to print badges.",
        variant: "destructive",
      })
      return
    }

    setIsPrinting(true)

    try {
      // Update badge_printed status for selected guests
      const { error } = await supabase.from("guests").update({ badge_printed: true }).in("id", selectedGuests)

      if (error) throw error

      // Update local state
      setGuests(guests.map((guest) => (selectedGuests.includes(guest.id) ? { ...guest, badge_printed: true } : guest)))

      toast({
        title: "Badges printed successfully",
        description: `Printed ${selectedGuests.length} badge(s).`,
      })

      // Clear selection
      setSelectedGuests([])
      setSelectAll(false)
    } catch (error) {
      console.error("Error printing badges:", error)
      toast({
        title: "Error printing badges",
        description: "There was an error printing the badges. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/badges">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bulk Badge Printing</h1>
              <p className="text-muted-foreground">Print multiple badges at once</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Print Settings</CardTitle>
            <CardDescription>Configure badge printing settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Event</label>
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

              <div>
                <label className="block text-sm font-medium mb-2">Print Options</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="unprinted-only" />
                    <label htmlFor="unprinted-only" className="text-sm">
                      Show unprinted badges only
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="checked-in" />
                    <label htmlFor="checked-in" className="text-sm">
                      Include checked-in guests
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Select Guests</CardTitle>
              <CardDescription>Select guests to print badges for</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => setSelectedGuests([])}
                disabled={selectedGuests.length === 0}
              >
                Clear Selection
              </Button>
              <Button
                className="flex items-center gap-1"
                onClick={handleBulkPrint}
                disabled={selectedGuests.length === 0 || isPrinting}
              >
                <Printer className="h-4 w-4 mr-1" />
                {isPrinting ? "Printing..." : `Print ${selectedGuests.length} Badge(s)`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search guests..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Filter</span>
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="h-9">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} aria-label="Select all" />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead className="hidden md:table-cell">Event</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading guests...
                      </TableCell>
                    </TableRow>
                  ) : filteredGuests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No guests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedGuests.includes(guest.id)}
                            onCheckedChange={() => handleSelectGuest(guest.id)}
                            aria-label={`Select ${guest.first_name} ${guest.last_name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {guest.first_name} {guest.last_name}
                          </div>
                        </TableCell>
                        <TableCell>{guest.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{guest.company || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{getEventName(guest.event_id)}</TableCell>
                        <TableCell>
                          {guest.badge_printed ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Printed
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              Not Printed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
