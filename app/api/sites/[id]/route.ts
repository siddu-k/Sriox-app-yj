import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { deleteRepository } from "@/lib/github"
import { deleteSubdomain } from "@/lib/cloudflare"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Create Supabase client for route handler
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session || !session.user) {
      return NextResponse.json({ error: "Authentication required. Please sign in again." }, { status: 401 })
    }

    const user = session.user

    // Get site details
    const { data: site, error: fetchError } = await supabase
      .from("sites")
      .select("subdomain, github_repo_name")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !site) {
      console.error("Site fetch error:", fetchError)
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // Delete from external services first
    const deletePromises = []

    // Delete GitHub repository
    deletePromises.push(
      deleteRepository(site.subdomain).catch((error) => {
        console.error("GitHub delete error:", error)
        return { error: "github", message: error.message }
      }),
    )

    // Delete from Cloudflare
    deletePromises.push(
      deleteSubdomain(site.subdomain).catch((error) => {
        console.error("Cloudflare delete error:", error)
        return { error: "cloudflare", message: error.message }
      }),
    )

    // Wait for external deletions (but don't fail if they error)
    await Promise.allSettled(deletePromises)

    // Delete from database
    const { error: deleteError } = await supabase.from("sites").delete().eq("id", params.id).eq("user_id", user.id)

    if (deleteError) {
      console.error("Database delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete site" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to delete site",
      },
      { status: 500 },
    )
  }
}
