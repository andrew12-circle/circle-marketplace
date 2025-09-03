-- Add notification preference columns to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS weekly_stats_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_stats_frequency text DEFAULT 'weekly' CHECK (weekly_stats_frequency IN ('weekly', 'biweekly', 'monthly')),
ADD COLUMN IF NOT EXISTS stats_include_views boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS stats_include_bookings boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS stats_include_revenue boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS stats_include_conversions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS review_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS agreement_reminders_enabled boolean DEFAULT true;