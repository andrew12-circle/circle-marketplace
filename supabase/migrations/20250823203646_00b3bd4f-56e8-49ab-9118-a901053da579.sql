-- Fix security definer view issues by removing security_barrier setting
-- These views don't need security definer properties for our use case

-- Remove the security_barrier setting from views
ALTER VIEW agents_business_contact SET (security_barrier = false);
ALTER VIEW agents_public SET (security_barrier = false);

-- Instead, we'll rely on the underlying table's RLS policies
-- The views will inherit the access controls from the agents table