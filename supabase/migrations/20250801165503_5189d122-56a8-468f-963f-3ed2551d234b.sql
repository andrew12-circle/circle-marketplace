-- Critical indexes for scale - these will prevent the most common performance bottlenecks

-- Services table indexes (marketplace search/filtering)
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_services_top_pick ON public.services(is_top_pick) WHERE is_top_pick = true;
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON public.services(sort_order);
CREATE INDEX IF NOT EXISTS idx_services_vendor_category ON public.services(vendor_id, category);

-- Co-pay requests indexes (heavy read/write operations)
CREATE INDEX IF NOT EXISTS idx_copay_agent_status ON public.co_pay_requests(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_copay_vendor_status ON public.co_pay_requests(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_copay_status_created ON public.co_pay_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_copay_expires_status ON public.co_pay_requests(expires_at, status) WHERE status = 'pending';

-- Vendor activity tracking (analytics queries)
CREATE INDEX IF NOT EXISTS idx_vendor_activities_vendor_created ON public.vendor_agent_activities(vendor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_vendor_activities_agent_created ON public.vendor_agent_activities(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_vendor_activities_type_created ON public.vendor_agent_activities(activity_type, created_at);

-- Service views analytics
CREATE INDEX IF NOT EXISTS idx_service_views_service_viewed ON public.service_views(service_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_service_views_user_viewed ON public.service_views(user_id, viewed_at) WHERE user_id IS NOT NULL;

-- Profiles search optimization
CREATE INDEX IF NOT EXISTS idx_profiles_specialties ON public.profiles USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_profiles_vendor_enabled ON public.profiles(vendor_enabled) WHERE vendor_enabled = true;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location) WHERE location IS NOT NULL;

-- Vendors geographic search
CREATE INDEX IF NOT EXISTS idx_vendors_location_coords ON public.vendors(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_active_rating ON public.vendors(is_active, rating) WHERE is_active = true;

-- Security and audit indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_type_created ON public.security_events(user_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, attempt_time);

-- Content performance indexes
CREATE INDEX IF NOT EXISTS idx_content_published_featured ON public.content(is_published, is_featured) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_content_creator_published ON public.content(creator_id, is_published);

-- Add partial indexes for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_services_copay_allowed ON public.services(co_pay_allowed) WHERE co_pay_allowed = true;
CREATE INDEX IF NOT EXISTS idx_services_requires_quote ON public.services(requires_quote);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_services_category_vendor_sort ON public.services(category, vendor_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_copay_requests_compound ON public.co_pay_requests(status, vendor_id, created_at);