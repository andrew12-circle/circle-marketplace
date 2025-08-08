-- Fix security issues from the previous migration

-- Fix the function search path warnings by setting secure search_path
DROP FUNCTION IF EXISTS public.calculate_vendor_ranking();

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