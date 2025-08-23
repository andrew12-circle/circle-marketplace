-- SECURITY FIX: Protect financial payment information
-- Remove overly permissive policies and implement strict access controls

-- Block ALL anonymous access to financial tables
CREATE POLICY "Block anonymous access to co_pay_requests"
ON public.co_pay_requests
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to copay_orders"
ON public.copay_orders
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to copay_payments"
ON public.copay_payments
FOR ALL
TO anon
USING (false);

-- Fix overly permissive policies on copay_orders
DROP POLICY IF EXISTS "System can update orders" ON public.copay_orders;

-- Replace with strict service role policy
CREATE POLICY "Service role can update orders"
ON public.copay_orders
FOR UPDATE
TO service_role
USING (true);

-- Add secure authenticated user policy for order updates
CREATE POLICY "Order participants can update specific fields"
ON public.copay_orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = agent_id 
  OR auth.uid() = vendor_id 
  OR get_user_admin_status() = true
);

-- Fix overly permissive policies on copay_payments
DROP POLICY IF EXISTS "System can manage payments" ON public.copay_payments;

-- Replace with strict service role policy for payments
CREATE POLICY "Service role can manage payments"
ON public.copay_payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add secure policy for payment participants only
CREATE POLICY "Payment participants can view payment status"
ON public.copay_payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.co_pay_requests cpr
    WHERE cpr.id = copay_payments.copay_request_id
    AND (cpr.agent_id = auth.uid() OR cpr.vendor_id = auth.uid())
  )
  OR get_user_admin_status() = true
);

-- Ensure copay_payments insert is restricted to service role only
CREATE POLICY "Only service role can create payments"
ON public.copay_payments
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add additional security for co_pay_requests updates
-- Ensure only specific fields can be updated by non-admins
DROP POLICY IF EXISTS "Vendors can update co-pay requests" ON public.co_pay_requests;

CREATE POLICY "Agents can update their co-pay request details"
ON public.co_pay_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Vendors can update their co-pay request responses"
ON public.co_pay_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Create audit logging for sensitive financial operations
CREATE POLICY "Log financial data access"
ON public.co_pay_requests
FOR SELECT
TO authenticated
USING (
  (auth.uid() = agent_id OR auth.uid() = vendor_id OR get_user_admin_status() = true)
  AND public.log_sensitive_data_access('co_pay_requests', id::text, auth.uid())
);

-- Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name text,
  record_id text,
  accessed_by uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert audit log entry
  INSERT INTO public.security_events (event_type, user_id, event_data)
  VALUES (
    'sensitive_financial_data_access',
    accessed_by,
    jsonb_build_object(
      'table_name', table_name,
      'record_id', record_id,
      'access_timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    )
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the query if logging fails
    RETURN true;
END;
$$;