-- Fix security issues by properly recreating the function and trigger

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_vendor_ranking ON public.vendors;

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS public.calculate_vendor_ranking() CASCADE;

CREATE OR REPLACE FUNCTION public.calculate_vendor_ranking()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update sort_order based on commission percentage (higher commission = lower sort_order = higher ranking)
  UPDATE public.vendors 
  SET sort_order = CASE 
    WHEN circle_commission_percentage >= 15 THEN 1
    WHEN circle_commission_percentage >= 10 THEN 2
    WHEN circle_commission_percentage >= 5 THEN 3
    WHEN circle_commission_percentage >= 2 THEN 4
    ELSE 5
  END
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_vendor_ranking
  AFTER INSERT OR UPDATE OF circle_commission_percentage
  ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_vendor_ranking();