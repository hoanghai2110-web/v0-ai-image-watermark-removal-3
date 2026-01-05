import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] FATAL: SUPABASE_SERVICE_ROLE_KEY is not set!")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const rawBody = await req.text()
    const signature = req.headers.get("x-signature")
    const secret = process.env.LEMON_SQUEEZY_SIGNING_SECRET

    if (!signature || !secret) {
      console.log("[v0] Webhook rejected: missing signature or secret")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", secret)
    const digest = hmac.update(rawBody).digest("hex")

    if (signature !== digest) {
      console.log("[v0] Webhook rejected: invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta.event_name
    const attributes = payload.data.attributes
    const customData = payload.meta.custom_data || {}

    console.log("[v0] Webhook received:", { eventName, customData, userEmail: attributes.user_email })

    const supabase = createAdminClient()

    try {
      const { error: testError } = await supabase.from("profiles").select("count()", { count: "exact" }).limit(1)
      if (testError) {
        console.error("[v0] Database connection error:", testError)
        return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
      }
    } catch (connError) {
      console.error("[v0] Error testing database connection:", connError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    if (eventName === "order_created") {
      const userEmail = attributes.user_email
      const customerId = attributes.customer_id?.toString()
      const orderTotal = Number.parseFloat(attributes.total || attributes.total_amount || "0")

      console.log("[v0] Processing order_created:", { userEmail, orderTotal, customerId })

      if (userEmail) {
        // Find user by email and update to premium
        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", userEmail)
          .single()

        if (findError || !profile) {
          console.error("[v0] Could not find user with email:", userEmail, findError)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        } else {
          const userId = profile.id
          console.log("[v0] Found user:", userId, "email:", userEmail)

          // Update user to premium immediately
          const { error: profileError, data: updatedProfile } = await supabase
            .from("profiles")
            .update({
              is_premium: true,
              lemon_squeezy_customer_id: customerId,
            })
            .eq("id", userId)
            .select()

          if (profileError) {
            console.error("[v0] Error updating profile for order:", profileError)
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
          } else {
            console.log(
              "[v0] User marked as premium from order:",
              userId,
              userEmail,
              "is_premium:",
              updatedProfile?.[0]?.is_premium,
            )
          }

          // Check if user has a referrer and record commission
          if (orderTotal > 0) {
            try {
              const { data: referralData } = await supabase
                .from("referrals")
                .select("affiliate_id")
                .eq("referred_user_id", userId)
                .single()

              if (referralData?.affiliate_id) {
                const COMMISSION_RATE = 0.3
                const commissionAmount = orderTotal * COMMISSION_RATE

                const { error: earningError } = await supabase.from("affiliate_earnings").insert({
                  affiliate_id: referralData.affiliate_id,
                  referred_user_id: userId,
                  subscription_id: payload.data.id?.toString() || `order-${Date.now()}`,
                  purchase_amount: orderTotal,
                  commission_amount: commissionAmount,
                  status: "completed",
                })

                if (!earningError) {
                  console.log("[v0] Affiliate commission recorded:", {
                    affiliateId: referralData.affiliate_id,
                    commission: commissionAmount,
                  })
                } else {
                  console.error("[v0] Error recording affiliate earning:", earningError)
                }
              }
            } catch (refError) {
              console.error("[v0] Error checking referral:", refError)
            }
          }
        }
      }
    }

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const userId = customData?.user_id
      const status = attributes.status // 'active', 'on_trial', 'cancelled', etc.
      const customerId = attributes.customer_id?.toString()
      const subscriptionId = payload.data.id?.toString()

      console.log("[v0] Processing subscription event:", { eventName, userId, status })

      if (userId) {
        const isPremium = status === "active" || status === "on_trial"

        const { error } = await supabase
          .from("profiles")
          .update({
            is_premium: isPremium,
            lemon_squeezy_customer_id: customerId,
            subscription_id: subscriptionId,
            subscription_status: status,
          })
          .eq("id", userId)

        if (error) {
          console.error("[v0] Error updating profile via subscription webhook:", error)
        } else {
          console.log("[v0] Profile updated from subscription:", { userId, isPremium, status })
        }
      }
    } else if (eventName === "subscription_expired" || eventName === "subscription_terminated") {
      const userId = customData?.user_id
      console.log("[v0] Processing subscription termination:", { eventName, userId })

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_premium: false,
            subscription_status: "expired",
          })
          .eq("id", userId)

        if (error) {
          console.error("[v0] Error updating profile on subscription expiry:", error)
        } else {
          console.log("[v0] User premium status removed:", userId)
        }
      }
    } else if (eventName === "affiliate_activated") {
      const affiliateId = customData?.affiliate_id
      const referredUserId = customData?.referred_user_id
      const subscriptionId = payload.data.id?.toString()
      const purchaseAmount = Number.parseFloat(attributes.total_amount || attributes.price || "0")

      console.log("[v0] Processing affiliate_activated:", { affiliateId, referredUserId, purchaseAmount })

      if (affiliateId && referredUserId && purchaseAmount > 0) {
        try {
          const COMMISSION_RATE = 0.3
          const commissionAmount = purchaseAmount * COMMISSION_RATE

          const { error } = await supabase.from("affiliate_earnings").insert({
            affiliate_id: affiliateId,
            referred_user_id: referredUserId,
            subscription_id: subscriptionId,
            purchase_amount: purchaseAmount,
            commission_amount: commissionAmount,
            status: "completed",
          })

          if (!error) {
            console.log("[v0] Affiliate earning recorded from affiliate_activated:", {
              affiliateId,
              commission: commissionAmount,
              purchaseAmount,
            })
          } else {
            console.error("[v0] Error recording earning:", error)
          }
        } catch (error) {
          console.error("[v0] Error processing affiliate earning:", error)
        }
      }
    }

    console.log("[v0] Webhook processed successfully:", eventName)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
