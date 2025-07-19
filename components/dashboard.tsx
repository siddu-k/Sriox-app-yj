"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Globe, LogOut, Plus, User } from "lucide-react"
import { ProjectsList } from "@/components/projects-list"
import { CreateProject } from "@/components/create-project"
import { CodeEditor } from "@/components/code-editor"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface DashboardProps {
  user: SupabaseUser
}

export function Dashboard({ user }: DashboardProps) {
  const [activeView, setActiveView] = useState<"projects" | "create" | "editor">("projects")
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleProjectCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
    setActiveView("projects")
  }

  const handleEditProject = (project: any) => {
    setSelectedProject(project)
    setActiveView("editor")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 animate-fade-in">
                <Globe className="h-8 w-8 text-blue-400 animate-glow" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Sriox
                </span>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant={activeView === "projects" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("projects")}
                  className="transition-all duration-300"
                >
                  Projects
                </Button>
                <Button
                  variant={activeView === "create" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("create")}
                  className="transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="transition-all duration-300 hover:scale-105 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b border-slate-700 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-3">
          <div className="flex gap-1">
            <Button
              variant={activeView === "projects" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveView("projects")}
              className="flex-1 transition-all duration-300"
            >
              Projects
            </Button>
            <Button
              variant={activeView === "create" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveView("create")}
              className="flex-1 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeView === "projects" && (
          <ProjectsList refreshTrigger={refreshTrigger} onEditProject={handleEditProject} />
        )}
        {activeView === "create" && <CreateProject onProjectCreated={handleProjectCreated} />}
        {activeView === "editor" && selectedProject && (
          <CodeEditor
            project={selectedProject}
            onBack={() => setActiveView("projects")}
            onSave={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}
      </main>
    </div>
  )
}
