"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { CheckCircle2, Download, FileText, AlertCircle, PhoneIcon } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { generateRegistrationPDF } from "@/lib/pdf-generator"
import { generateBarcodeSVG } from "@/lib/barcode-generator"
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
})

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([])
  const [registrationData, setRegistrationData] = useState<{
    guestId: string
    badgeId: string
    eventName: string
    firstName: string
    lastName: string
    email: string
    phone: string
    company?: string
    jobTitle?: string
  } | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)
  const barcodeRef = useRef<HTMLDivElement>(null)
  const barcodeImageRef = useRef<string | null>(null)

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

  // Generate barcode SVG when registration data is available
  useEffect(() => {
    if (registrationData && barcodeRef.current) {
      const barcodeSvg = generateBarcodeSVG(registrationData.guestId, {
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 5,
      })
      barcodeRef.current.innerHTML = barcodeSvg

      // Store the barcode SVG for PDF generation
      const svgElement = barcodeRef.current.querySelector("svg")
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.crossOrigin = "anonymous" // Add this to avoid CORS issues

        // Fixed: Use function declaration instead of arrow function to avoid 'this' binding issues
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              barcodeImageRef.current = canvas.toDataURL("image/png")
            }
          } catch (err) {
            console.error("Error creating barcode image:", err)
          } finally {
            URL.revokeObjectURL(url)
          }
        }

        // Fixed: Use function declaration instead of arrow function
        img.onerror = () => {
          console.error("Error loading barcode image")
          URL.revokeObjectURL(url)
        }

        img.src = url
      }
    }
  }, [registrationData])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      job_title: "",
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
  }, [form])

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

      // Add registration_type as 'self'
      const guestData = {
        id: guestId,
        ...values,
        registration_type: "self",
        badge_printed: false,
        badge_id: badgeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("guests").insert([guestData]).select()

      if (error) throw error

      // Get the event name for display
      const eventName = events.find((event) => event.id === values.event_id)?.name || "Event"

      // Set registration data for success page
      setRegistrationData({
        guestId,
        badgeId,
        eventName,
        firstName: values.first_name,
        lastName: values.last_name,
        email: values.email,
        phone: values.phone,
        company: values.company,
        jobTitle: values.job_title,
      })

      setIsSuccess(true)
      toast({
        title: "Registration successful!",
        description: "You have been registered for the event.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Registration failed",
        description: "There was an error registering for the event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to download barcode as PNG
  const downloadBarcode = () => {
    if (!registrationData || !barcodeRef.current) return

    // Create a temporary canvas element
    const canvas = document.createElement("canvas")
    const svgElement = barcodeRef.current.querySelector("svg")

    if (!svgElement) return

    const svgWidth = svgElement.width.baseVal.value
    const svgHeight = svgElement.height.baseVal.value

    canvas.width = svgWidth
    canvas.height = svgHeight

    // Convert SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    // Create an image from the SVG
    const img = new Image()
    img.crossOrigin = "anonymous" // Add this to avoid CORS issues

    // Fixed: Use function declaration instead of arrow function
    img.onload = () => {
      try {
        // Draw the image on the canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight)

        // Get the data URL from the canvas
        const dataUrl = canvas.toDataURL("image/png")

        // Create a download link
        const link = document.createElement("a")
        link.download = `badge-barcode-${registrationData.badgeId}.png`
        link.href = dataUrl
        link.click()
      } catch (err) {
        console.error("Error creating downloadable barcode:", err)
      } finally {
        // Clean up
        URL.revokeObjectURL(url)
      }
    }

    // Fixed: Use function declaration instead of arrow function
    img.onerror = () => {
      console.error("Error loading image for download")
      URL.revokeObjectURL(url)
    }

    img.src = url
  }

  // Function to download PDF confirmation
  const downloadPDF = async () => {
    if (!registrationData) return

    setIsGeneratingPDF(true)
    try {
      // Use the cached barcode image if available
      let barcodeDataUrl = barcodeImageRef.current || null

      // If we don't have a cached image but have a barcode element, try to generate one
      if (!barcodeDataUrl && barcodeRef.current) {
        const svgElement = barcodeRef.current.querySelector("svg")
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement)
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
          const url = URL.createObjectURL(svgBlob)

          try {
            // Create a promise to wait for the image to load
            const imageLoaded = new Promise<string>((resolve, reject) => {
              const img = new Image()
              img.crossOrigin = "anonymous" // Add this to avoid CORS issues

              // Fixed: Use function declaration instead of arrow function
              img.onload = () => {
                try {
                  const canvas = document.createElement("canvas")
                  canvas.width = img.width
                  canvas.height = img.height
                  const ctx = canvas.getContext("2d")
                  if (!ctx) {
                    reject(new Error("Could not get canvas context"))
                    return
                  }
                  ctx.drawImage(img, 0, 0)
                  resolve(canvas.toDataURL("image/png"))
                } catch (err) {
                  reject(new Error("Error creating image data URL"))
                } finally {
                  URL.revokeObjectURL(url)
                }
              }

              // Fixed: Use function declaration instead of arrow function
              img.onerror = () => {
                console.error("Image load error occurred")
                reject(new Error("Failed to load image"))
                URL.revokeObjectURL(url)
              }

              img.src = url
            })

            // Generate and download PDF with the barcode
            barcodeDataUrl = await imageLoaded
          } catch (error) {
            console.error("Error generating barcode image:", error)
            // Fall back to generating PDF without barcode image
            barcodeDataUrl = null
          }
        }
      }

      // Generate PDF with or without barcode image
      await generateRegistrationPDF({
        ...registrationData,
        barcodeDataUrl,
      })

      toast({
        title: "PDF Downloaded",
        description: "Your registration confirmation has been downloaded.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (isSuccess && registrationData) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="flex h-16 items-center gap-4 border-b px-4 md:px-6 bg-background">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <Image src="/images/validity-logo.png" alt="Validity Events" width={180} height={48} />
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="mx-auto max-w-md dashboard-card border-yellow-500">
            <CardHeader className="text-center pb-4 bg-yellow-500">
              <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-black" />
              </div>
              <CardTitle className="text-2xl text-black">Registration Successful!</CardTitle>
              <CardDescription className="text-black/80">
                Thank you for registering for {registrationData.eventName}. Please save your badge information.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-yellow-500 shadow-sm w-full max-w-xs mx-auto text-center">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Your Badge ID</h3>
                <p className="font-mono text-lg font-bold mb-4">{registrationData.badgeId}</p>

                <div className="mb-4">
                  <div className="mx-auto bg-white p-2 rounded-lg border border-yellow-500 inline-block">
                    <div ref={barcodeRef} id="barcode-container" className="flex justify-center"></div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Present this barcode at the event entrance to print your badge.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBarcode}
                    className="border-yellow-500 text-black hover:bg-yellow-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save Barcode
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPDF}
                    disabled={isGeneratingPDF}
                    className="border-yellow-500 text-black hover:bg-yellow-100"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isGeneratingPDF ? "Generating..." : "Download PDF"}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground text-center max-w-xs">
                <p>
                  We've also sent this information to your email. You can present the barcode on your phone or as a
                  printout.
                </p>
              </div>

              <Link href="/">
                <Button className="bg-black text-white hover:bg-black/80">Return to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-16 items-center gap-4 border-b px-4 md:px-6 bg-background">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <Image src="/images/validity-logo.png" alt="Validity Events" width={180} height={48} />
        </Link>
      </header>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <Card className="dashboard-card overflow-hidden border-yellow-500">
            <CardHeader className="bg-yellow-500 text-center">
              <CardTitle className="text-2xl text-black">Register for Event</CardTitle>
              <CardDescription className="text-black/80">
                Fill out the form below to register for an upcoming event.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="event_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium">Event</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-yellow-500/50 focus:border-yellow-500">
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
                            <Input
                              placeholder="John"
                              {...field}
                              className="border-yellow-500/20 focus:border-yellow-500"
                            />
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
                            <Input
                              placeholder="Doe"
                              {...field}
                              className="border-yellow-500/20 focus:border-yellow-500"
                            />
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
                          <Input
                            placeholder="john.doe@example.com"
                            {...field}
                            className="border-yellow-500/20 focus:border-yellow-500"
                          />
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
                              className={`border-yellow-500/20 focus:border-yellow-500 pl-10 ${
                                phoneError ? "border-red-500 focus:border-red-500" : ""
                              }`}
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
                                <AlertTitle className="text-sm font-medium">Phone number already registered</AlertTitle>
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acme Inc."
                              {...field}
                              className="border-yellow-500/20 focus:border-yellow-500"
                            />
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
                            <Input
                              placeholder="Marketing Manager"
                              {...field}
                              className="border-yellow-500/20 focus:border-yellow-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-black/80"
                    disabled={isSubmitting || !!phoneError}
                  >
                    {isSubmitting ? "Registering..." : "Register"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
