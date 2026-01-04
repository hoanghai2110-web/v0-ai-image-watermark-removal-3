import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: existing } = await supabase.from("referral_codes").select("code").eq("user_id", user.id).single()

    let referralCode = existing?.code

    if (!referralCode) {
      const crypto = await import("crypto")
      referralCode = crypto.randomBytes(8).toString("hex").toUpperCase().slice(0, 12)

      await supabase.from("referral_codes").insert({
        user_id: user.id,
        code: referralCode,
      })
    }

    const { count: referralCount } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_id", user.id)

    const { data: earnings } = await supabase
      .from("affiliate_earnings")
      .select("commission_amount, status")
      .eq("affiliate_id", user.id)

    const totalEarnings =
      earnings?.reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount as any) || 0), 0) || 0
    const pendingEarnings =
      earnings
        ?.filter((e) => e.status === "pending")
        .reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount as any) || 0), 0) || 0
    const completedEarnings =
      earnings
        ?.filter((e) => e.status === "completed")
        .reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount as any) || 0), 0) || 0

    return Response.json({
      referralCode,
      totalReferrals: referralCount || 0,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      pendingEarnings: Math.round(pendingEarnings * 100) / 100,
      completedEarnings: Math.round(completedEarnings * 100) / 100,
    })
  } catch (error: any) {
    console.error("[v0] Affiliate stats error:", error)
    return Response.json({ error: error.message || "Failed to fetch stats" }, { status: 500 })
  }
}
