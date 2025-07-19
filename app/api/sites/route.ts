import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("Sites API called")

    // Create Supabase client for route handler
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log(
      "Sites - Session:",
      session ? "exists" : "null",
      sessionError ? `error: ${sessionError.message}` : "no error",
    )

    if (sessionError || !session || !session.user) {
      return NextResponse.json({ error: "Authentication required. Please sign in again." }, { status: 401 })
    }

    const user = session.user

    try {
      const { data: sites, error } = await supabase
        .from("sites")
        .select("id, subdomain, created_at, github_repo_url, github_pages_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database query error:", error)
        // If it's a table doesn't exist error, provide helpful message
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          return NextResponse.json(
            {
              error: "Database not properly set up. Please run the database setup script first.",
              sites: [],
            },
            { status: 200 },
          )
        }
        return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
      }

      console.log(`Found ${sites?.length || 0} sites for user`)
      return NextResponse.json({ sites: sites || [] })
    } catch (dbError: any) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed. Please check your Supabase configuration.",
          sites: [],
        },
        { status: 200 },
      )
    }
  } catch (error: any) {
    console.error("Sites fetch error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch sites",
        sites: [],
      },
      { status: 500 },
    )
  }
}
