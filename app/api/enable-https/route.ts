import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { enableHttpsForSite, checkHttpsStatus } from "@/lib/github"

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { subdomain, action = "enable" } = await request.json()

    if (!subdomain) {
      return NextResponse.json({ error: "Missing subdomain" }, { status: 400 })
    }

    // Verify the user owns this site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("subdomain", subdomain)
      .eq("user_id", session.user.id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    try {
      if (action === "check") {
        // Just check the status
        const status = await checkHttpsStatus(subdomain)
        return NextResponse.json({
          success: true,
          status: status.status,
          httpsEnforced: status.httpsEnforced,
          ready: status.ready,
          canEnableHttps: status.canEnableHttps,
          message: status.ready
            ? status.httpsEnforced
              ? "HTTPS is already enabled"
              : "Ready to enable HTTPS"
            : `Site is building (${status.status}). Please wait a few minutes.`,
        })
      } else {
        // Try to enable HTTPS
        const result = await enableHttpsForSite(subdomain)
        return NextResponse.json({
          success: true,
          message: result.message,
          status: result.status,
        })
      }
    } catch (error: any) {
      console.error("HTTPS operation error:", error)

      // Provide user-friendly error messages
      let userMessage = error.message

      if (error.message.includes("certificate") || error.message.includes("SSL")) {
        userMessage =
          "SSL certificate is not ready yet. This usually takes 10-15 minutes after creating the site. Please try again later."
      } else if (error.message.includes("domain")) {
        userMessage = "Domain verification is in progress. Please wait a few minutes and try again."
      } else if (error.message.includes("not ready")) {
        userMessage = "Your site is still being built. Please wait a few minutes and try again."
      }

      return NextResponse.json(
        {
          error: userMessage,
          canRetry: true,
          technical: error.message, // Include technical details for debugging
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("Enable HTTPS error:", error)
    return NextResponse.json({ error: error.message || "Failed to process HTTPS request" }, { status: 500 })
  }
}
