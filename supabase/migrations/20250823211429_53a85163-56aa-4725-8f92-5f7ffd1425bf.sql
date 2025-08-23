-- Tighten read access policies to prevent data exposure

-- 1. help_knowledge_base: Drop public SELECT, add authenticated only
DROP POLICY IF EXISTS "Knowledge base is viewable by everyone" ON public.help_knowledge_base;
CREATE POLICY "Knowledge base viewable by authenticated users only" 
ON public.help_knowledge_base 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. service_reviews: Drop public SELECT, add authenticated only  
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.service_reviews;
CREATE POLICY "Reviews viewable by authenticated users only"
ON public.service_reviews
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. vendor_content: Drop public SELECT, add authenticated only
DROP POLICY IF EXISTS "Vendor content is viewable by everyone when active" ON public.vendor_content;
CREATE POLICY "Vendor content viewable by authenticated users only"
ON public.vendor_content
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- 4. marketplace_cache: Drop public SELECT, add authenticated only
DROP POLICY IF EXISTS "Marketplace cache is readable by everyone" ON public.marketplace_cache;
CREATE POLICY "Marketplace cache viewable by authenticated users only"
ON public.marketplace_cache
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. Update get_marketplace_cache function to guard against anonymous access
CREATE OR REPLACE FUNCTION public.get_marketplace_cache(p_cache_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cached_data JSONB;
BEGIN
  -- Return null for anonymous requests to prevent data exposure
  IF auth.uid() IS NULL THEN
    RETURN 'null'::jsonb;
  END IF;
  
  SELECT cache_data INTO cached_data
  FROM public.marketplace_cache
  WHERE cache_key = p_cache_key
    AND expires_at > now();
  
  RETURN COALESCE(cached_data, 'null'::jsonb);
END;
$function$;