"use client"

import { Globe, Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="relative mb-8">
          <Globe className="h-16 w-16 text-blue-400 mx-auto animate-glow" />
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-30"></div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Sriox
        </h1>
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading your workspace...</span>
        </div>
      </div>
    </div>
  )
}
