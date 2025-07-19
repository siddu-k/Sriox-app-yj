import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createRepository } from "@/lib/github"
import { createSubdomain } from "@/lib/cloudflare"

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called")

    // Create Supabase client for route handler
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log(
      "Session check:",
      session ? "exists" : "null",
      sessionError ? `error: ${sessionError.message}` : "no error",
    )

    if (sessionError || !session || !session.user) {
      return NextResponse.json({ error: "Authentication required. Please sign in again." }, { status: 401 })
    }

    const user = session.user

    // Get form data
    const formData = await request.formData()
    const subdomain = formData.get("subdomain") as string
    const projectName = formData.get("projectName") as string
    const description = formData.get("description") as string

    // Get all files and filter out any null/undefined entries immediately
    const files = formData.getAll("files").filter((file): file is File => file instanceof File)

    console.log("Form data received:", {
      subdomain,
      projectName,
      description,
      fileCount: files.length,
      fileNames: files.map((f) => f.name),
    })

    if (!subdomain || files.length === 0) {
      return NextResponse.json({ error: "Missing subdomain or files" }, { status: 400 })
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        {
          error: "Subdomain can only contain lowercase letters, numbers, and hyphens",
        },
        { status: 400 },
      )
    }

    // Find index.html file
    const indexFile = files.find((file) => file.name.toLowerCase() === "index.html")
    if (!indexFile) {
      return NextResponse.json({ error: "index.html file is required" }, { status: 400 })
    }

    // Validate all files (now guaranteed to be File objects)
    for (const file of files) {
      if (!file.name || file.size === 0) {
        return NextResponse.json({ error: `Invalid file: ${file.name}` }, { status: 400 })
      }
    }

    // Check if subdomain already exists with better error handling
    console.log("Checking if subdomain exists...")
    try {
      const { data: existingSite, error: checkError } = await supabase
        .from("sites")
        .select("id")
        .eq("subdomain", subdomain)
        .maybeSingle()

      console.log("Subdomain check result:", { existingSite, checkError })

      if (checkError) {
        console.error("Database check error:", checkError)
        // If it's a table doesn't exist error, provide helpful message
        if (checkError.message?.includes("relation") && checkError.message?.includes("does not exist")) {
          return NextResponse.json(
            {
              error: "Database not properly set up. Please run the database setup script first.",
            },
            { status: 500 },
          )
        }
        return NextResponse.json({ error: `Database error: ${checkError.message}` }, { status: 500 })
      }

      if (existingSite) {
        return NextResponse.json(
          {
            error: "Subdomain already taken",
          },
          { status: 409 },
        )
      }
    } catch (dbError: any) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed. Please check your Supabase configuration.",
        },
        { status: 500 },
      )
    }

    // Prepare all files for GitHub upload
    const filesForGitHub: { filename: string; content: string }[] = []
    for (const file of files) {
      const content = await file.text()
      filesForGitHub.push({ filename: file.name, content })
    }

    // Step 1: Create GitHub repository and upload all files
    let githubResult
    try {
      console.log("Creating GitHub repository and uploading all files...")
      githubResult = await createRepository(subdomain, filesForGitHub) // Pass the array of files
      console.log("GitHub repository created:", githubResult)
    } catch (error: any) {
      console.error("GitHub repository creation error:", error)
      return NextResponse.json({ error: `Failed to create repository: ${error.message}` }, { status: 500 })
    }

    // Step 2: Create Cloudflare DNS record pointing to GitHub Pages
    try {
      console.log("Creating Cloudflare DNS record...")
      await createSubdomain(subdomain, githubResult.pagesUrl)
      console.log("Cloudflare DNS record created successfully")
    } catch (error: any) {
      console.error("Cloudflare error:", error)
      // Try to clean up GitHub repository if DNS fails
      try {
        console.log("Cleaning up GitHub repository due to DNS failure...")
        const { deleteRepository } = await import("@/lib/github")
        await deleteRepository(subdomain)
      } catch (cleanupError) {
        console.error("Failed to cleanup GitHub repository:", cleanupError)
      }
      return NextResponse.json({ error: `Failed to configure subdomain: ${error.message}` }, { status: 500 })
    }

    // Step 3: Save to database with project information
    let siteId: string
    try {
      console.log("Saving project to database...")
      const { data: insertedSite, error: dbError } = await supabase
        .from("sites")
        .insert({
          user_id: user.id,
          subdomain: subdomain,
          name: projectName || subdomain,
          description: description || null,
          github_repo_name: githubResult.repoName,
          github_repo_url: githubResult.repoUrl,
          github_pages_url: githubResult.pagesUrl,
        })
        .select()
        .single()

      if (dbError) {
        console.error("Database insert error:", dbError)
        throw new Error(`Database insert failed: ${dbError.message}`)
      }

      siteId = insertedSite.id
      console.log("Project saved to database successfully")
    } catch (dbError: any) {
      console.error("Database save error:", dbError)

      // Try to clean up external resources
      try {
        console.log("Cleaning up external resources due to database failure...")
        const { deleteRepository } = await import("@/lib/github")
        const { deleteSubdomain } = await import("@/lib/cloudflare")
        await Promise.allSettled([deleteRepository(subdomain), deleteSubdomain(subdomain)])
      } catch (cleanupError) {
        console.error("Failed to cleanup external resources:", cleanupError)
      }

      return NextResponse.json({ error: `Failed to save project information: ${dbError.message}` }, { status: 500 })
    }

    // Step 4: Save file metadata (including GitHub SHA) to database
    try {
      console.log("Saving file metadata to database...")
      const fileInserts = []

      for (const file of files) {
        const githubSha = githubResult.fileShas.find((s) => s.filename === file.name)?.sha || null
        fileInserts.push({
          site_id: siteId,
          filename: file.name,
          file_type: file.type || "text/plain",
          size_bytes: file.size,
          github_sha: githubSha, // Store the SHA from GitHub
        })
      }

      const { error: filesError } = await supabase.from("site_files").insert(fileInserts)

      if (filesError) {
        console.error("Files metadata insert error:", filesError)
        throw new Error(`Failed to save file metadata: ${filesError.message}`)
      }

      console.log(`Saved ${files.length} file metadata entries to database`)
    } catch (filesError: any) {
      console.error("Files metadata save error:", filesError)
      console.log("Project created successfully but some file metadata may not be saved for editing")
    }

    return NextResponse.json({
      success: true,
      url: `https://${subdomain}.sriox.com`,
      githubUrl: githubResult.repoUrl,
      pagesUrl: githubResult.pagesUrl,
      customDomain: githubResult.customDomain,
      projectName: projectName || subdomain,
      fileCount: files.length,
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error: error.message || "Upload failed",
      },
      { status: 500 },
    )
  }
}
