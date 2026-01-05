-- Allow service role to bypass RLS and update profiles for webhooks
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Service role already has full access via the is_granted_by_role_in_policy function
-- Just ensure the existing RLS policies allow authenticated users their own data

-- Recreate policies if they don't exist (idempotent)
CREATE POLICY IF NOT EXISTS "Service role can update any profile" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can insert affiliate earnings" ON affiliate_earnings
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = affiliate_id);

CREATE POLICY IF NOT EXISTS "Service role can view all referrals" ON referrals
  FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() = affiliate_id);

CREATE POLICY IF NOT EXISTS "Service role can insert referrals" ON referrals
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Ensure webhook can create earnings
CREATE POLICY IF NOT EXISTS "Webhook can record earnings" ON affiliate_earnings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
