-- Step 2: Add critical indexes for RLS policy performance (non-concurrent for migration)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_id ON public.vendors(id);
CREATE INDEX IF NOT EXISTS idx_services_vendor_id ON public.services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_tracking_events_service_id ON public.service_tracking_events(service_id);
CREATE INDEX IF NOT EXISTS idx_service_tracking_events_created_at ON public.service_tracking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_co_pay_requests_agent_id ON public.co_pay_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_co_pay_requests_vendor_id ON public.co_pay_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);