-- First, drop all policies that depend on vendor_id in services table
DROP POLICY IF EXISTS "Service owners can view their service analytics" ON public.service_views;
DROP POLICY IF EXISTS "Service creators can update their own services" ON public.services;
DROP POLICY IF EXISTS "Service creators can insert their own services" ON public.services;
DROP POLICY IF EXISTS "Vendors can manage their own services" ON public.services;
DROP POLICY IF EXISTS "Service integrations are viewable by vendors and admins" ON public.service_integrations;
DROP POLICY IF EXISTS "Vendors can manage their service integrations" ON public.service_integrations;
DROP POLICY IF EXISTS "Service tracking events are viewable by vendors and admins" ON public.service_tracking_events;
DROP POLICY IF EXISTS "Vendors can update their service funnel content" ON public.services;
DROP POLICY IF EXISTS "Vendor users can update associated services" ON public.services;
DROP POLICY IF EXISTS "Allow consultation email updates" ON public.services;
DROP POLICY IF EXISTS "Business partners can view detailed vendor info" ON public.vendors;
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
DROP POLICY IF EXISTS "Users can view active services" ON public.services;

-- Now remove the vendor_id column from services table
ALTER TABLE public.services DROP COLUMN IF EXISTS vendor_id;

-- Create new policies for services that don't depend on vendor_id
-- Services are now platform-managed offerings, so only admins can manage them
CREATE POLICY "Admins can manage all services"
ON public.services
FOR ALL
USING (get_user_admin_status() = true)
WITH CHECK (get_user_admin_status() = true);

-- All authenticated users can view active services
CREATE POLICY "Users can view active services"
ON public.services
FOR SELECT
USING (is_active = true);

-- Service integrations can be viewed by admins only
DROP POLICY IF EXISTS "Admins can manage service integrations" ON public.service_integrations;
CREATE POLICY "Admins can manage service integrations"
ON public.service_integrations
FOR ALL
USING (get_user_admin_status() = true)
WITH CHECK (get_user_admin_status() = true);

-- Service tracking events policies
DROP POLICY IF EXISTS "Admins can view service tracking events" ON public.service_tracking_events;
DROP POLICY IF EXISTS "Users can track service interactions" ON public.service_tracking_events;

CREATE POLICY "Admins can view service tracking events"
ON public.service_tracking_events
FOR SELECT
USING (get_user_admin_status() = true);

CREATE POLICY "Users can track service interactions"
ON public.service_tracking_events
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Service views policies
DROP POLICY IF EXISTS "Users can log service views" ON public.service_views;
DROP POLICY IF EXISTS "Admins can view service analytics" ON public.service_views;

CREATE POLICY "Users can log service views"
ON public.service_views
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view service analytics"
ON public.service_views
FOR SELECT
USING (get_user_admin_status() = true);