import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, QrCode, BarChart, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center gap-4 border-b px-4 md:px-6 bg-background">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <Image src="/images/validity-logo.png" alt="Validity Events" width={180} height={48} />
        </Link>
        <nav className="ml-auto flex gap-2">
          <Link href="/auth/signin">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Register for Event</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                    Validity Events Management System
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Streamline your event management process with our comprehensive solution. Register guests, print
                    badges, and track attendance with ease.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="gap-2">
                      Register for Event
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button size="lg" variant="outline">
                      Staff Login
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/20 rounded-full"></div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/30 rounded-full"></div>
                  <div className="relative bg-white p-6 rounded-xl shadow-lg">
                    <Image
                      src="/images/validity-icon.png"
                      alt="Validity Events"
                      width={300}
                      height={300}
                      className="rounded-lg object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Features</h2>
                <p className="text-muted-foreground md:text-xl/relaxed">
                  Our event management system provides everything you need to run successful events.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center space-y-4 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Event Management</h3>
                <p className="text-center text-muted-foreground">
                  Create and manage multiple events with detailed information.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Guest Registration</h3>
                <p className="text-center text-muted-foreground">
                  Self-registration and on-site registration options for guests.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Badge Printing</h3>
                <p className="text-center text-muted-foreground">
                  Generate and print badges with QR codes for easy check-in.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <BarChart className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold">Reporting</h3>
                <p className="text-center text-muted-foreground">
                  Comprehensive reporting and analytics for event attendance.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter">Ready to get started?</h2>
                  <p className="text-muted-foreground md:text-xl">
                    Join thousands of event organizers who trust Validity Events Management System.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="gap-2">
                      Register Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button size="lg" variant="outline">
                      Staff Login
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-4xl font-bold text-primary mb-2">1,200+</div>
                  <p className="text-muted-foreground">Events managed</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-4xl font-bold text-blue-600 mb-2">50k+</div>
                  <p className="text-muted-foreground">Guests registered</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-4xl font-bold text-green-600 mb-2">98%</div>
                  <p className="text-muted-foreground">Customer satisfaction</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                  <p className="text-muted-foreground">Support available</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full border-t px-4 md:px-6 bg-background">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Validity Events. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6 justify-center md:justify-end">
          <Link href="#" className="text-sm text-muted-foreground hover:underline">
            Terms of Service
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:underline">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
