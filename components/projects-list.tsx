"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  ExternalLink,
  Loader2,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Globe,
  Code,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Project {
  id: string
  subdomain: string
  name: string
  description?: string
  created_at: string
  github_repo_url?: string
  github_pages_url?: string
  file_count?: number
}

interface ProjectsListProps {
  refreshTrigger: number
  onEditProject: (project: Project) => void
}

export function ProjectsList({ refreshTrigger, onEditProject }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [httpsStatus, setHttpsStatus] = useState<Record<string, any>>({})
  const [checkingHttps, setCheckingHttps] = useState<string | null>(null)
  const [enablingHttps, setEnablingHttps] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fetchProjects = async () => {
    try {
      console.log("Fetching projects...")
      const response = await fetch("/api/sites")
      console.log("Projects response status:", response.status)

      const data = await response.json()
      console.log("Projects response data:", data)

      if (!response.ok && response.status !== 200) {
        throw new Error(data.error || "Failed to fetch projects")
      }

      setProjects(data.sites || [])

      // Only set error if it's a real error, not a setup issue
      if (data.error && !data.error.includes("Database not properly set up")) {
        setError(data.error)
      } else {
        setError("")
      }

      // Check HTTPS status for all projects
      if (data.sites && data.sites.length > 0) {
        checkAllHttpsStatus(data.sites)
      }
    } catch (error: any) {
      console.error("Fetch projects error:", error)
      setError(error.message || "Failed to fetch projects")
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const checkAllHttpsStatus = async (projectsToCheck: Project[]) => {
    const statusPromises = projectsToCheck.map(async (project) => {
      try {
        const response = await fetch("/api/enable-https", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subdomain: project.subdomain, action: "check" }),
        })

        if (response.ok) {
          const data = await response.json()
          return { subdomain: project.subdomain, ...data }
        }
      } catch (error) {
        console.error(`Failed to check HTTPS status for ${project.subdomain}:`, error)
      }
      return { subdomain: project.subdomain, ready: false, httpsEnforced: false }
    })

    const results = await Promise.all(statusPromises)
    const statusMap = results.reduce(
      (acc, result) => {
        acc[result.subdomain] = result
        return acc
      },
      {} as Record<string, any>,
    )

    setHttpsStatus(statusMap)
  }

  const checkHttpsStatus = async (subdomain: string) => {
    setCheckingHttps(subdomain)

    try {
      const response = await fetch("/api/enable-https", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subdomain, action: "check" }),
      })

      const data = await response.json()

      if (response.ok) {
        setHttpsStatus((prev) => ({
          ...prev,
          [subdomain]: data,
        }))
      }
    } catch (error: any) {
      console.error("HTTPS status check error:", error)
    } finally {
      setCheckingHttps(null)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [refreshTrigger])

  const handleDelete = async (projectId: string, subdomain: string) => {
    setDeleting(projectId)
    setError("")

    try {
      const response = await fetch(`/api/sites/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete project")
      }

      setProjects(projects.filter((project) => project.id !== projectId))
      // Remove from HTTPS status tracking
      setHttpsStatus((prev) => {
        const newStatus = { ...prev }
        delete newStatus[subdomain]
        return newStatus
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleEnableHttps = async (subdomain: string) => {
    setEnablingHttps(subdomain)
    setError("")

    try {
      const response = await fetch("/api/enable-https", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subdomain, action: "enable" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to enable HTTPS")
      }

      // Update status
      setHttpsStatus((prev) => ({
        ...prev,
        [subdomain]: { ...prev[subdomain], httpsEnforced: true, ready: true },
      }))

      // Show success message
      setError("")
      alert("HTTPS has been enabled successfully!")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setEnablingHttps(null)
    }
  }

  const getHttpsStatusBadge = (subdomain: string) => {
    const status = httpsStatus[subdomain]

    if (!status) {
      return (
        <Badge variant="outline" className="text-xs border-slate-600">
          <Clock className="h-3 w-3 mr-1" />
          Checking...
        </Badge>
      )
    }

    if (status.httpsEnforced) {
      return (
        <Badge variant="outline" className="text-xs text-green-400 border-green-600">
          <ShieldCheck className="h-3 w-3 mr-1" />
          HTTPS Active
        </Badge>
      )
    }

    if (status.ready && status.canEnableHttps) {
      return (
        <Badge variant="outline" className="text-xs text-blue-400 border-blue-600">
          <Shield className="h-3 w-3 mr-1" />
          HTTPS Ready
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-xs text-orange-400 border-orange-600">
        <Clock className="h-3 w-3 mr-1" />
        Building...
      </Badge>
    )
  }

  const canEnableHttps = (subdomain: string) => {
    const status = httpsStatus[subdomain]
    return status && status.ready && status.canEnableHttps && !status.httpsEnforced
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
          <p className="text-slate-400">Manage and deploy your web projects</p>
        </div>
        <Card className="glass-effect border-slate-700">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-slate-400">Loading your projects...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
        <p className="text-slate-400">Manage and deploy your web projects</p>
      </div>

      {error && !error.includes("Database not properly set up") && (
        <Alert className="mb-6 bg-red-900/20 border-red-700 animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {error && error.includes("Database not properly set up") && (
        <Alert className="mb-6 bg-yellow-900/20 border-yellow-700 animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-400">
            <strong>Database Setup Required:</strong> Please run the database setup script to create the required
            tables.
            <br />
            <span className="text-xs mt-1 block">Go to Scripts → setup-database-v5.sql and run it.</span>
          </AlertDescription>
        </Alert>
      )}

      {projects.length === 0 && !error ? (
        <Card className="glass-effect border-slate-700 animate-scale-in">
          <CardContent className="text-center py-12">
            <Globe className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">Create your first project to get started with instant deployment</p>
            <Button
              onClick={() => {}}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className={`glass-effect border-slate-700 hover:border-slate-600 transition-all duration-300 transform hover:scale-[1.02] animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl text-white">{project.name}</CardTitle>
                      <Badge variant="secondary" className="bg-blue-900/30 text-blue-400 border-blue-600">
                        Live
                      </Badge>
                      {getHttpsStatusBadge(project.subdomain)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-mono">{project.subdomain}.sriox.com</span>
                    </div>
                    {project.description && (
                      <CardDescription className="text-slate-400">{project.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{project.file_count || 1} files</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="bg-transparent border-slate-600 hover:border-blue-500 hover:bg-blue-500/10 transition-all duration-300"
                    >
                      <a href={`https://${project.subdomain}.sriox.com`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditProject(project)}
                      className="bg-transparent border-slate-600 hover:border-purple-500 hover:bg-purple-500/10 transition-all duration-300"
                    >
                      <Code className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (canEnableHttps(project.subdomain)) {
                          handleEnableHttps(project.subdomain)
                        } else {
                          checkHttpsStatus(project.subdomain)
                        }
                      }}
                      disabled={enablingHttps === project.subdomain || checkingHttps === project.subdomain}
                      title={
                        canEnableHttps(project.subdomain)
                          ? "Enable HTTPS"
                          : httpsStatus[project.subdomain]?.httpsEnforced
                            ? "HTTPS is already enabled"
                            : "Check HTTPS status"
                      }
                      className="bg-transparent border-slate-600 hover:border-green-500 hover:bg-green-500/10 transition-all duration-300"
                    >
                      {enablingHttps === project.subdomain || checkingHttps === project.subdomain ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : httpsStatus[project.subdomain]?.httpsEnforced ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleting === project.id}
                          className="bg-transparent border-slate-600 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300"
                        >
                          {deleting === project.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-effect border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to delete "{project.name}"? This action cannot be undone and will
                            remove the project, its files, GitHub repository, and subdomain.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(project.id, project.subdomain)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete Project
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {httpsStatus[project.subdomain]?.message && (
                  <div className="mt-4 text-xs text-slate-400 bg-slate-800/50 rounded-lg p-3">
                    {httpsStatus[project.subdomain].message}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Alert className="mt-8 bg-blue-900/20 border-blue-700 animate-fade-in">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-blue-400">
          <strong>HTTPS Timeline:</strong> New projects take 10-15 minutes to generate SSL certificates. Projects are
          accessible via HTTP immediately and will automatically redirect to HTTPS once certificates are active.
        </AlertDescription>
      </Alert>
    </div>
  )
}
