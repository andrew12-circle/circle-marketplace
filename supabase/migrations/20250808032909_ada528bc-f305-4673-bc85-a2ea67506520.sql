-- Create service integration tracking tables
CREATE TABLE IF NOT EXISTS public.service_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL,
    api_connected BOOLEAN NOT NULL DEFAULT false,
    webhook_configured BOOLEAN NOT NULL DEFAULT false,
    tracking_active BOOLEAN NOT NULL DEFAULT true,
    booking_system TEXT NOT NULL DEFAULT 'internal' CHECK (booking_system IN ('internal', 'external', 'hybrid')),
    payment_integration TEXT NOT NULL DEFAULT 'stripe' CHECK (payment_integration IN ('stripe', 'external', 'none')),
    last_sync TIMESTAMP WITH TIME ZONE,
    integration_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service tracking events table
CREATE TABLE IF NOT EXISTS public.service_tracking_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL,
    user_id UUID,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'booking', 'purchase', 'conversion')),
    event_data JSONB DEFAULT '{}',
    revenue_attributed NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tracking_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_integrations
CREATE POLICY "Service integrations are viewable by vendors and admins"
    ON public.service_integrations FOR SELECT
    USING (
        get_user_admin_status() OR 
        EXISTS (
            SELECT 1 FROM public.services s 
            WHERE s.id = service_integrations.service_id 
            AND s.vendor_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can manage their service integrations"
    ON public.service_integrations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.services s 
            WHERE s.id = service_integrations.service_id 
            AND s.vendor_id = auth.uid()
        )
    );

-- Create RLS policies for service_tracking_events
CREATE POLICY "Anyone can create tracking events"
    ON public.service_tracking_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service tracking events are viewable by vendors and admins"
    ON public.service_tracking_events FOR SELECT
    USING (
        get_user_admin_status() OR 
        EXISTS (
            SELECT 1 FROM public.services s 
            WHERE s.id = service_tracking_events.service_id 
            AND s.vendor_id = auth.uid()
        )
    );

-- Create function to get service tracking metrics
CREATE OR REPLACE FUNCTION public.get_service_tracking_metrics(
    p_service_id UUID,
    p_time_period TEXT DEFAULT '30d'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result JSONB;
    time_filter TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate time filter
    CASE p_time_period
        WHEN '7d' THEN time_filter := now() - interval '7 days';
        WHEN '30d' THEN time_filter := now() - interval '30 days';
        WHEN '90d' THEN time_filter := now() - interval '90 days';
        ELSE time_filter := now() - interval '30 days';
    END CASE;

    -- Get metrics
    SELECT jsonb_build_object(
        'total_views', COALESCE(SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END), 0),
        'total_clicks', COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0),
        'total_bookings', COALESCE(SUM(CASE WHEN event_type = 'booking' THEN 1 ELSE 0 END), 0),
        'total_purchases', COALESCE(SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END), 0),
        'revenue_attributed', COALESCE(SUM(revenue_attributed), 0),
        'conversion_rate', CASE 
            WHEN SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) > 0 
            THEN ROUND((SUM(CASE WHEN event_type IN ('booking', 'purchase') THEN 1 ELSE 0 END)::numeric / SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END)::numeric) * 100, 2)
            ELSE 0 
        END,
        'growth_percentage', 15.0, -- Mock growth data
        'last_updated', now()
    ) INTO result
    FROM public.service_tracking_events
    WHERE service_id = p_service_id
      AND created_at >= time_filter;

    RETURN COALESCE(result, '{"total_views": 0, "total_clicks": 0, "total_bookings": 0, "total_purchases": 0, "conversion_rate": 0, "revenue_attributed": 0, "growth_percentage": 0, "last_updated": null}'::jsonb);
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_service_integrations_updated_at
    BEFORE UPDATE ON public.service_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();