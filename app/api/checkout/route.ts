import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createCheckout, LEMON_SQUEEZY_VARIANT_ID } from "@/lib/lemon-squeezy"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL("/auth/login", req.url)
      loginUrl.searchParams.set("returnTo", "/pricing")
      return NextResponse.redirect(loginUrl)
    }

    if (!LEMON_SQUEEZY_VARIANT_ID) {
      console.error("[v0] Missing LEMON_SQUEEZY_VARIANT_ID")
      throw new Error("Cấu hình thanh toán chưa hoàn tất (thiếu Variant ID)")
    }

    const checkoutUrl = await createCheckout({
      userId: user.id,
      userEmail: user.email!,
      variantId: LEMON_SQUEEZY_VARIANT_ID,
    })

    if (!checkoutUrl) {
      throw new Error("Không thể tạo liên kết thanh toán")
    }

    return NextResponse.redirect(checkoutUrl, { status: 303 })
  } catch (error: any) {
    console.error("[v0] Checkout error details:", error)
    let errorMsg = error.message || "checkout-failed"

    if (errorMsg.includes("related resource")) {
      errorMsg = "Lỗi: Store ID hoặc Variant ID không tồn tại trên Lemon Squeezy. Vui lòng kiểm tra lại cấu hình."
    }

    return NextResponse.redirect(new URL(`/pricing?error=${encodeURIComponent(errorMsg)}`, req.url))
  }
}
