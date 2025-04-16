"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import type { Guest } from "@/lib/types"
import { format, subDays, isWithinInterval, parseISO } from "date-fns"

interface RegistrationAnalyticsProps {
  eventId: string
}

export function RegistrationAnalytics({ eventId }: RegistrationAnalyticsProps) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30days")

  useEffect(() => {
    async function fetchGuests() {
      try {
        const { data, error } = await supabase.from("guests").select("*").eq("event_id", eventId)

        if (error) throw error

        setGuests(data || [])
      } catch (error) {
        console.error("Error fetching guests:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGuests()
  }, [eventId])

  // Filter guests by date range
  const filterGuestsByDateRange = (guests: Guest[]) => {
    const now = new Date()
    let startDate: Date

    switch (dateRange) {
      case "7days":
        startDate = subDays(now, 7)
        break
      case "30days":
        startDate = subDays(now, 30)
        break
      case "90days":
        startDate = subDays(now, 90)
        break
      default:
        startDate = subDays(now, 30)
    }

    return guests.filter((guest) => {
      const createdAt = parseISO(guest.created_at)
      return isWithinInterval(createdAt, { start: startDate, end: now })
    })
  }

  const filteredGuests = filterGuestsByDateRange(guests)

  // Calculate registration data by day
  const calculateRegistrationsByDay = () => {
    const registrationsByDay: Record<string, number> = {}

    filteredGuests.forEach((guest) => {
      const date = format(parseISO(guest.created_at), "yyyy-MM-dd")
      registrationsByDay[date] = (registrationsByDay[date] || 0) + 1
    })

    // Sort by date
    return Object.entries(registrationsByDay)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, count]) => ({ date: format(parseISO(date), "MMM d"), count }))
  }

  // Calculate registration types
  const calculateRegistrationTypes = () => {
    const selfRegistered = filteredGuests.filter((guest) => guest.registration_type === "self").length
    const onSiteRegistered = filteredGuests.filter((guest) => guest.registration_type === "on-site").length

    return [
      { type: "Self", count: selfRegistered },
      { type: "On-site", count: onSiteRegistered },
    ]
  }

  // Calculate companies
  const calculateCompanies = () => {
    const companyCounts: Record<string, number> = {}

    filteredGuests.forEach((guest) => {
      const company = guest.company || "Unknown"
      companyCounts[company] = (companyCounts[company] || 0) + 1
    })

    // Sort by count (descending)
    return Object.entries(companyCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5) // Top 5
      .map(([company, count]) => ({ company, count }))
  }

  const registrationsByDay = calculateRegistrationsByDay()
  const registrationTypes = calculateRegistrationTypes()
  const topCompanies = calculateCompanies()

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-6 pt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Registrations Over Time</h3>
              <div className="h-[300px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : registrationsByDay.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No registration data available</p>
                  </div>
                ) : (
                  <div className="relative h-full">
                    <div className="absolute inset-0 flex items-end">
                      {registrationsByDay.map((day, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full max-w-[30px] bg-primary/80 rounded-t-sm mx-auto"
                            style={{
                              height: `${Math.max(15, (day.count / Math.max(...registrationsByDay.map((d) => d.count))) * 200)}px`,
                            }}
                          ></div>
                          <div className="text-xs mt-2 text-muted-foreground">{day.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Registration Types</h3>
                <div className="h-[200px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p>Loading chart data...</p>
                    </div>
                  ) : registrationTypes.every((type) => type.count === 0) ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No registration data available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 h-full">
                      {registrationTypes.map((type, index) => (
                        <div key={index} className="flex flex-col items-center justify-center">
                          <div className="text-3xl font-bold">{type.count}</div>
                          <div className="text-sm text-muted-foreground">{type.type}</div>
                          <div
                            className="mt-2 w-16 h-16 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: index === 0 ? "rgba(255, 220, 0, 0.2)" : "rgba(59, 130, 246, 0.2)",
                              color: index === 0 ? "rgb(202, 138, 4)" : "rgb(37, 99, 235)",
                            }}
                          >
                            {Math.round((type.count / filteredGuests.length) * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Registration Status</h3>
                <div className="h-[200px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p>Loading chart data...</p>
                    </div>
                  ) : filteredGuests.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No registration data available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 h-full">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold">{filteredGuests.length}</div>
                        <div className="text-sm text-muted-foreground">Registered</div>
                        <div className="mt-2 w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-800">
                          100%
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold">{filteredGuests.filter((g) => g.badge_printed).length}</div>
                        <div className="text-sm text-muted-foreground">Badges Printed</div>
                        <div className="mt-2 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-800">
                          {Math.round(
                            (filteredGuests.filter((g) => g.badge_printed).length / filteredGuests.length) * 100,
                          )}
                          %
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold">{filteredGuests.filter((g) => g.check_in_time).length}</div>
                        <div className="text-sm text-muted-foreground">Checked In</div>
                        <div className="mt-2 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-800">
                          {Math.round(
                            (filteredGuests.filter((g) => g.check_in_time).length / filteredGuests.length) * 100,
                          )}
                          %
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6 pt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Top Companies</h3>
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : topCompanies.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No company data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topCompanies.map((company, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span>{company.company}</span>
                          <span>{company.count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{
                              width: `${(company.count / Math.max(...topCompanies.map((c) => c.count))) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
