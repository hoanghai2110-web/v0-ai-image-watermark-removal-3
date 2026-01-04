import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// This route helps set up the referral schema
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if tables exist by querying them
    const { data, error } = await supabase.from("referral_codes").select("id").limit(1)

    if (error) {
      return NextResponse.json(
        {
          error: "Database schema not set up",
          message: "Please run the SQL script in scripts/02-create-referral-schema.sql",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Referral schema is set up correctly",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
