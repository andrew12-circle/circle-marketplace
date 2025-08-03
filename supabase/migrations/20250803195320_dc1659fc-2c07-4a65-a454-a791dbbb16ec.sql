-- Fix the function search path issue by adding search_path
CREATE OR REPLACE FUNCTION update_agent_spending()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_month TEXT;
  service_price NUMERIC;
  copay_amount NUMERIC;
BEGIN
  -- Only update spending when status changes to approved
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    current_month := to_char(now(), 'YYYY-MM');
    
    -- Get service price from services table
    SELECT COALESCE(
      CAST(REGEXP_REPLACE(public.services.pro_price, '[^0-9.]', '', 'g') AS NUMERIC),
      CAST(REGEXP_REPLACE(public.services.retail_price, '[^0-9.]', '', 'g') AS NUMERIC),
      0
    ) INTO service_price
    FROM public.services 
    WHERE public.services.id = NEW.service_id;
    
    -- Calculate co-pay amount
    copay_amount := service_price * (NEW.requested_split_percentage / 100.0);
    
    -- Update or insert spending record
    INSERT INTO public.agent_copay_spending (agent_id, vendor_id, month_year, total_spent, total_requests)
    VALUES (NEW.agent_id, NEW.vendor_id, current_month, copay_amount, 1)
    ON CONFLICT (agent_id, vendor_id, month_year)
    DO UPDATE SET
      total_spent = public.agent_copay_spending.total_spent + copay_amount,
      total_requests = public.agent_copay_spending.total_requests + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER update_agent_spending_trigger
  AFTER UPDATE ON public.co_pay_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_spending();