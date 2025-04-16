"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { getUserRole, isSuperAdmin } from "@/lib/auth-utils"
import { supabase } from "@/lib/supabase/client"
import { Loader2, UserPlus, Users, AlertCircle } from "lucide-react"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Form schema for user creation
const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
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
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
  role: z.enum(["admin", "staff"], {
    required_error: "Please select a role.",
  }),
})

type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  username: string
  role: "super_admin" | "admin" | "staff"
  created_at: string
}

// Define columns for the users table
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant={role === "super_admin" ? "default" : role === "admin" ? "secondary" : "outline"}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <span>{date.toLocaleDateString()}</span>
    },
  },
]

export default function UsersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()

  // Form with default values for the test user
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "Abrham",
      lastName: "Tibebu",
      username: "Abrham",
      email: "abrhamtibebu@outlook.com",
      password: "Dagi12@VME",
      role: "admin",
    },
  })

  // Check if the current user is a super admin
  useEffect(() => {
    async function checkAuthorization() {
      try {
        const role = await getUserRole()
        setUserRole(role)
        setIsAuthorized(isSuperAdmin(role))
        setIsLoadingAuth(false)

        if (role && !isSuperAdmin(role)) {
          toast({
            title: "Access Denied",
            description: "You do not have permission to access this page.",
            variant: "destructive",
          })
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking authorization:", error)
        setIsLoadingAuth(false)
        router.push("/dashboard")
      }
    }

    checkAuthorization()
  }, [router])

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      if (!isAuthorized) return

      try {
        const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setUsers(data || [])
      } catch (error: any) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load users. " + error.message,
          variant: "destructive",
        })
      }
    }

    if (isAuthorized) {
      fetchUsers()
    }
  }, [isAuthorized])

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to create users.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setFormError(null)

    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            username: values.username,
            role: values.role,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error("Failed to create user account")
      }

      // Create the user in the users table
      const { error: dbError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: values.email,
        first_name: values.firstName,
        last_name: values.lastName,
        username: values.username,
        role: values.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (dbError) throw dbError

      // Refresh the users list
      const { data: updatedUsers, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setUsers(updatedUsers || [])

      // Reset the form
      form.reset({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        role: "staff",
      })

      toast({
        title: "User Created",
        description: `Successfully created user account for ${values.firstName} ${values.lastName}.`,
      })
    } catch (error: any) {
      console.error("Error creating user:", error)
      setFormError(error.message || "Failed to create user. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authorization
  if (isLoadingAuth) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </DashboardLayout>
    )
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-description">Create and manage user accounts for the system.</p>
          </div>
        </div>

        <Tabs defaultValue="create">
          <TabsList>
            <TabsTrigger value="create">
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>Add a new admin or staff user to the system. All fields are required.</CardDescription>
              </CardHeader>
              <CardContent>
                {formError && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
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
                        name="lastName"
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
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
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
                              <Input placeholder="john.doe@example.com" {...field} />
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
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 8 characters and include uppercase, lowercase, number, and
                              special character.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Admins have full access to all features. Staff have limited access.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating User...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create User
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>View and manage all users in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns} data={users} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
