-- Add pricing and subscription management enhancements (fixed v2)
-- Update subscribers table with additional fields for plan management
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS plan_interval text DEFAULT 'month';
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS pro_price_id text;

-- Add missing columns to webhook_events if they don't exist
DO $$
BEGIN
    -- Add stripe_event_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'webhook_events' 
                   AND column_name = 'stripe_event_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.webhook_events ADD COLUMN stripe_event_id text;
    END IF;
    
    -- Add processed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'webhook_events' 
                   AND column_name = 'processed' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.webhook_events ADD COLUMN processed boolean DEFAULT false;
    END IF;
    
    -- Add processing_error column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'webhook_events' 
                   AND column_name = 'processing_error' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.webhook_events ADD COLUMN processing_error text;
    END IF;
    
    -- Add processed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'webhook_events' 
                   AND column_name = 'processed_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.webhook_events ADD COLUMN processed_at timestamptz;
    END IF;
END $$;

-- Add unique constraint on stripe_event_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'webhook_events_stripe_event_id_key') THEN
        ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_stripe_event_id_key UNIQUE (stripe_event_id);
    END IF;
END $$;

-- Create indexes for performance (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON public.subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_period_end ON public.subscribers(current_period_end);

-- Update existing subscribers with plan_interval if null
UPDATE public.subscribers 
SET plan_interval = 'month' 
WHERE plan_interval IS NULL;