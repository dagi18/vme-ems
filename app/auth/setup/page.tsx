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

// Import the getSupabaseClient function
import { getSupabaseClient } from "@/lib/supabase/client"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
})

export default function Setup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [supabaseError, setSupabaseError] = useState<boolean>(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "Abrham Tibebu",
      username: "Abrham",
      email: "abrhamtibebu@outlook.com",
      password: "Dagi12@VME",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setSupabaseError(false)

    try {
      // Get the Supabase client
      const supabase = getSupabaseClient()

      // Check if super admin already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("role", "super_admin")
        .limit(1)

      if (checkError) {
        console.error("Error checking existing super admin:", checkError)
        setError(`Database error: ${checkError.message}`)
        setIsLoading(false)
        return
      }

      if (existingUsers && existingUsers.length > 0) {
        setError("A super admin account already exists. Please sign in instead.")
        setIsLoading(false)
        return
      }

      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })

      if (authError) {
        console.error("Error creating user:", authError)
        setError(`Authentication error: ${authError.message}`)
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        setError("Failed to create user account.")
        setIsLoading(false)
        return
      }

      // Create the user profile in the users table
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          name: values.name,
          username: values.username,
          email: values.email,
          role: "super_admin",
        },
      ])

      if (profileError) {
        console.error("Error creating user profile:", profileError)
        setError(`Database error: ${profileError.message}`)

        // Try to clean up the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)

        setIsLoading(false)
        return
      }

      // Success!
      setSuccess(true)

      // Auto sign-in after a short delay
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error("Unexpected error during setup:", err)
      setSupabaseError(true)
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Image src="/images/validity-logo.png" alt="Validity Events" width={200} height={60} priority />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Setup Complete!</CardTitle>
            <CardDescription className="text-center">
              Your super admin account has been created successfully. You will be redirected to the dashboard shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image src="/images/validity-logo.png" alt="Validity Events" width={200} height={60} priority />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create Super Admin Account</CardTitle>
          <CardDescription className="text-center">
            Set up the first super admin account for Validity Events
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
              <AlertTitle>Setup Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    Creating account...
                  </>
                ) : (
                  "Create Super Admin Account"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/auth/signin")}>
              Sign in
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
