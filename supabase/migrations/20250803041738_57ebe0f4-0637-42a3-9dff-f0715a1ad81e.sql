-- CRITICAL: Add performance indexes for production traffic

-- Services table indexes for marketplace queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_price_range ON public.services(co_pay_price) WHERE co_pay_price IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_featured ON public.services(is_featured) WHERE is_featured = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_vendor_active ON public.services(vendor_id, created_at) WHERE is_active = true;

-- Full-text search index for service search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_search ON public.services USING gin(to_tsvector('english', title || ' ' || description));

-- Point transactions for financial performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_point_transactions_agent_date ON public.point_transactions(agent_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_point_allocations_vendor_active ON public.point_allocations(vendor_id, status) WHERE status = 'active';

-- Content engagement for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_engagement_creator_date ON public.content_engagement_events(creator_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_plays_content_date ON public.content_plays(content_id, played_at DESC);

-- Profiles for user lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_business_lookup ON public.profiles(business_name) WHERE business_name IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_admin_users ON public.profiles(user_id) WHERE is_admin = true;