import { createClient } from "@supabase/supabase-js"

/**
 * Admin client using service role key - bypasses RLS for webhooks and admin operations.
 * Only use this in secure server-side contexts (API routes, server actions).
 * NEVER expose the service role key to the client.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
