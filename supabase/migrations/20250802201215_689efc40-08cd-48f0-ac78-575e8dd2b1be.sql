-- Enhanced creator analytics and payment system

-- Enhanced content analytics with detailed tracking
CREATE TABLE public.creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  content_id UUID,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  
  -- Content engagement metrics
  total_plays INTEGER DEFAULT 0,
  total_watch_time_minutes INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0, -- Percentage
  
  -- Revenue metrics
  revenue_generated NUMERIC DEFAULT 0.00,
  creator_share_percentage NUMERIC DEFAULT 25.00,
  creator_earnings NUMERIC DEFAULT 0.00,
  
  -- Platform metrics
  platform_total_revenue NUMERIC DEFAULT 0.00, -- Total platform revenue for the month
  creator_revenue_percentage NUMERIC DEFAULT 0.00, -- Creator's share of total platform revenue
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Creator payment information table
CREATE TABLE public.creator_payment_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE,
  
  -- Payment method preference
  payment_method TEXT NOT NULL DEFAULT 'stripe', -- stripe, paypal, bank_transfer
  
  -- Stripe info (for direct transfers)
  stripe_account_id TEXT,
  stripe_onboarding_completed BOOLEAN DEFAULT false,
  
  -- Bank transfer info (encrypted/secure)
  bank_account_holder TEXT,
  bank_routing_number TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  
  -- PayPal info
  paypal_email TEXT,
  
  -- Tax information
  tax_id TEXT, -- SSN or EIN
  tax_form_completed BOOLEAN DEFAULT false,
  
  -- Payment settings
  minimum_payout_amount NUMERIC DEFAULT 25.00,
  auto_payout_enabled BOOLEAN DEFAULT true,
  
  -- Status
  verified BOOLEAN DEFAULT false,
  verification_documents JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Monthly payout records
CREATE TABLE public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  
  -- Payout period
  payout_month TEXT NOT NULL, -- Format: YYYY-MM
  
  -- Financial details
  total_earnings NUMERIC NOT NULL DEFAULT 0.00,
  platform_fee NUMERIC DEFAULT 0.00,
  net_payout NUMERIC NOT NULL DEFAULT 0.00,
  
  -- Payment processing
  payment_method TEXT NOT NULL,
  payment_processor_fee NUMERIC DEFAULT 0.00,
  final_amount NUMERIC NOT NULL DEFAULT 0.00,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  payment_processor_id TEXT, -- Stripe transfer ID, PayPal transaction ID, etc.
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  breakdown JSONB DEFAULT '{}'::jsonb, -- Detailed breakdown of earnings
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Monthly platform revenue summary
CREATE TABLE public.monthly_platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL UNIQUE, -- Format: YYYY-MM
  
  -- Revenue breakdown
  total_subscription_revenue NUMERIC DEFAULT 0.00,
  total_one_time_payments NUMERIC DEFAULT 0.00,
  total_platform_revenue NUMERIC DEFAULT 0.00,
  
  -- Creator payouts
  total_creator_earnings NUMERIC DEFAULT 0.00,
  creator_share_percentage NUMERIC DEFAULT 25.00,
  platform_net_revenue NUMERIC DEFAULT 0.00,
  
  -- Subscriber metrics
  total_subscribers INTEGER DEFAULT 0,
  new_subscribers INTEGER DEFAULT 0,
  churned_subscribers INTEGER DEFAULT 0,
  
  -- Content metrics
  total_content_plays INTEGER DEFAULT 0,
  total_watch_time_hours NUMERIC DEFAULT 0.00,
  
  -- Calculated fields
  revenue_per_subscriber NUMERIC DEFAULT 0.00,
  average_creator_payout NUMERIC DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced content tracking for detailed analytics
CREATE TABLE public.content_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  user_id UUID,
  creator_id UUID NOT NULL,
  
  -- Event details
  event_type TEXT NOT NULL, -- play, download, complete, bookmark, share
  session_id TEXT,
  
  -- Engagement metrics
  watch_time_seconds INTEGER DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  device_type TEXT,
  
  -- Revenue tracking (for paid content)
  revenue_attributed NUMERIC DEFAULT 0.00,
  
  -- Location and context
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payment_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_engagement_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_analytics
CREATE POLICY "Creators can view their own analytics" ON public.creator_analytics
FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all analytics" ON public.creator_analytics
FOR ALL USING (get_user_admin_status());

-- RLS Policies for creator_payment_info
CREATE POLICY "Creators can manage their own payment info" ON public.creator_payment_info
FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all payment info" ON public.creator_payment_info
FOR SELECT USING (get_user_admin_status());

-- RLS Policies for creator_payouts
CREATE POLICY "Creators can view their own payouts" ON public.creator_payouts
FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all payouts" ON public.creator_payouts
FOR ALL USING (get_user_admin_status());

-- RLS Policies for monthly_platform_revenue
CREATE POLICY "Admins can view platform revenue" ON public.monthly_platform_revenue
FOR ALL USING (get_user_admin_status());

-- RLS Policies for content_engagement_events
CREATE POLICY "Users can create engagement events" ON public.content_engagement_events
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Creators can view their content engagement" ON public.content_engagement_events
FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all engagement events" ON public.content_engagement_events
FOR SELECT USING (get_user_admin_status());

-- Indexes for performance
CREATE INDEX idx_creator_analytics_creator_month ON public.creator_analytics(creator_id, month_year);
CREATE INDEX idx_creator_payouts_creator_month ON public.creator_payouts(creator_id, payout_month);
CREATE INDEX idx_content_engagement_content_creator ON public.content_engagement_events(content_id, creator_id);
CREATE INDEX idx_content_engagement_date ON public.content_engagement_events(created_at);

-- Function to update creator analytics
CREATE OR REPLACE FUNCTION update_creator_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  creator_record RECORD;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Update analytics for each creator
  FOR creator_record IN 
    SELECT DISTINCT creator_id FROM public.content WHERE creator_id IS NOT NULL
  LOOP
    INSERT INTO public.creator_analytics (
      creator_id,
      month_year,
      total_plays,
      total_watch_time_minutes,
      total_downloads,
      unique_viewers,
      revenue_generated,
      creator_earnings
    )
    SELECT 
      creator_record.creator_id,
      current_month,
      COALESCE(SUM(CASE WHEN cee.event_type = 'play' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(cee.watch_time_seconds) / 60, 0),
      COALESCE(SUM(CASE WHEN cee.event_type = 'download' THEN 1 ELSE 0 END), 0),
      COALESCE(COUNT(DISTINCT cee.user_id), 0),
      COALESCE(SUM(cee.revenue_attributed), 0),
      COALESCE(SUM(cee.revenue_attributed) * 0.25, 0) -- 25% creator share
    FROM public.content c
    LEFT JOIN public.content_engagement_events cee ON c.id = cee.content_id
    WHERE c.creator_id = creator_record.creator_id
      AND cee.created_at >= date_trunc('month', now())
      AND cee.created_at < date_trunc('month', now()) + interval '1 month'
    GROUP BY creator_record.creator_id
    
    ON CONFLICT (creator_id, month_year) DO UPDATE SET
      total_plays = EXCLUDED.total_plays,
      total_watch_time_minutes = EXCLUDED.total_watch_time_minutes,
      total_downloads = EXCLUDED.total_downloads,
      unique_viewers = EXCLUDED.unique_viewers,
      revenue_generated = EXCLUDED.revenue_generated,
      creator_earnings = EXCLUDED.creator_earnings,
      updated_at = now();
  END LOOP;
END;
$$;

-- Function to calculate monthly payouts
CREATE OR REPLACE FUNCTION calculate_monthly_payouts(target_month TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calc_month TEXT;
  creator_record RECORD;
  platform_revenue NUMERIC;
BEGIN
  calc_month := COALESCE(target_month, to_char(now() - interval '1 month', 'YYYY-MM'));
  
  -- Get total platform revenue for the month
  SELECT COALESCE(total_platform_revenue, 0) INTO platform_revenue
  FROM public.monthly_platform_revenue
  WHERE month_year = calc_month;
  
  -- Calculate payouts for each creator
  FOR creator_record IN 
    SELECT creator_id, SUM(creator_earnings) as total_earnings
    FROM public.creator_analytics
    WHERE month_year = calc_month
    GROUP BY creator_id
    HAVING SUM(creator_earnings) > 0
  LOOP
    INSERT INTO public.creator_payouts (
      creator_id,
      payout_month,
      total_earnings,
      net_payout,
      final_amount,
      payment_method,
      status
    )
    SELECT 
      creator_record.creator_id,
      calc_month,
      creator_record.total_earnings,
      creator_record.total_earnings, -- No platform fee for now
      creator_record.total_earnings,
      COALESCE(cpi.payment_method, 'pending'),
      CASE 
        WHEN cpi.verified = true THEN 'pending'
        ELSE 'requires_setup'
      END
    FROM public.creator_payment_info cpi
    WHERE cpi.creator_id = creator_record.creator_id
    
    ON CONFLICT (creator_id, payout_month) DO UPDATE SET
      total_earnings = EXCLUDED.total_earnings,
      net_payout = EXCLUDED.net_payout,
      final_amount = EXCLUDED.final_amount,
      updated_at = now();
  END LOOP;
END;
$$;