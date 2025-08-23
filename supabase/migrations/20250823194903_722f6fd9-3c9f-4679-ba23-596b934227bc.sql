-- Fix security definer view issue
ALTER VIEW public.vendor_directory SET (security_barrier = false);

-- The view doesn't need security_barrier since it only exposes public data
-- and relies on the underlying table's RLS policies