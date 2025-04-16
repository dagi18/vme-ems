"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart, Download } from "lucide-react"

export default function ReportsPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("7days")

  const events = [
    { id: "1", name: "Annual Marketing Conference" },
    { id: "2", name: "Product Launch" },
    { id: "3", name: "Tech Summit" },
  ]

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">View analytics and reports for your events.</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select event" />
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
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,284</div>
              <p className="text-xs text-muted-foreground">+12% from previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">76%</div>
              <p className="text-xs text-muted-foreground">+5% from previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Self-Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">62%</div>
              <p className="text-xs text-muted-foreground">+8% from previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-site Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">38%</div>
              <p className="text-xs text-muted-foreground">-8% from previous period</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Over Time</CardTitle>
                <CardDescription>Number of check-ins per day</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <LineChart className="h-16 w-16 text-muted-foreground" />
                <div className="ml-4 text-muted-foreground">Chart visualization would appear here</div>
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Check-in Times</CardTitle>
                  <CardDescription>Distribution of check-in times throughout the day</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <BarChart className="h-16 w-16 text-muted-foreground" />
                  <div className="ml-4 text-muted-foreground">Chart visualization would appear here</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Attendance by Event</CardTitle>
                  <CardDescription>Percentage of attendance for each event</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground" />
                  <div className="ml-4 text-muted-foreground">Chart visualization would appear here</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="registration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registration Over Time</CardTitle>
                <CardDescription>Number of registrations per day</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <LineChart className="h-16 w-16 text-muted-foreground" />
                <div className="ml-4 text-muted-foreground">Chart visualization would appear here</div>
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Registration Type</CardTitle>
                  <CardDescription>Self vs. on-site registration</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground" />
                  <div className="ml-4 text-muted-foreground">Chart visualization would appear here</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Registration by Event</CardTitle>
                  <CardDescription>Number of registrations for each event</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <BarChart className="h-16 w-16 text-muted-foreground" />
                  <div className="ml-4 text-muted-foreground">Chart visualization would appear here</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="demographics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Companies</CardTitle>
                  <CardDescription>Top companies by attendance</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <BarChart className="h-16 w-16 text-muted-foreground" />
                  <div className="ml-4 text-muted-foreground">Chart visualization would appear here</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Job Titles</CardTitle>
                  <CardDescription>Distribution of attendees by job title</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground" />
                  <div className="ml-4 text-muted-foreground">Chart visualization would appear here</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
