"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Upload,
  CheckCircle,
  Shield,
  AlertTriangle,
  FileText,
  X,
  FolderOpen,
  Code,
  ImageIcon,
} from "lucide-react"

interface CreateProjectProps {
  onProjectCreated: () => void
}

interface FileWithPreview {
  file: File
  id: string
  preview?: string
}

export function CreateProject({ onProjectCreated }: CreateProjectProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      // Allow common web files
      const allowedTypes = [
        "text/html",
        "text/css",
        "text/javascript",
        "application/javascript",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/svg+xml",
        "image/webp",
        "application/json",
        "text/xml",
        "application/xml",
      ]

      const allowedExtensions = [
        ".html",
        ".htm",
        ".css",
        ".js",
        ".mjs",
        ".txt",
        ".md",
        ".json",
        ".xml",
        ".svg",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".ico",
        ".woff",
        ".woff2",
        ".ttf",
        ".eot",
      ]

      const hasValidType = allowedTypes.includes(file.type)
      const hasValidExtension = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

      return hasValidType || hasValidExtension
    })

    const filesWithPreview: FileWithPreview[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
    }))

    setFiles((prev) => [...prev, ...filesWithPreview])
    setError("")
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split(".").pop()
    switch (ext) {
      case "html":
      case "htm":
        return <Code className="h-5 w-5 text-orange-400" />
      case "css":
        return <FileText className="h-5 w-5 text-blue-400" />
      case "js":
      case "mjs":
        return <FileText className="h-5 w-5 text-yellow-400" />
      case "json":
        return <FileText className="h-5 w-5 text-green-400" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
      case "svg":
        return <ImageIcon className="h-5 w-5 text-purple-400" />
      default:
        return <FileText className="h-5 w-5 text-slate-400" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const validateProject = () => {
    if (files.length === 0) {
      setError("Please upload at least one file")
      return false
    }

    const hasIndexHtml = files.some((f) => f.file.name.toLowerCase() === "index.html")
    if (!hasIndexHtml) {
      setError("An index.html file is required for your project")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!validateProject()) {
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const subdomain = formData.get("subdomain") as string
    const projectName = formData.get("projectName") as string
    const description = formData.get("description") as string

    console.log("Form values:", { subdomain, projectName, description, fileCount: files.length })

    // Validate subdomain
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      setError("Subdomain can only contain lowercase letters, numbers, and hyphens")
      setLoading(false)
      return
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("subdomain", subdomain)
      uploadFormData.append("projectName", projectName)
      if (description) {
        uploadFormData.append("description", description)
      }

      // Add all files with the same field name "files"
      files.forEach((fileWithPreview) => {
        uploadFormData.append("files", fileWithPreview.file)
      })

      console.log("Submitting project creation request...")
      console.log("FormData contents:")
      for (const [key, value] of uploadFormData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes)`)
        } else {
          console.log(`${key}: ${value}`)
        }
      }

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

      setSuccess(`Your project "${data.projectName}" is live at ${data.url}`)
      onProjectCreated()

      // Reset form
      if (formRef.current) {
        formRef.current.reset()
      }
      setFiles([])
    } catch (error: any) {
      console.error("Upload error:", error)
      setError(error.message || "Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
        <p className="text-slate-400">Upload your files and deploy instantly with custom subdomain</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Project Details */}
        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              Project Details
            </CardTitle>
            <CardDescription className="text-slate-400">Configure your project settings and subdomain</CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-slate-300">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  name="projectName"
                  type="text"
                  placeholder="My Awesome Website"
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 transition-colors duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain" className="text-slate-300">
                  Subdomain
                </Label>
                <div className="flex">
                  <Input
                    id="subdomain"
                    name="subdomain"
                    type="text"
                    placeholder="my-website"
                    required
                    pattern="[a-z0-9-]+"
                    className="rounded-r-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 transition-colors duration-300"
                  />
                  <div className="flex items-center px-3 bg-slate-700 border border-l-0 border-slate-700 rounded-r-md text-sm text-slate-400">
                    .sriox.com
                  </div>
                </div>
                <p className="text-xs text-slate-500">Only lowercase letters, numbers, and hyphens allowed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of your project..."
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 transition-colors duration-300 resize-none"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                disabled={loading || files.length === 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Deploying Project..." : "Deploy Project"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-400" />
              Project Files
            </CardTitle>
            <CardDescription className="text-slate-400">
              Upload your HTML, CSS, JS, and asset files. An index.html file is required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Drop files here or click to browse</p>
              <p className="text-sm text-slate-400">Supports HTML, CSS, JS, images, and other web assets</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept=".html,.htm,.css,.js,.mjs,.txt,.md,.json,.xml,.svg,.jpg,.jpeg,.png,.gif,.webp,.ico,.woff,.woff2,.ttf,.eot"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-300">Uploaded Files ({files.length})</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {files.map((fileWithPreview) => (
                    <div
                      key={fileWithPreview.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(fileWithPreview.file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{fileWithPreview.file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(fileWithPreview.file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileWithPreview.id)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      {success && (
        <Alert className="mt-6 bg-green-900/20 border-green-700 animate-fade-in">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-400">
            {success}
            <br />
            <div className="flex items-center gap-1 mt-2">
              <Shield className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400 font-medium">HTTPS Enabled</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Note: HTTPS certificate generation may take 5-15 minutes. Your site will automatically redirect to HTTPS
              once ready.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mt-6 bg-red-900/20 border-red-700 animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
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

      <Alert className="mt-6 bg-blue-900/20 border-blue-700 animate-fade-in">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-blue-400">
          <strong>File Requirements:</strong> Your project must include an index.html file as the main entry point. All
          other files (CSS, JS, images) will be deployed alongside it with the same folder structure.
        </AlertDescription>
      </Alert>
    </div>
  )
}
