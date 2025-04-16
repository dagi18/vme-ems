"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { BadgeGenerator } from "@/components/badge-generator"
import type { Guest } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"
import { Plus, Search, MoreHorizontal, Printer, QrCode, UserCheck, Filter, Download } from "lucide-react"

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock event data - in a real app, you would fetch this from the database
  const events = {
    "1": "Annual Marketing Conference",
    "2": "Product Launch",
    "3": "Tech Summit",
  }

  useEffect(() => {
    async function fetchGuests() {
      try {
        const { data, error } = await supabase.from("guests").select("*")

        if (error) throw error

        setGuests(data || [])
      } catch (error) {
        console.error("Error fetching guests:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGuests()
  }, [])

  const filteredGuests = guests.filter((guest) => {
    const fullName = `${guest.first_name} ${guest.last_name}`.toLowerCase()
    const email = guest.email.toLowerCase()
    const company = (guest.company || "").toLowerCase()
    const query = searchQuery.toLowerCase()

    return fullName.includes(query) || email.includes(query) || company.includes(query)
  })

  const handleCheckIn = async (guestId: string) => {
    try {
      const { data, error } = await supabase
        .from("guests")
        .update({ check_in_time: new Date().toISOString() })
        .eq("id", guestId)
        .select()

      if (error) throw error

      // Update the local state
      setGuests(
        guests.map((guest) => (guest.id === guestId ? { ...guest, check_in_time: new Date().toISOString() } : guest)),
      )
    } catch (error) {
      console.error("Error checking in guest:", error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="page-title">Guests</h1>
            <p className="page-description">Manage event guests and registrations.</p>
          </div>
          <div className="mt-4 flex space-x-2 md:mt-0">
            <Link href="/dashboard/guests/register">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Register Guest
              </Button>
            </Link>
          </div>
        </div>

        <Card className="dashboard-card">
          <div className="p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
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

            <div className="mt-6 rounded-md border">
              <Table className="data-table">
                <TableHeader className="data-table-header">
                  <TableRow>
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead className="hidden md:table-cell">Event</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="font-medium">
                          {guest.first_name} {guest.last_name}
                        </TableCell>
                        <TableCell>{guest.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{guest.company || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {events[guest.event_id as keyof typeof events] || "Unknown Event"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {guest.check_in_time ? (
                            <span className="badge-status badge-success">Checked In</span>
                          ) : guest.badge_printed ? (
                            <span className="badge-status badge-info">Badge Printed</span>
                          ) : (
                            <span className="badge-status badge-warning">Registered</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault()
                                      setSelectedGuest(guest)
                                    }}
                                  >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Badge
                                  </DropdownMenuItem>
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
                                      eventName={events[selectedGuest.event_id as keyof typeof events] || "Event"}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              <DropdownMenuItem onSelect={() => handleCheckIn(guest.id)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Check In
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <QrCode className="mr-2 h-4 w-4" />
                                Scan Badge
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
