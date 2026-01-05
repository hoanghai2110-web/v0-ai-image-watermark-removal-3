import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        isPremium: false,
        usageCount: 0,
        usageLimit: 5,
      })
    }

    let isPremium = false
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()

    if (!profileError && profile) {
      isPremium = profile.is_premium
    }

    let usageCount = 0
    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("usage_count")
      .eq("user_id", user.id)
      .eq("used_at", new Date().toISOString().split("T")[0])
      .single()

    if (!usageError && usageData) {
      usageCount = usageData.usage_count
    }

    return NextResponse.json({
      authenticated: true,
      email: user.email,
      isPremium,
      usageCount,
      usageLimit: isPremium ? 500 : 5,
    })
  } catch (error) {
    console.error("[v0] Usage status error:", error)
    return NextResponse.json({
      authenticated: false,
      isPremium: false,
      usageCount: 0,
      usageLimit: 5,
    })
  }
}
