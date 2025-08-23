-- Create a function to identify what the linter is detecting as security definer views
CREATE OR REPLACE FUNCTION public.identify_security_definer_views()
RETURNS TABLE (
    view_name text,
    view_definition text,
    has_security_definer boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::text as view_name,
        pg_get_viewdef(c.oid)::text as view_definition,
        (pg_get_viewdef(c.oid) ILIKE '%SECURITY%DEFINER%')::boolean as has_security_definer
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v' 
    AND n.nspname = 'public'
    ORDER BY c.relname;
END;
$$;

-- Now let's call it to see what views exist
SELECT * FROM public.identify_security_definer_views();