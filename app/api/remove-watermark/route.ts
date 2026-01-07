import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    if (profileError) {
      console.error("[v0] Profile Error:", profileError)
      return NextResponse.json({ error: "Lỗi tải thông tin người dùng" }, { status: 500 })
    }

    // Check usage limit for free users
    if (!profile.is_premium) {
      const { data: usageCount, error: usageError } = await supabase.rpc("get_daily_usage_count", {
        p_user_id: user.id,
      })

      if (usageError) {
        console.error("[v0] Usage Count Error:", usageError)
        return NextResponse.json({ error: "Lỗi kiểm tra giới hạn sử dụng" }, { status: 500 })
      }

      if (usageCount >= 5) {
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

    const geminiFormData = new FormData()
    geminiFormData.append("image", image)

    console.log("[v0] Sending request to Gemini API...")

    const response = await fetch("https://7d1f9940.gemini-bin.pages.dev/api/remove-sparkle", {
      method: "POST",
      body: geminiFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Gemini API Error:", errorText)
      try {
        const errorJson = JSON.parse(errorText)
        return NextResponse.json({ error: `Lỗi xử lý ảnh: ${errorJson.error}` }, { status: response.status })
      } catch {
        return NextResponse.json({ error: "Lỗi xử lý ảnh" }, { status: response.status })
      }
    }

    const imageBlob = await response.blob()
    const buffer = await imageBlob.arrayBuffer()
    const base64Image = Buffer.from(buffer).toString("base64")

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
