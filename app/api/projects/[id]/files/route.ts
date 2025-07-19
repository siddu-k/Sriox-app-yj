import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getFileContentFromGitHub } from "@/lib/github" // Import the GitHub utility

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const siteId = params.id
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify the user owns this project
    const { data: project, error: projectError } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("user_id", session.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Fetch file metadata and associated site's subdomain from Supabase
    // We need the subdomain to construct the GitHub repo name
    const { data: filesData, error: filesError } = await supabase
      .from("site_files")
      .select("id, filename, file_type, size_bytes, github_sha, sites(subdomain, user_id)")
      .eq("site_id", siteId)
      .filter("sites.user_id", "eq", session.user.id) // Ensure user owns the parent site

    if (filesError) {
      console.error("Error fetching site files metadata:", filesError.message)
      return NextResponse.json({ error: filesError.message }, { status: 500 })
    }

    if (!filesData || filesData.length === 0) {
      return NextResponse.json({ error: "No files found for this project or unauthorized access." }, { status: 404 })
    }

    // Filter out files where the user_id from the joined sites table doesn't match
    const userFiles = filesData.filter((file) => (file.sites as { user_id: string }).user_id === session.user.id)

    // For each file, fetch its content from GitHub
    const filesWithContent = await Promise.all(
      userFiles.map(async (file) => {
        const subdomain = (file.sites as { subdomain: string }).subdomain
        let content = ""
        try {
          // Only fetch content for text-based files that can be edited
          const isTextFile =
            [
              "text/html",
              "text/css",
              "text/javascript",
              "application/javascript",
              "text/plain",
              "application/json",
              "text/xml",
              "application/xml",
              "image/svg+xml", // SVG can be text
            ].includes(file.file_type) || file.filename.match(/\.(html|css|js|json|txt|md|xml|svg)$/i)

          if (file.github_sha && isTextFile) {
            content = await getFileContentFromGitHub(subdomain, file.filename)
          } else if (!isTextFile) {
            content = "Binary file content not editable in browser." // Placeholder for binary files
          }
        } catch (contentError: any) {
          console.warn(`Could not fetch content for ${file.filename}: ${contentError.message}`)
          content = `Error fetching content: ${contentError.message}`
        }

        return {
          id: file.id,
          filename: file.filename,
          file_type: file.file_type,
          size_bytes: file.size_bytes,
          github_sha: file.github_sha,
          content: content, // Add the fetched content
        }
      }),
    )

    return NextResponse.json({ files: filesWithContent })
  } catch (error: any) {
    console.error("Files fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch files" }, { status: 500 })
  }
}
