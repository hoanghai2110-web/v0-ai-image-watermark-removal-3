import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { email, password, referralCode } = await req.json()

    const supabase = await createClient()

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window?.location?.origin,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (referralCode && data.user?.id) {
      try {
        const { data: codeData } = await supabase
          .from("referral_codes")
          .select("user_id")
          .eq("code", referralCode)
          .single()

        if (codeData) {
          await supabase.from("referrals").insert({
            affiliate_id: codeData.user_id,
            referred_user_id: data.user.id,
            referral_code: referralCode,
            status: "active",
          })
        }
      } catch (refError) {
        console.error("[v0] Error tracking referral:", refError)
      }
    }

    return NextResponse.json({ user: data.user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
