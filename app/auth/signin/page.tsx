"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

// Import the getSupabaseClient function instead of the direct client
import { getSupabaseClient } from "@/lib/supabase/client"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
})

export default function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabaseError, setSupabaseError] = useState<boolean>(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSupabaseError(false)

    try {
      // Get the Supabase client
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        console.error("Authentication error:", error)

        if (error.message === "Invalid login credentials") {
          setError("The email or password you entered is incorrect. Please try again.")
        } else {
          setError(`Authentication error: ${error.message}`)
        }

        setIsLoading(false)
        return
      }

      if (data?.user) {
        // Get user role and information
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, first_name, last_name")
          .eq("id", data.user.id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
          setError("Failed to retrieve user information. Please try again.")
          setIsLoading(false)
          return
        }

        // Welcome message based on role
        let welcomeMessage = `Welcome back, ${userData.first_name}!`
        if (userData.role === "super_admin") {
          welcomeMessage = `Welcome back, Super Admin ${userData.first_name}!`
        } else if (userData.role === "admin") {
          welcomeMessage = `Welcome back, Admin ${userData.first_name}!`
        }

        toast({
          title: "Sign in successful",
          description: welcomeMessage,
        })

        // Redirect based on role
        // For all roles, we redirect to the dashboard page
        // The middleware will handle any further role-specific redirections
        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error("Unexpected error during sign in:", err)
      setSupabaseError(true)
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image src="/images/validity-logo.png" alt="Validity Events" width={200} height={60} priority />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supabaseError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                There was an error connecting to the authentication service. This might be due to missing environment
                variables.
                <div className="mt-2">
                  <p className="text-sm font-medium">Please check that these environment variables are set:</p>
                  <ul className="list-disc pl-5 text-sm mt-1">
                    <li>NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && !supabaseError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-500">Don&apos;t have an account yet? Contact your admin.</div>
        </CardFooter>
      </Card>
    </div>
  )
}
