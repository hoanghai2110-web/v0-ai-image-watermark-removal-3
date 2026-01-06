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

    // Fetch stats
    const { data: profiles } = await adminClient.from("profiles").select("id, email, is_premium, created_at")

    const { data: earnings } = await adminClient
      .from("affiliate_earnings")
      .select("commission_amount, created_at, status")

    const { data: usageLogs } = await adminClient.from("usage_logs").select("used_at, usage_count")

    // Calculate stats
    const totalUsers = profiles?.length || 0
    const proUsers = profiles?.filter((p) => p.is_premium).length || 0
    const totalRevenue = earnings?.reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount) || 0), 0) || 0

    const today = new Date().toISOString().split("T")[0]
    const todayRevenue =
      earnings
        ?.filter((e) => e.created_at?.startsWith(today) && e.status === "completed")
        .reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount) || 0), 0) || 0

    // Calculate monthly revenue
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyRevenue =
      earnings
        ?.filter((e) => e.created_at?.startsWith(currentMonth) && e.status === "completed")
        .reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount) || 0), 0) || 0

    return NextResponse.json({
      totalUsers,
      proUsers,
      totalRevenue: totalRevenue.toFixed(2),
      todayRevenue: todayRevenue.toFixed(2),
      monthlyRevenue: monthlyRevenue.toFixed(2),
      freeUsers: totalUsers - proUsers,
    })
  } catch (error) {
    console.error("[v0] Stats fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
