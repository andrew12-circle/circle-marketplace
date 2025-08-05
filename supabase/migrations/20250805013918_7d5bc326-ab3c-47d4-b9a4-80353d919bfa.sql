-- Fix security warnings from the support system migration

-- Update function with proper search_path
CREATE OR REPLACE FUNCTION public.update_support_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;