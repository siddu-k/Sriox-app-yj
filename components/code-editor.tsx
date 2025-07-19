"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Code,
  ImageIcon,
  FolderOpen,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface Project {
  id: string
  subdomain: string
  name: string
  description?: string
}

interface ProjectFile {
  id: string
  filename: string
  content: string // Now fetched from GitHub
  file_type: string
  size_bytes: number
  github_sha: string | null // Crucial for GitHub updates
}

interface CodeEditorProps {
  project: Project
  onBack: () => void
  onSave: () => void
}

export function CodeEditor({ project, onBack, onSave }: CodeEditorProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const fetchProjectFiles = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch(`/api/projects/${project.id}/files`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch project files")
      }

      const data = await response.json()
      const fetchedFiles: ProjectFile[] = data.files || []
      setFiles(fetchedFiles)

      // Auto-select index.html if available, otherwise the first file
      const indexFile = fetchedFiles.find((f: ProjectFile) => f.filename.toLowerCase() === "index.html")
      if (indexFile) {
        setSelectedFile(indexFile)
      } else if (fetchedFiles.length > 0) {
        setSelectedFile(fetchedFiles[0])
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    fetchProjectFiles()
  }, [fetchProjectFiles])

  const handleFileContentChange = (content: string) => {
    if (selectedFile) {
      setSelectedFile({ ...selectedFile, content })
      setHasChanges(true)
      setSuccess("")
      setError("")
    }
  }

  const saveFile = async () => {
    if (!selectedFile || !hasChanges || saving) return

    if (!selectedFile.github_sha) {
      setError("Cannot save: GitHub SHA is missing for this file.")
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const response = await fetch(`/api/projects/${project.id}/files/${selectedFile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: selectedFile.content,
          github_sha: selectedFile.github_sha, // Send current SHA for optimistic locking
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save file.")
      }

      setHasChanges(false)
      setSuccess("File saved successfully!")
      onSave() // Trigger a refresh in the parent component if needed

      // Update the selected file's SHA and size in local state with the new SHA from GitHub
      setSelectedFile((prev) =>
        prev ? { ...prev, github_sha: data.newSha, size_bytes: selectedFile.content.length } : null,
      )
      setFiles((prev) =>
        prev.map((f) =>
          f.id === selectedFile.id
            ? { ...f, github_sha: data.newSha, content: selectedFile.content, size_bytes: selectedFile.content.length }
            : f,
        ),
      )
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split(".").pop()
    switch (ext) {
      case "html":
      case "htm":
        return <Code className="h-4 w-4 text-orange-400" />
      case "css":
        return <FileText className="h-4 w-4 text-blue-400" />
      case "js":
      case "mjs":
        return <FileText className="h-4 w-4 text-yellow-400" />
      case "json":
        return <FileText className="h-4 w-4 text-green-400" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
      case "svg":
        return <ImageIcon className="h-4 w-4 text-purple-400" />
      default:
        return <FileText className="h-4 w-4 text-slate-400" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isTextFile = (fileType: string, filename: string) => {
    const textMimeTypes = [
      "text/html",
      "text/css",
      "text/javascript",
      "application/javascript",
      "text/plain",
      "application/json",
      "text/xml",
      "application/xml",
      "image/svg+xml",
    ]
    const textExtensions = [".html", ".htm", ".css", ".js", ".mjs", ".txt", ".md", ".json", ".xml", ".svg"]

    return textMimeTypes.includes(fileType) || textExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        <Card className="glass-effect border-slate-700">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-slate-400">Loading project files...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-slate-400 text-sm">{project.subdomain}.sriox.com</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="bg-transparent border-slate-600 hover:border-blue-500">
            <a href={`https://${project.subdomain}.sriox.com`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Live
            </a>
          </Button>
          <Button
            onClick={saveFile}
            disabled={!hasChanges || saving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {success && (
        <Alert className="mb-6 bg-green-900/20 border-green-700 animate-fade-in">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-900/20 border-red-700 animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {/* Editor Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* File Browser */}
        <Card className="glass-effect border-slate-700 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              Project Files
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 hover:bg-slate-800/50 transition-colors duration-200 border-l-2 ${
                    selectedFile?.id === file.id
                      ? "bg-slate-800/50 border-blue-500"
                      : "border-transparent hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.filename)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.filename}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(file.size_bytes)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Editor */}
        <Card className="glass-effect border-slate-700 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-white flex items-center gap-2">
                  {selectedFile && getFileIcon(selectedFile.filename)}
                  {selectedFile?.filename || "No file selected"}
                </CardTitle>
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-400 border-orange-600">
                    Unsaved
                  </Badge>
                )}
              </div>
              {selectedFile && (
                <div className="text-sm text-slate-400">
                  {formatFileSize(selectedFile.content.length)} • {selectedFile.file_type}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              isTextFile(selectedFile.file_type, selectedFile.filename) ? (
                <div className="space-y-4">
                  <Textarea
                    value={selectedFile.content}
                    onChange={(e) => handleFileContentChange(e.target.value)}
                    className="code-editor min-h-[500px] bg-slate-900 border-slate-700 text-white font-mono text-sm leading-relaxed resize-none focus:border-blue-500"
                    placeholder="Start editing your code..."
                  />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Lines: {selectedFile.content.split("\n").length}</span>
                    <span>Characters: {selectedFile.content.length}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">This file type cannot be edited in the browser</p>
                  <p className="text-sm text-slate-500 mt-2">Binary files like images can be viewed but not modified</p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a file from the sidebar to start editing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Text */}
      <Alert className="mt-6 bg-blue-900/20 border-blue-700 animate-fade-in">
        <RefreshCw className="h-4 w-4" />
        <AlertDescription className="text-blue-400">
          <strong>Live Editing:</strong> Changes are saved to your project and automatically deployed. Your live site
          will update within a few seconds of saving.
        </AlertDescription>
      </Alert>
    </div>
  )
}
