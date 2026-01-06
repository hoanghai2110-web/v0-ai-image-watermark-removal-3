import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin status
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all users with stats
    const { data: users } = await adminClient
      .from("profiles")
      .select("id, email, is_premium, created_at, updated_at")
      .order("created_at", { ascending: false })

    return NextResponse.json(users)
  } catch (error) {
    console.error("[v0] Users fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin status
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await req.json()

    // Delete user data from tables
    await adminClient.from("usage_logs").delete().eq("user_id", userId)
    await adminClient.from("referral_codes").delete().eq("user_id", userId)
    await adminClient.from("profiles").delete().eq("id", userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] User delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
