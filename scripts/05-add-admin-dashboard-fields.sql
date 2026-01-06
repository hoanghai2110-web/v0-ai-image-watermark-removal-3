-- Add admin field to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update RLS to allow admins to bypass restrictions
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view their own profile or admins view all" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin_user(auth.uid()));

CREATE POLICY "Users can update their own profile or admins update all" ON profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin_user(auth.uid()));

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_admin = TRUE);
END;
$$ LANGUAGE plpgsql;

-- Update service role access for usage_logs
DROP POLICY IF EXISTS "Users can view their own usage" ON usage_logs;
DROP POLICY IF EXISTS "Users can update their own usage" ON usage_logs;

CREATE POLICY "Users can view their own usage or admins view all" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id OR is_admin_user(auth.uid()));

CREATE POLICY "Users can update their own usage or admins update all" ON usage_logs
  FOR ALL USING (auth.uid() = user_id OR is_admin_user(auth.uid()));

-- Allow admin access to referral tables
DROP POLICY IF EXISTS "Users can view their own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Affiliates can view their referrals" ON referrals;
DROP POLICY IF EXISTS "Affiliates can view their earnings" ON affiliate_earnings;

CREATE POLICY "Users can view their own or admins view all referral codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id OR is_admin_user(auth.uid()));

CREATE POLICY "Affiliates can view their own or admins view all referrals" ON referrals
  FOR SELECT USING (auth.uid() = affiliate_id OR is_admin_user(auth.uid()));

CREATE POLICY "Affiliates can view their own or admins view all earnings" ON affiliate_earnings
  FOR SELECT USING (auth.uid() = affiliate_id OR is_admin_user(auth.uid()));
