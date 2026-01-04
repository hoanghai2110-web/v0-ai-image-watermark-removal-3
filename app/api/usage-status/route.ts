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

    // Try to get user profile, but don't fail if table doesn't exist
    let isPremium = false
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()

    if (!profileError && profile) {
      isPremium = profile.is_premium
    }

    // Try to get daily usage count, but don't fail if function doesn't exist
    let usageCount = 0
    const { data: usageData, error: usageError } = await supabase.rpc("get_daily_usage_count", {
      p_user_id: user.id,
    })

    if (!usageError && typeof usageData === "number") {
      usageCount = usageData
    }

    return NextResponse.json({
      authenticated: true,
      email: user.email,
      isPremium,
      usageCount,
      usageLimit: isPremium ? 500 : 5,
    })
  } catch (error) {
    // Return a generic error but don't expose internal details
    return NextResponse.json({
      authenticated: false,
      isPremium: false,
      usageCount: 0,
      usageLimit: 5,
    })
  }
}
