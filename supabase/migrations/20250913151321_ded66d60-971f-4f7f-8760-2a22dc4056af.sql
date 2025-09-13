-- Add pricing and subscription management enhancements
-- Update subscribers table with additional fields for plan management
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS plan_interval text DEFAULT 'month';
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS pro_price_id text;

-- Create webhook events table for processing tracking
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  raw_data jsonb NOT NULL,
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Enable RLS on webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhook_events (admin only)
CREATE POLICY "Admins can manage webhook events" ON public.webhook_events
FOR ALL USING (get_user_admin_status());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON public.subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_period_end ON public.subscribers(current_period_end);

-- Update existing subscribers with plan_interval if null
UPDATE public.subscribers 
SET plan_interval = 'month' 
WHERE plan_interval IS NULL;