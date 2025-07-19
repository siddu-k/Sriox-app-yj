"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { AuthForm } from "@/components/auth-form"
import { Dashboard } from "@/components/dashboard"
import { LoadingScreen } from "@/components/loading-screen"
import { LandingPage } from "@/components/landing-page"
import type { User } from "@supabase/supabase-js"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session ? "session exists" : "no session")
      setUser(session?.user ?? null)
      setLoading(false)
      if (event === "SIGNED_IN") {
        setShowAuth(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return showAuth ? (
      <AuthForm onBack={() => setShowAuth(false)} />
    ) : (
      <LandingPage onGetStarted={() => setShowAuth(true)} />
    )
  }

  return <Dashboard user={user} />
}
