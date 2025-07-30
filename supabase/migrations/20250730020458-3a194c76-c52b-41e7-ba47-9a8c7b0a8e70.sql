-- Phase 1: Critical Database Security Fixes

-- Fix RLS policies for audit_log table (currently only has SELECT policy)
CREATE POLICY "Only service role can insert audit logs" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (false); -- Only service role/triggers can insert

CREATE POLICY "Only admins can update audit logs" 
ON public.audit_log 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Only admins can delete audit logs" 
ON public.audit_log 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Fix RLS policies for content_plays table (missing UPDATE/DELETE)
CREATE POLICY "Users can update their own content plays" 
ON public.content_plays 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content plays" 
ON public.content_plays 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for video_views table (missing UPDATE/DELETE)
CREATE POLICY "Users can update their own video views" 
ON public.video_views 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video views" 
ON public.video_views 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for consultation_bookings table (missing DELETE)
CREATE POLICY "Users can delete their own bookings" 
ON public.consultation_bookings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for orders table (missing INSERT for regular users)
CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add audit logging trigger for admin privilege changes
CREATE OR REPLACE FUNCTION public.audit_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when admin status changes
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (
      'profiles_admin_change',
      'UPDATE',
      auth.uid(),
      jsonb_build_object('user_id', OLD.user_id, 'is_admin', OLD.is_admin),
      jsonb_build_object('user_id', NEW.user_id, 'is_admin', NEW.is_admin),
      now()
    );
  END IF;
  
  -- Log when creator verification changes
  IF OLD.creator_verified IS DISTINCT FROM NEW.creator_verified THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data, timestamp)
    VALUES (
      'profiles_creator_verification_change',
      'UPDATE',
      auth.uid(),
      jsonb_build_object('user_id', OLD.user_id, 'creator_verified', OLD.creator_verified),
      jsonb_build_object('user_id', NEW.user_id, 'creator_verified', NEW.creator_verified),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;