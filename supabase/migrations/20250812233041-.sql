-- Fix vendor performance tracking RLS policy
DROP POLICY IF EXISTS "Vendors can view their performance data" ON public.vendor_performance_tracking;

CREATE POLICY "Vendors can view their performance data"
  ON public.vendor_performance_tracking FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = vendor_performance_tracking.vendor_id
  ));