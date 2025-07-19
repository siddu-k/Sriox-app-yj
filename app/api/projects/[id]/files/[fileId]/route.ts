import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { updateFileInRepository } from "@/lib/github" // Import the GitHub utility

export async function PUT(request: Request, { params }: { params: { id: string; fileId: string } }) {
  const siteId = params.id
  const fileId = params.fileId
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session || !session.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const { content: newContent, github_sha: currentSha } = await request.json()

  if (typeof newContent !== "string" || !currentSha) {
    return NextResponse.json({ error: "Missing new content or current GitHub SHA" }, { status: 400 })
  }

  try {
    // 1. Fetch file metadata and associated site's subdomain from Supabase
    const { data: fileData, error: fileError } = await supabase
      .from("site_files")
      .select("filename, sites(subdomain, user_id)")
      .eq("id", fileId)
      .eq("site_id", siteId)
      .single()

    if (fileError || !fileData) {
      console.error("Error fetching file metadata for update:", fileError?.message || "File not found")
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 })
    }

    // Ensure the user owns this file's parent site
    const siteOwnerId = (fileData.sites as { user_id: string }).user_id
    if (siteOwnerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    const { filename } = fileData
    const subdomain = (fileData.sites as { subdomain: string }).subdomain

    // 2. Update file content on GitHub
    // Pass the current SHA for optimistic locking
    const githubUpdateResult = await updateFileInRepository(subdomain, filename, newContent, currentSha)

    // 3. Update the GitHub SHA and size in Supabase
    const { error: updateShaError } = await supabase
      .from("site_files")
      .update({
        github_sha: githubUpdateResult.newSha,
        size_bytes: newContent.length, // Update size based on new content
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)
      .eq("site_id", siteId) // Double check site_id for safety
      .select() // Select the updated row to confirm

    if (updateShaError) {
      console.error("Error updating GitHub SHA in Supabase:", updateShaError.message)
      // This is a critical error, as Supabase and GitHub are now out of sync
      throw new Error(`Failed to update file SHA in database: ${updateShaError.message}`)
    }

    return NextResponse.json({ success: true, newSha: githubUpdateResult.newSha })
  } catch (error: any) {
    console.error("Error updating file content:", error.message)
    return NextResponse.json({ error: error.message || "Failed to update file content." }, { status: 500 })
  }
}
