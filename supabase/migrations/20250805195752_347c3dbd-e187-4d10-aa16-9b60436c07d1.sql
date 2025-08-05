-- Step 1: Fix IP address data corruption and optimize database performance

-- First, let's create indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON public.services(sort_order);
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_services_top_pick ON public.services(is_top_pick) WHERE is_top_pick = true;
CREATE INDEX IF NOT EXISTS idx_services_vendor_id ON public.services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON public.vendors(rating);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON public.vendors(is_verified) WHERE is_verified = true;

-- Create composite index for common marketplace queries
CREATE INDEX IF NOT EXISTS idx_services_marketplace_query ON public.services(sort_order, is_featured, is_top_pick, vendor_id);

-- Add function to clean and validate IP addresses
CREATE OR REPLACE FUNCTION clean_ip_address(input_ip text)
RETURNS inet
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Handle null or empty input
  IF input_ip IS NULL OR trim(input_ip) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Extract first valid IP from comma-separated list
  DECLARE
    ip_parts text[];
    cleaned_ip text;
  BEGIN
    -- Split by comma and get first part
    ip_parts := string_to_array(input_ip, ',');
    cleaned_ip := trim(ip_parts[1]);
    
    -- Remove any whitespace and validate format
    cleaned_ip := regexp_replace(cleaned_ip, '[^0-9.]', '', 'g');
    
    -- Basic IPv4 validation
    IF cleaned_ip ~ '^([0-9]{1,3}\.){3}[0-9]{1,3}$' THEN
      RETURN cleaned_ip::inet;
    END IF;
    
    RETURN NULL;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$$;

-- Clean up existing malformed IP data in all tables with inet columns
UPDATE public.blocked_ips 
SET ip_address = clean_ip_address(ip_address::text)
WHERE ip_address::text LIKE '%,%';

UPDATE public.login_attempts 
SET ip_address = clean_ip_address(ip_address::text)
WHERE ip_address::text LIKE '%,%';

UPDATE public.co_pay_requests 
SET ip_address = clean_ip_address(ip_address::text)
WHERE ip_address::text LIKE '%,%';

UPDATE public.security_events 
SET event_data = jsonb_set(
  event_data, 
  '{ip_address}', 
  to_jsonb(clean_ip_address(event_data->>'ip_address')::text),
  true
)
WHERE event_data->>'ip_address' LIKE '%,%';

-- Add trigger to validate IP addresses on insert/update
CREATE OR REPLACE FUNCTION validate_ip_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Clean IP address if it exists
  IF TG_TABLE_NAME = 'blocked_ips' AND NEW.ip_address IS NOT NULL THEN
    NEW.ip_address = clean_ip_address(NEW.ip_address::text);
  ELSIF TG_TABLE_NAME = 'login_attempts' AND NEW.ip_address IS NOT NULL THEN
    NEW.ip_address = clean_ip_address(NEW.ip_address::text);
  ELSIF TG_TABLE_NAME = 'co_pay_requests' AND NEW.ip_address IS NOT NULL THEN
    NEW.ip_address = clean_ip_address(NEW.ip_address::text);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS validate_ip_blocked_ips ON public.blocked_ips;
CREATE TRIGGER validate_ip_blocked_ips
  BEFORE INSERT OR UPDATE ON public.blocked_ips
  FOR EACH ROW
  EXECUTE FUNCTION validate_ip_address();

DROP TRIGGER IF EXISTS validate_ip_login_attempts ON public.login_attempts;
CREATE TRIGGER validate_ip_login_attempts
  BEFORE INSERT OR UPDATE ON public.login_attempts
  FOR EACH ROW
  EXECUTE FUNCTION validate_ip_address();

DROP TRIGGER IF EXISTS validate_ip_co_pay_requests ON public.co_pay_requests;
CREATE TRIGGER validate_ip_co_pay_requests
  BEFORE INSERT OR UPDATE ON public.co_pay_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_ip_address();

-- Create enhanced marketplace data retrieval function
CREATE OR REPLACE FUNCTION get_optimized_marketplace_data()
RETURNS TABLE(
  service_id uuid,
  service_title text,
  service_description text,
  service_category text,
  service_discount_percentage text,
  service_retail_price text,
  service_pro_price text,
  service_co_pay_price text,
  service_image_url text,
  service_tags text[],
  service_is_featured boolean,
  service_is_top_pick boolean,
  service_estimated_roi integer,
  service_duration text,
  service_requires_quote boolean,
  service_sort_order integer,
  vendor_id uuid,
  vendor_name text,
  vendor_rating numeric,
  vendor_review_count integer,
  vendor_is_verified boolean,
  vendor_description text,
  vendor_logo_url text,
  vendor_website_url text,
  vendor_location text,
  vendor_co_marketing_agents integer,
  vendor_campaigns_funded integer,
  vendor_service_states text[],
  vendor_mls_areas text[],
  vendor_service_radius_miles integer,
  vendor_license_states text[],
  vendor_latitude numeric,
  vendor_longitude numeric,
  vendor_type text,
  vendor_local_representatives jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as service_id,
    s.title as service_title,
    s.description as service_description,
    s.category as service_category,
    s.discount_percentage as service_discount_percentage,
    s.retail_price as service_retail_price,
    s.pro_price as service_pro_price,
    s.co_pay_price as service_co_pay_price,
    s.image_url as service_image_url,
    s.tags as service_tags,
    s.is_featured as service_is_featured,
    s.is_top_pick as service_is_top_pick,
    s.estimated_roi as service_estimated_roi,
    s.duration as service_duration,
    s.requires_quote as service_requires_quote,
    s.sort_order as service_sort_order,
    v.id as vendor_id,
    COALESCE(v.name, 'Circle Marketplace') as vendor_name,
    COALESCE(v.rating, 0) as vendor_rating,
    COALESCE(v.review_count, 0) as vendor_review_count,
    COALESCE(v.is_verified, false) as vendor_is_verified,
    v.description as vendor_description,
    v.logo_url as vendor_logo_url,
    v.website_url as vendor_website_url,
    v.location as vendor_location,
    COALESCE(v.co_marketing_agents, 0) as vendor_co_marketing_agents,
    COALESCE(v.campaigns_funded, 0) as vendor_campaigns_funded,
    v.service_states as vendor_service_states,
    v.mls_areas as vendor_mls_areas,
    v.service_radius_miles as vendor_service_radius_miles,
    v.license_states as vendor_license_states,
    v.latitude as vendor_latitude,
    v.longitude as vendor_longitude,
    v.vendor_type as vendor_type,
    v.local_representatives as vendor_local_representatives
  FROM public.services s
  LEFT JOIN public.vendors v ON s.vendor_id = v.id
  ORDER BY 
    s.sort_order ASC NULLS LAST,
    s.is_featured DESC,
    s.is_top_pick DESC,
    s.created_at DESC;
END;
$$;