import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { watermarkRemover } from "@/lib/watermark-remover"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để sử dụng tính năng này" }, { status: 401 })
    }

    // Get user profile to check premium status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single()

    console.log("[v0] Profile check - is_premium:", profile?.is_premium)

    if (profileError) {
      console.error("[v0] Profile Error:", profileError)
      return NextResponse.json({ error: "Lỗi tải thông tin người dùng" }, { status: 500 })
    }

    // Check usage limit for free users
    if (!profile.is_premium) {
      console.log("[v0] Checking usage for free user:", user.id)

      const { data: logs, error: usageError } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

      console.log("[v0] Usage logs found:", logs?.length || 0)

      if (usageError) {
        console.error("[v0] Usage Count Error:", usageError)
        return NextResponse.json({ error: "Lỗi kiểm tra giới hạn sử dụng" }, { status: 500 })
      }

      const usageCount = logs?.length || 0
      if (usageCount >= 5) {
        console.log("[v0] User exceeded daily limit")
        return NextResponse.json(
          {
            error: "Bạn đã hết lượt dùng miễn phí hôm nay (5/5). Vui lòng nâng cấp Premium để sử dụng không giới hạn.",
          },
          { status: 403 },
        )
      }
    }

    const formData = await req.formData()
    const image = formData.get("image") as Blob

    if (!image) {
      return NextResponse.json({ error: "Không tìm thấy ảnh" }, { status: 400 })
    }

    console.log("[v0] Processing image locally with Reverse Alpha Blending")

    const imageBuffer = Buffer.from(await image.arrayBuffer())
    const processedBuffer = await watermarkRemover.removeWatermark(imageBuffer)

    const base64Image = processedBuffer.toString("base64")
    console.log("[v0] Watermark removed successfully, size:", base64Image.length)

    const { error: logError } = await supabase.from("usage_logs").insert({
      user_id: user.id,
    })

    if (logError) {
      console.error("[v0] Usage Log Error:", logError)
    }

    return NextResponse.json({ image: `data:image/png;base64,${base64Image}` })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 })
  }
}
