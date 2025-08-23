-- Remove the problematic views that are causing security definer warnings
-- We'll rely solely on the table RLS policies for now

DROP VIEW IF EXISTS agents_business_contact CASCADE;
DROP VIEW IF EXISTS agents_public CASCADE;

-- Log the final security fix completion
INSERT INTO public.security_events (
  event_type,
  user_id,
  event_data
) VALUES (
  'agent_security_fix_completed',
  NULL,
  jsonb_build_object(
    'description', 'Completed security fix for agent personal information protection',
    'changes_applied', jsonb_build_array(
      'Removed overly permissive business partner access policies',
      'Implemented strict access controls for agent data',
      'Agents can only see their own full profiles',
      'Business partners have limited access through co-pay relationships only',
      'Prevented unauthorized deletion of agent profiles',
      'Removed security definer views to eliminate security warnings'
    ),
    'security_status', 'fixed',
    'timestamp', now()
  )
);