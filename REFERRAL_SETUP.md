# Referral System Setup Guide

## Quick Start

The referral system is now fully integrated! Here's what to do:

### Step 1: Create the Database Schema

Run this SQL script in your Supabase SQL Editor:

**File:** `scripts/02-create-referral-schema.sql`

Copy the entire content and execute it in Supabase Dashboard:
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Paste the content from `scripts/02-create-referral-schema.sql`
5. Click "Run"

### Step 2: Set Up Lemon Squeezy Webhook

1. Go to Lemon Squeezy Dashboard
2. Go to Settings → Webhooks
3. Create a new webhook with:
   - **Event:** `affiliate_activated`
   - **URL:** `https://your-domain.com/api/webhooks/lemonsqueezy`
   - **Signing Secret:** Copy your `LEMON_SQUEEZY_SIGNING_SECRET`

### Step 3: Test the System

1. KOL/Affiliate goes to `/affiliate`
2. Copies the referral link: `https://your-domain.com?ref=ABC123DEF456`
3. Shares it with users
4. Users click the link and sign up
5. When users purchase Pro plan, KOL gets 30% commission

## How It Works

### For KOL/Affiliates:
- Each user gets a unique referral code automatically
- Visit `/affiliate` to see their referral link
- Dashboard shows total referrals, earnings, pending payouts
- 30% commission on first month of referred user's Pro subscription

### For Referred Users:
- Click referral link: `?ref=ABC123`
- Sign up and the referral is tracked
- No extra cost - they just get counted as referred
- When they upgrade to Pro, KOL gets 30%

### Database Tables Created:

1. **referral_codes** - Maps user ID to their unique referral code
2. **referrals** - Tracks when someone signs up with a referral code
3. **affiliate_earnings** - Records each commission payment

All tables have RLS policies - users can only see their own data.

## API Endpoints

- `GET /affiliate` - Affiliate dashboard page (requires auth)
- `GET /api/affiliate/stats` - Get affiliate stats (requires auth)
- `POST /api/webhooks/lemonsqueezy` - Webhook handler for Lemon Squeezy
- `POST /api/auth/signup` - Signup with referral code support

## Environment Variables

Make sure these are set:
- `LEMON_SQUEEZY_SIGNING_SECRET` - For webhook verification
- `NEXT_PUBLIC_SUPABASE_URL` - For client-side
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For client-side
- `SUPABASE_URL` - For server-side
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side

## Troubleshooting

**Error: "Could not find the table 'public.referral_codes'"**
- The SQL schema hasn't been created yet
- Run Step 1 above

**Referrals not tracking:**
- Check browser console for errors
- Verify the `ref` parameter is in the URL
- Check Supabase logs

**Commissions not recorded:**
- Verify Lemon Squeezy webhook is set up correctly
- Check webhook signature secret matches
- Look at Supabase logs for webhook errors

## Support

For issues or questions, check the console logs for `[v0]` debug messages.
