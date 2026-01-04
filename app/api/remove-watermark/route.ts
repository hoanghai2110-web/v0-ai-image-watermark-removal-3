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
    const mask = formData.get("mask") as Blob

    if (!image) {
      return NextResponse.json({ error: "Không tìm thấy ảnh" }, { status: 400 })
    }

    const stabilityFormData = new FormData()
    stabilityFormData.append("init_image", image)
    if (mask) {
      stabilityFormData.append("mask_image", mask)
    }
    stabilityFormData.append("mask_source", "MASK_IMAGE_WHITE")

    stabilityFormData.append(
      "text_prompts[0][text]",
      "seamless background, high quality, clean texture, no logos, no text",
    )
    stabilityFormData.append("text_prompts[0][weight]", "1")

    stabilityFormData.append("cfg_scale", "7")
    stabilityFormData.append("clip_guidance_preset", "FAST_BLUE")
    stabilityFormData.append("sampler", "K_DPM_2_ANCESTRAL")
    stabilityFormData.append("samples", "1")
    stabilityFormData.append("steps", "30")

    console.log("[v0] Sending request to Stability AI...")

    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image/masking",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "application/json",
        },
        body: stabilityFormData,
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Stability AI Error Details:", errorText)
      return NextResponse.json({ error: `Lỗi từ Stability AI: ${errorText}` }, { status: response.status })
    }

    const result = await response.json()
    const base64Image = result.artifacts[0].base64

    const { error: logError } = await supabase.from("usage_logs").insert({
      user_id: user.id,
    })

    if (logError) {
      console.error("[v0] Usage Log Error:", logError)
      // Don't fail the request if logging fails, just log the error
    }

    return NextResponse.json({ image: `data:image/png;base64,${base64Image}` })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 })
  }
}
