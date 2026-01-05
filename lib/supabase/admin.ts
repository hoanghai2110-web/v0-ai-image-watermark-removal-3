import { createClient } from "@supabase/supabase-js"

/**
 * Admin client using service role key
 * Server-side only
 */
export function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,                 // ✅ server env
    process.env.SUPABASE_SERVICE_ROLE_KEY!,    // ✅ service role
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
