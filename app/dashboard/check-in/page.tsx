"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { QrCode, Camera, UserCheck, CheckCircle2, AlertCircle, Printer } from "lucide-react"
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

export default function CheckInPage() {
  const [badgeId, setBadgeId] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showBadgeDialog, setShowBadgeDialog] = useState(false)

  useEffect(() => {
    // Fetch events
    async function fetchEvents() {
      try {
        const { data, error } = await supabase.from("events").select("*")
        if (error) throw error
        setEvents(data || [])
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }

    fetchEvents()
  }, [])

  const getEventName = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    return event ? event.name : "Unknown Event"
  }

  const handleManualCheckIn = async () => {
    if (!badgeId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a badge ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // First, find the guest by badge ID
      const { data, error } = await supabase.from("guests").select("*").eq("badge_id", badgeId).single()

      if (error) {
        // Try finding by ID instead
        const { data: guestData, error: guestError } = await supabase
          .from("guests")
          .select("*")
          .eq("id", badgeId)
          .single()

        if (guestError) throw guestError

        if (guestData) {
          setGuest(guestData)
          setIsCheckedIn(!!guestData.check_in_time)
        }
      } else if (data) {
        setGuest(data)
        setIsCheckedIn(!!data.check_in_time)
      } else {
        toast({
          title: "Guest not found",
          description: "No guest found with this badge ID",
          variant: "destructive",
        })
        return
      }
    } catch (error) {
      console.error("Error finding guest:", error)
      toast({
        title: "Error",
        description: "Failed to find guest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!guest) return

    try {
      // Check if already checked in
      if (guest.check_in_time) {
        toast({
          title: "Already checked in",
          description: `${guest.first_name} ${guest.last_name} has already checked in at ${new Date(guest.check_in_time).toLocaleString()}`,
        })
        return
      }

      // Perform check-in
      const { error: updateError } = await supabase
        .from("guests")
        .update({ check_in_time: new Date().toISOString() })
        .eq("id", guest.id)

      if (updateError) throw updateError

      // Add to check_ins table
      const { error: checkInError } = await supabase.from("check_ins").insert([
        {
          guest_id: guest.id,
          event_id: guest.event_id,
          check_in_by: "current-user-id", // Replace with actual user ID
          location: "Main Entrance",
        },
      ])

      if (checkInError) throw checkInError

      // Update local state
      setGuest({ ...guest, check_in_time: new Date().toISOString() })
      setIsCheckedIn(true)

      toast({
        title: "Check-in successful",
        description: `${guest.first_name} ${guest.last_name} has been checked in`,
      })
    } catch (error) {
      console.error("Error checking in guest:", error)
      toast({
        title: "Check-in failed",
        description: "There was an error checking in the guest",
        variant: "destructive",
      })
    }
  }

  const handlePrintBadge = async () => {
    if (!guest) return

    try {
      // Update badge_printed status in database
      const { error } = await supabase.from("guests").update({ badge_printed: true }).eq("id", guest.id)

      if (error) throw error

      // Update local state
      setGuest({ ...guest, badge_printed: true })

      toast({
        title: "Badge printed",
        description: `Badge for ${guest.first_name} ${guest.last_name} has been printed`,
      })

      setShowBadgeDialog(false)
    } catch (error) {
      console.error("Error updating badge status:", error)
      toast({
        title: "Error",
        description: "Failed to update badge status",
        variant: "destructive",
      })
    }
  }

  const startScanner = () => {
    setIsScanning(true)
    // In a real app, you would initialize a QR code scanner here
    // For this example, we'll simulate a scan after 3 seconds
    setTimeout(() => {
      const mockBadgeId = "1-" + Date.now()
      setBadgeId(mockBadgeId)
      setIsScanning(false)

      toast({
        title: "Badge scanned",
        description: `Badge ID: ${mockBadgeId}`,
      })

      // Automatically trigger check-in with the scanned badge
      handleManualCheckIn()
    }, 3000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="page-header">
          <h1 className="page-title">Check-in</h1>
          <p className="page-description">Scan badges or enter badge IDs to check in guests.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="dashboard-card overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Scan Badge</CardTitle>
              <CardDescription>Use the camera to scan a guest's badge QR code.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="aspect-video bg-muted/50 rounded-xl flex items-center justify-center border border-dashed">
                {isScanning ? (
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse text-primary" />
                    <p>Scanning...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Camera preview will appear here</p>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={startScanner} disabled={isScanning}>
                {isScanning ? "Scanning..." : "Start Scanner"}
              </Button>
            </CardContent>
          </Card>

          <Card className="dashboard-card overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Manual Check-in</CardTitle>
              <CardDescription>Enter a badge ID manually to check in a guest.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter badge ID"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <Button className="w-full" onClick={handleManualCheckIn} disabled={!badgeId.trim() || isLoading}>
                {isLoading ? (
                  "Searching..."
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" /> Find Guest
                  </>
                )}
              </Button>

              {guest && (
                <Card className="mt-4 border-0 shadow-none bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                      {isCheckedIn ? (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-lg">
                          {guest.first_name} {guest.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{guest.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Company:</span>
                        <span>{guest.company || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Event:</span>
                        <span>{getEventName(guest.event_id)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span className={isCheckedIn ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                          {isCheckedIn ? "Checked In" : "Not Checked In"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Badge:</span>
                        <span
                          className={guest.badge_printed ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}
                        >
                          {guest.badge_printed ? "Printed" : "Not Printed"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {!isCheckedIn && (
                        <Button className="flex-1" onClick={handleCheckIn}>
                          <UserCheck className="mr-2 h-4 w-4" /> Check In
                        </Button>
                      )}

                      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
                        <DialogTrigger asChild>
                          <Button variant={guest.badge_printed ? "outline" : "default"} className="flex-1">
                            <Printer className="mr-2 h-4 w-4" /> Print Badge
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Print Badge</DialogTitle>
                            <DialogDescription>
                              Print a badge for {guest.first_name} {guest.last_name}.
                            </DialogDescription>
                          </DialogHeader>
                          <BadgeGenerator
                            guest={guest}
                            eventName={getEventName(guest.event_id)}
                            onPrint={handlePrintBadge}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
