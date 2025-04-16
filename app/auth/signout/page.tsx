"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function SignOutPage() {
  const router = useRouter()

  useEffect(() => {
    async function signOut() {
      await supabase.auth.signOut()
      router.push("/auth/signin")
    }

    signOut()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Signing out...</p>
    </div>
  )
}
