-- SECURITY FIX: Create function to identify security definer views and analyze security issues

-- Create the missing function that the edge function is trying to call
CREATE OR REPLACE FUNCTION public.identify_security_definer_views()
RETURNS TABLE(
  schema_name text,
  view_name text,
  definition text,
  security_type text,
  risk_level text,
  recommendation text
) 
LANGUAGE plpgsql
SECURITY INVOKER  -- Use INVOKER instead of DEFINER for security
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.schemaname::text,
    v.viewname::text,
    v.definition::text,
    CASE 
      WHEN v.definition ILIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER'
      ELSE 'SECURITY INVOKER'
    END::text as security_type,
    CASE 
      WHEN v.definition ILIKE '%SECURITY DEFINER%' THEN 'HIGH'
      ELSE 'LOW'
    END::text as risk_level,
    CASE 
      WHEN v.definition ILIKE '%SECURITY DEFINER%' THEN 'Convert to SECURITY INVOKER or implement proper RLS policies'
      ELSE 'No action needed'
    END::text as recommendation
  FROM pg_views v
  WHERE v.schemaname = 'public';
END;
$$;

-- Check for any actual security definer views (not just functions)
-- Most of the security definer items are functions, which is more acceptable
-- But let's audit them for any potential issues

-- Create a function to audit security definer functions for potential risks
CREATE OR REPLACE FUNCTION public.audit_security_definer_functions()
RETURNS TABLE(
  function_name text,
  return_type text,
  risk_assessment text,
  recommendation text
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text,
    pg_get_function_result(p.oid)::text,
    CASE 
      -- High risk functions that bypass RLS or handle sensitive data
      WHEN p.proname ILIKE '%admin%' OR p.proname ILIKE '%audit%' THEN 'HIGH - Administrative function'
      WHEN p.proname ILIKE '%security%' OR p.proname ILIKE '%auth%' THEN 'HIGH - Security-related function'
      WHEN p.proname ILIKE '%backup%' OR p.proname ILIKE '%financial%' THEN 'HIGH - Handles sensitive data'
      -- Medium risk functions
      WHEN p.proname ILIKE '%user%' OR p.proname ILIKE '%profile%' THEN 'MEDIUM - User data function'
      WHEN p.proname ILIKE '%create%' OR p.proname ILIKE '%update%' THEN 'MEDIUM - Data modification function'
      -- Low risk utility functions
      WHEN p.proname ILIKE '%calculate%' OR p.proname ILIKE '%get%' THEN 'LOW - Utility function'
      ELSE 'MEDIUM - Needs review'
    END::text,
    CASE 
      WHEN p.proname ILIKE '%admin%' OR p.proname ILIKE '%audit%' THEN 'Ensure proper admin privilege checks'
      WHEN p.proname ILIKE '%security%' OR p.proname ILIKE '%auth%' THEN 'Review for proper authentication'
      WHEN p.proname ILIKE '%backup%' OR p.proname ILIKE '%financial%' THEN 'Ensure data access controls'
      ELSE 'Review function implementation for security best practices'
    END::text
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
  ORDER BY 
    CASE 
      WHEN p.proname ILIKE '%admin%' OR p.proname ILIKE '%audit%' OR p.proname ILIKE '%security%' THEN 1
      WHEN p.proname ILIKE '%backup%' OR p.proname ILIKE '%financial%' THEN 2
      ELSE 3
    END,
    p.proname;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.identify_security_definer_views() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_security_definer_functions() TO authenticated;