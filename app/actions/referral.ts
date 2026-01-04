"use server"

import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

const COMMISSION_RATE = 0.3 // 30% commission

function generateReferralCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase().slice(0, 12)
}

async function createReferralCode(userId: string): Promise<string> {
  const supabase = await createClient()
  const code = generateReferralCode()

  const { data, error } = await supabase
    .from("referral_codes")
    .insert({
      user_id: userId,
      code,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating referral code:", error)
    throw new Error(`Failed to create referral code: ${error.message}`)
  }

  return code
}

async function trackReferral(referralCode: string, referredUserId: string): Promise<void> {
  const supabase = await createClient()

  const { data: codeData, error: codeError } = await supabase
    .from("referral_codes")
    .select("user_id")
    .eq("code", referralCode)
    .single()

  if (codeError || !codeData) {
    console.error("[v0] Referral code not found:", referralCode)
    return
  }

  const affiliateId = codeData.user_id

  const { error: refError } = await supabase
    .from("referrals")
    .insert({
      affiliate_id: affiliateId,
      referred_user_id: referredUserId,
      referral_code: referralCode,
      status: "active",
    })
    .select()

  if (refError) {
    console.error("[v0] Error creating referral record:", refError)
    throw new Error(`Failed to create referral: ${refError.message}`)
  }

  console.log("[v0] Referral tracked:", {
    affiliateId,
    referredUserId,
    referralCode,
  })
}

export async function trackReferralAction(referralCode: string, userId: string) {
  try {
    await trackReferral(referralCode, userId)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error tracking referral action:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getOrCreateReferralCodeAction(userId: string): Promise<string> {
  const supabase = await createClient()

  const { data: existing } = await supabase.from("referral_codes").select("code").eq("user_id", userId).single()

  if (existing?.code) {
    return existing.code
  }

  return createReferralCode(userId)
}

export async function recordAffiliateEarningAction(
  affiliateId: string,
  referredUserId: string,
  subscriptionId: string,
  purchaseAmount: number,
): Promise<number> {
  const supabase = await createClient()

  const commissionAmount = purchaseAmount * COMMISSION_RATE

  const { error } = await supabase
    .from("affiliate_earnings")
    .insert({
      affiliate_id: affiliateId,
      referred_user_id: referredUserId,
      subscription_id: subscriptionId,
      purchase_amount: purchaseAmount,
      commission_amount: commissionAmount,
      status: "completed",
    })
    .select()

  if (error) {
    console.error("[v0] Error recording affiliate earning:", error)
    throw new Error(`Failed to record earning: ${error.message}`)
  }

  console.log("[v0] Affiliate earning recorded:", {
    affiliateId,
    referredUserId,
    commissionAmount,
    purchaseAmount,
  })

  return commissionAmount
}

export async function getAffiliateStatsAction(userId: string): Promise<{
  totalReferrals: number
  totalEarnings: number
  pendingEarnings: number
  completedEarnings: number
}> {
  const supabase = await createClient()

  const { count: referralCount, error: refError } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("affiliate_id", userId)

  const { data: earnings, error: earningsError } = await supabase
    .from("affiliate_earnings")
    .select("commission_amount, status")
    .eq("affiliate_id", userId)

  if (refError || earningsError) {
    console.error("[v0] Error fetching affiliate stats:", { refError, earningsError })
    return {
      totalReferrals: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      completedEarnings: 0,
    }
  }

  const totalEarnings = earnings?.reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount as any) || 0), 0) || 0
  const pendingEarnings =
    earnings
      ?.filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount as any) || 0), 0) || 0
  const completedEarnings =
    earnings
      ?.filter((e) => e.status === "completed")
      .reduce((sum, e) => sum + (Number.parseFloat(e.commission_amount as any) || 0), 0) || 0

  return {
    totalReferrals: referralCount || 0,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    pendingEarnings: Math.round(pendingEarnings * 100) / 100,
    completedEarnings: Math.round(completedEarnings * 100) / 100,
  }
}
