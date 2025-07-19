"use client"

import type React from "react"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Globe, Sparkles, Mail, Lock } from "lucide-react"

interface AuthFormProps {
  onBack: () => void
}

export function AuthForm({ onBack }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const supabase = createClientComponentClient()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      setMessage("Check your email for the confirmation link!")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-400 animate-glow" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Sriox
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="max-w-md mx-auto">
          <Card className="glass-effect border-slate-700 animate-scale-in">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-glow">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Welcome to Sriox</CardTitle>
              <CardDescription className="text-slate-400">
                Sign in to start deploying your projects instantly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-blue-600">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-slate-300">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 transition-colors duration-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-slate-300">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="signin-password"
                          name="password"
                          type="password"
                          placeholder="Enter your password"
                          required
                          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 transition-colors duration-300"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-slate-300">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 transition-colors duration-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-300">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          placeholder="Create a password"
                          required
                          minLength={6}
                          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 transition-colors duration-300"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {message && (
                <Alert className="mt-4 bg-green-900/20 border-green-700 animate-fade-in">
                  <AlertDescription className="text-green-400">{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mt-4 bg-red-900/20 border-red-700 animate-fade-in">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
