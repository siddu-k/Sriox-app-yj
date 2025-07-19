"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, CheckCircle, Shield, AlertTriangle } from "lucide-react"

interface UploadFormProps {
  onUploadSuccess: () => void
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const subdomain = formData.get("subdomain") as string

    if (!file) {
      setError("Please select an HTML file")
      setLoading(false)
      return
    }

    // Validate subdomain
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      setError("Subdomain can only contain lowercase letters, numbers, and hyphens")
      setLoading(false)
      return
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("subdomain", subdomain)
      uploadFormData.append("file", file)

      console.log("Submitting upload request...")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      console.log("Upload response status:", response.status)

      const data = await response.json()
      console.log("Upload response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setSuccess(`Your site is live at https://${subdomain}.sriox.com`)
      onUploadSuccess()

      // Reset form safely
      if (formRef.current) {
        formRef.current.reset()
      }
      setFile(null)
    } catch (error: any) {
      console.error("Upload error:", error)
      setError(error.message || "Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "text/html" && !selectedFile.name.endsWith(".html")) {
        setError("Please select a valid HTML file")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Your Site
        </CardTitle>
        <CardDescription>Upload an HTML file and get your custom subdomain with HTTPS</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex">
              <Input
                id="subdomain"
                name="subdomain"
                type="text"
                placeholder="your-site"
                required
                pattern="[a-z0-9-]+"
                className="rounded-r-none"
              />
              <div className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                .sriox.com
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and hyphens allowed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">HTML File</Label>
            <Input id="file" type="file" accept=".html,text/html" onChange={handleFileChange} required />
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Deploying with HTTPS..." : "Upload & Deploy"}
          </Button>
        </form>

        {success && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {success}
              <br />
              <div className="flex items-center gap-1 mt-2">
                <Shield className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">HTTPS Enabled</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">
                Note: HTTPS certificate generation may take 5-15 minutes. Your site will automatically redirect to HTTPS
                once ready.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {error.includes("Database not properly set up") && (
                <div className="mt-2 text-xs">
                  <strong>Solution:</strong> Run the database setup script in the Scripts section to create the required
                  tables.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Security:</strong> All sites are automatically configured with HTTPS and SSL certificates for secure
            browsing.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
