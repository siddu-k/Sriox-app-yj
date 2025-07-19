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
  Github,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
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

interface Site {
  id: string
  subdomain: string
  created_at: string
  github_repo_url?: string
  github_pages_url?: string
}

interface SitesListProps {
  refreshTrigger: number
}

export function SitesList({ refreshTrigger }: SitesListProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [httpsStatus, setHttpsStatus] = useState<Record<string, any>>({})
  const [checkingHttps, setCheckingHttps] = useState<string | null>(null)
  const [enablingHttps, setEnablingHttps] = useState<string | null>(null)
  const [error, setError] = useState("")

  const fetchSites = async () => {
    try {
      console.log("Fetching sites...")
      const response = await fetch("/api/sites")
      console.log("Sites response status:", response.status)

      const data = await response.json()
      console.log("Sites response data:", data)

      if (!response.ok && response.status !== 200) {
        throw new Error(data.error || "Failed to fetch sites")
      }

      setSites(data.sites || [])

      // Only set error if it's a real error, not a setup issue
      if (data.error && !data.error.includes("Database not properly set up")) {
        setError(data.error)
      } else {
        setError("")
      }

      // Check HTTPS status for all sites
      if (data.sites && data.sites.length > 0) {
        checkAllHttpsStatus(data.sites)
      }
    } catch (error: any) {
      console.error("Fetch sites error:", error)
      setError(error.message || "Failed to fetch sites")
      setSites([])
    } finally {
      setLoading(false)
    }
  }

  const checkAllHttpsStatus = async (sitesToCheck: Site[]) => {
    const statusPromises = sitesToCheck.map(async (site) => {
      try {
        const response = await fetch("/api/enable-https", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subdomain: site.subdomain, action: "check" }),
        })

        if (response.ok) {
          const data = await response.json()
          return { subdomain: site.subdomain, ...data }
        }
      } catch (error) {
        console.error(`Failed to check HTTPS status for ${site.subdomain}:`, error)
      }
      return { subdomain: site.subdomain, ready: false, httpsEnforced: false }
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
    fetchSites()
  }, [refreshTrigger])

  const handleDelete = async (siteId: string, subdomain: string) => {
    setDeleting(siteId)
    setError("")

    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete site")
      }

      setSites(sites.filter((site) => site.id !== siteId))
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
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Checking...
        </Badge>
      )
    }

    if (status.httpsEnforced) {
      return (
        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
          <ShieldCheck className="h-3 w-3 mr-1" />
          HTTPS Active
        </Badge>
      )
    }

    if (status.ready && status.canEnableHttps) {
      return (
        <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
          <Shield className="h-3 w-3 mr-1" />
          HTTPS Ready
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Sites</CardTitle>
        <CardDescription>Manage your uploaded sites and subdomains</CardDescription>
      </CardHeader>
      <CardContent>
        {error && !error.includes("Database not properly set up") && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {error && error.includes("Database not properly set up") && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Database Setup Required:</strong> Please run the database setup script to create the required
              tables.
              <br />
              <span className="text-xs mt-1 block">Go to Scripts → setup-database-v3.sql and run it.</span>
            </AlertDescription>
          </Alert>
        )}

        {sites.length === 0 && !error ? (
          <p className="text-center text-muted-foreground py-8">
            No sites uploaded yet. Upload your first HTML file to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {sites.map((site) => (
              <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{site.subdomain}.sriox.com</h3>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(site.created_at).toLocaleDateString()}
                  </p>
                  {site.github_pages_url && (
                    <p className="text-xs text-muted-foreground mt-1">
                      GitHub Pages: {site.github_pages_url.replace("https://", "")}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">{getHttpsStatusBadge(site.subdomain)}</div>
                  {httpsStatus[site.subdomain]?.message && (
                    <p className="text-xs text-muted-foreground mt-1">{httpsStatus[site.subdomain].message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://${site.subdomain}.sriox.com`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>

                  {site.github_repo_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={site.github_repo_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (canEnableHttps(site.subdomain)) {
                        handleEnableHttps(site.subdomain)
                      } else {
                        checkHttpsStatus(site.subdomain)
                      }
                    }}
                    disabled={enablingHttps === site.subdomain || checkingHttps === site.subdomain}
                    title={
                      canEnableHttps(site.subdomain)
                        ? "Enable HTTPS"
                        : httpsStatus[site.subdomain]?.httpsEnforced
                          ? "HTTPS is already enabled"
                          : "Check HTTPS status"
                    }
                  >
                    {enablingHttps === site.subdomain || checkingHttps === site.subdomain ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : httpsStatus[site.subdomain]?.httpsEnforced ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={deleting === site.id}>
                        {deleting === site.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Site</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {site.subdomain}.sriox.com? This action cannot be undone and
                          will remove the site, its GitHub repository, and subdomain.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(site.id, site.subdomain)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>HTTPS Timeline:</strong> New sites take 10-15 minutes to generate SSL certificates. The shield
            button will show "HTTPS Ready" when certificates are available. Sites are accessible via HTTP immediately
            and will automatically redirect to HTTPS once certificates are active.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
