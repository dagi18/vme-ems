"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { supabase } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"
import { BadgeGenerator } from "@/components/badge-generator"
import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, PhoneIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  event_id: z.string({
    required_error: "Please select an event.",
  }),
  first_name: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  last_name: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(1, {
    message: "Phone number is required.",
  }),
  company: z.string().optional(),
  job_title: z.string().optional(),
  print_badge: z.boolean().default(true),
})

export default function OnSiteRegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([])
  const [registeredGuest, setRegisteredGuest] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)

  useEffect(() => {
    // Fetch events from Supabase
    async function fetchEvents() {
      try {
        const { data, error } = await supabase.from("events").select("id, name")
        if (error) throw error
        setEvents(data || [])
      } catch (error) {
        console.error("Error fetching events:", error)
        // Fallback to sample events if fetch fails
        setEvents([
          { id: "123e4567-e89b-12d3-a456-426614174000", name: "Annual Marketing Conference" },
          { id: "223e4567-e89b-12d3-a456-426614174000", name: "Product Launch" },
          { id: "323e4567-e89b-12d3-a456-426614174000", name: "Tech Summit" },
        ])
      }
    }

    fetchEvents()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      job_title: "",
      print_badge: true,
    },
  })

  // Function to check if phone number already exists
  async function checkPhoneExists(phone: string, eventId: string): Promise<boolean> {
    if (!phone || !eventId) return false

    try {
      const { data, error } = await supabase
        .from("guests")
        .select("id")
        .eq("phone", phone)
        .eq("event_id", eventId)
        .limit(1)

      if (error) {
        console.error("Error checking phone number:", error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error("Error checking phone number:", error)
      return false
    }
  }

  // Real-time phone validation
  const validatePhoneNumber = async (phone: string) => {
    const eventId = form.getValues("event_id")
    if (!phone || !eventId) {
      setPhoneError(null)
      return
    }

    setIsCheckingPhone(true)
    try {
      const exists = await checkPhoneExists(phone, eventId)
      if (exists) {
        setPhoneError("This phone number is already registered for this event")
      } else {
        setPhoneError(null)
      }
    } catch (error) {
      console.error("Error validating phone:", error)
    } finally {
      setIsCheckingPhone(false)
    }
  }

  // Watch for event_id and phone changes to trigger validation
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "phone" || name === "event_id") {
        const phone = value.phone as string
        const eventId = value.event_id as string

        if (phone && eventId) {
          validatePhoneNumber(phone)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form.watch])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Check for phone error before submitting
    if (phoneError) {
      toast({
        title: "Registration Error",
        description: phoneError,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Double-check if phone number already exists for this event
      const phoneExists = await checkPhoneExists(values.phone, values.event_id)

      if (phoneExists) {
        setPhoneError("This phone number is already registered for this event")
        toast({
          title: "Phone number already registered",
          description: "This phone number is already registered for this event. Please use a different phone number.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Generate a unique ID for the guest
      const guestId = uuidv4()

      // Generate a unique badge ID
      const badgeId = `${values.event_id.substring(0, 8)}-${Date.now()}`

      // Find the selected event
      const event = events.find((e) => e.id === values.event_id)
      setSelectedEvent(event || null)

      // Add registration_type as 'on-site'
      const guestData = {
        id: guestId,
        ...values,
        registration_type: "on-site",
        badge_printed: values.print_badge,
        badge_id: badgeId,
        registered_by: "current-user-id", // Replace with actual user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Remove print_badge as it's not in the database schema
      const { print_badge, ...dataToInsert } = guestData

      const { data, error } = await supabase.from("guests").insert([dataToInsert]).select()

      if (error) throw error

      toast({
        title: "Registration successful!",
        description: "Guest has been registered for the event.",
      })

      // Set the registered guest for badge display
      setRegisteredGuest({
        ...dataToInsert,
        event_name: event?.name || "Event",
      })

      if (!values.print_badge) {
        // Reset form if not printing badge
        form.reset()
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Registration failed",
        description: "There was an error registering the guest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset the form and clear the registered guest
  const handleResetForm = () => {
    setRegisteredGuest(null)
    setPhoneError(null)
    form.reset()
  }

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">On-site Registration</h1>
          <p className="text-muted-foreground">Register a guest on-site and print their badge.</p>
        </div>

        {registeredGuest ? (
          <div className="grid gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-center mb-6">Guest Registered Successfully</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Guest Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Name:</div>
                      <div>
                        {registeredGuest.first_name} {registeredGuest.last_name}
                      </div>

                      <div className="text-muted-foreground">Email:</div>
                      <div>{registeredGuest.email}</div>

                      <div className="text-muted-foreground">Phone:</div>
                      <div>{registeredGuest.phone}</div>

                      <div className="text-muted-foreground">Badge ID:</div>
                      <div className="font-mono">{registeredGuest.badge_id}</div>

                      <div className="text-muted-foreground">Event:</div>
                      <div>{registeredGuest.event_name}</div>

                      {registeredGuest.company && (
                        <>
                          <div className="text-muted-foreground">Company:</div>
                          <div>{registeredGuest.company}</div>
                        </>
                      )}

                      {registeredGuest.job_title && (
                        <>
                          <div className="text-muted-foreground">Job Title:</div>
                          <div>{registeredGuest.job_title}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleResetForm} className="w-full">
                    Register Another Guest
                  </Button>
                </div>

                <div>
                  <BadgeGenerator
                    guest={registeredGuest}
                    eventName={registeredGuest.event_name}
                    onPrint={handleResetForm}
                  />
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="event_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an event" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {events.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                  {event.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="(123) 456-7890"
                                {...field}
                                className={phoneError ? "border-red-500 focus:border-red-500 pl-10" : "pl-10"}
                                onChange={(e) => {
                                  field.onChange(e)
                                  // Clear error when user starts typing again
                                  if (phoneError) setPhoneError(null)
                                }}
                                onBlur={(e) => {
                                  field.onBlur()
                                  if (e.target.value) validatePhoneNumber(e.target.value)
                                }}
                              />
                              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          {phoneError && (
                            <div className="mt-2 animate-fadeIn">
                              <Alert variant="destructive" className="py-3 border-red-500 bg-red-50">
                                <AlertCircle className="h-4 w-4" />
                                <div className="ml-2">
                                  <AlertTitle className="text-sm font-medium">
                                    Phone number already registered
                                  </AlertTitle>
                                  <AlertDescription className="text-xs mt-1">
                                    This phone number is already registered for this event. Please use a different phone
                                    number or contact support if you need assistance.
                                  </AlertDescription>
                                </div>
                              </Alert>
                            </div>
                          )}
                          {isCheckingPhone && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                              <span className="inline-block h-2 w-2 mr-1 bg-blue-500 rounded-full animate-pulse"></span>
                              Checking phone number...
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="job_title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Marketing Manager" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="print_badge"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Print Badge</FormLabel>
                            <FormDescription>
                              Print a badge for this guest immediately after registration.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <div className="pt-6">
                      <Button type="submit" className="w-full" disabled={isSubmitting || !!phoneError}>
                        {isSubmitting ? "Registering..." : "Register Guest"}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
