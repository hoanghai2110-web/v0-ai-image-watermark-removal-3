import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    /* --------------------------------------------------
       1. Verify ENV
    -------------------------------------------------- */
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
      console.error("[WEBHOOK] Missing Supabase admin env")
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }

    const secret = process.env.LEMON_SQUEEZY_SIGNING_SECRET
    if (!secret) {
      console.error("[WEBHOOK] Missing LemonSqueezy secret")
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }

    /* --------------------------------------------------
       2. Verify Signature
    -------------------------------------------------- */
    const rawBody = await req.text()
    const signature = req.headers.get("x-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")

    if (digest !== signature) {
      console.error("[WEBHOOK] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    /* --------------------------------------------------
       3. Parse Payload
    -------------------------------------------------- */
    const payload = JSON.parse(rawBody)
    const eventName = payload?.meta?.event_name
    const attributes = payload?.data?.attributes
    const customData = payload?.meta?.custom_data ?? {}

    console.log("[WEBHOOK] Event:", eventName)

    const supabase = createAdminClient()

    /* --------------------------------------------------
       4. ORDER CREATED → SET PREMIUM + TRACK AFFILIATE
    -------------------------------------------------- */
    if (eventName === "order_created") {
      const email = attributes?.user_email
      const orderId = payload?.data?.id?.toString()
      const totalPrice = attributes?.total ?? 0

      if (!email) {
        return NextResponse.json({ error: "Missing user email" }, { status: 400 })
      }

      // find profile
      const { data: profile, error: findError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single()

      if (findError || !profile) {
        console.error("[WEBHOOK] Profile not found:", email)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // update premium
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          lemon_squeezy_customer_id: attributes.customer_id?.toString() ?? null,
        })
        .eq("id", profile.id)

      if (updateError) {
        console.error("[WEBHOOK] Update failed:", updateError)
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
      }

      console.log("[WEBHOOK] Premium enabled for:", email)

      const { data: referralData } = await supabase
        .from("referrals")
        .select("affiliate_id")
        .eq("referred_user_id", profile.id)
        .single()

      if (referralData?.affiliate_id) {
        const commissionAmount = Math.round((totalPrice * 0.3 * 100) / 100)

        const { error: earningError } = await supabase.from("affiliate_earnings").insert({
          affiliate_id: referralData.affiliate_id,
          referred_user_id: profile.id,
          subscription_id: orderId || "unknown",
          purchase_amount: totalPrice,
          commission_amount: commissionAmount,
          status: "completed",
        })

        if (earningError) {
          console.error("[WEBHOOK] Failed to record affiliate earning:", earningError)
        } else {
          console.log("[WEBHOOK] Affiliate earnings recorded:", {
            affiliateId: referralData.affiliate_id,
            referredUserId: profile.id,
            commissionAmount,
            purchaseAmount: totalPrice,
          })
        }
      }
    }

    /* --------------------------------------------------
       5. SUBSCRIPTION EVENTS
    -------------------------------------------------- */
    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const userId = customData.user_id
      const status = attributes.status

      if (userId) {
        const isPremium = status === "active" || status === "on_trial"

        await supabase
          .from("profiles")
          .update({
            is_premium: isPremium,
            subscription_status: status,
            subscription_id: payload.data.id?.toString(),
          })
          .eq("id", userId)

        console.log("[WEBHOOK] Subscription update:", userId, status)
      }
    }

    if (eventName === "subscription_expired" || eventName === "subscription_terminated") {
      const userId = customData.user_id

      if (userId) {
        await supabase
          .from("profiles")
          .update({
            is_premium: false,
            subscription_status: "expired",
          })
          .eq("id", userId)

        console.log("[WEBHOOK] Subscription expired:", userId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[WEBHOOK] Fatal error:", err)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
