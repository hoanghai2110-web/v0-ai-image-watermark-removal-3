-- Fix the RPC function parameter name and ensures tables exist properly
-- This script fixes the "Could not find the function public.get_daily_usage_count(p_user_id)" error

-- Re-create profiles table if it doesn't exist (safety check)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-create usage_logs table if it doesn't exist (safety check)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'remove-watermark'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop and re-create the function with the CORRECT parameter name 'p_user_id'
-- The error log showed it was searching for 'p_user_id'
DROP FUNCTION IF EXISTS public.get_daily_usage_count(uuid);

CREATE OR REPLACE FUNCTION public.get_daily_usage_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.usage_logs
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple RLS Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_logs;
CREATE POLICY "Users can view their own usage" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage_logs;
CREATE POLICY "Users can insert their own usage" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
