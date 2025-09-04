-- Add new columns to consultation_bookings table
ALTER TABLE public.consultation_bookings 
ADD COLUMN vendor_notified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN vendor_response TEXT CHECK (vendor_response IN ('pending', 'accepted', 'declined', 'no_response')),
ADD COLUMN assigned_to UUID,
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN internal_notes TEXT;

-- Create consultation_booking_notes table for activity timeline
CREATE TABLE public.consultation_booking_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.consultation_bookings(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('system', 'admin', 'vendor_response', 'status_change')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_action_tokens table for secure vendor accept/decline links
CREATE TABLE public.booking_action_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.consultation_bookings(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  action_type TEXT NOT NULL CHECK (action_type IN ('accept', 'decline')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.consultation_booking_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_action_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for consultation_booking_notes
CREATE POLICY "Admins can manage all booking notes" 
ON public.consultation_booking_notes 
FOR ALL 
USING (get_user_admin_status());

CREATE POLICY "Users can view notes for their bookings" 
ON public.consultation_booking_notes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.consultation_bookings cb 
    WHERE cb.id = consultation_booking_notes.booking_id 
    AND cb.user_id = auth.uid()
  )
);

-- RLS policies for booking_action_tokens
CREATE POLICY "Admins can view all booking action tokens" 
ON public.booking_action_tokens 
FOR SELECT 
USING (get_user_admin_status());

CREATE POLICY "System can manage booking action tokens" 
ON public.booking_action_tokens 
FOR ALL 
USING (true);

-- Function to automatically add system notes when booking status changes
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.consultation_booking_notes (booking_id, note_text, note_type, created_by)
    VALUES (
      NEW.id,
      'Status changed from ' || COALESCE(OLD.status, 'new') || ' to ' || NEW.status,
      'status_change',
      auth.uid()
    );
  END IF;
  
  -- Log vendor notifications
  IF OLD.vendor_notified_at IS NULL AND NEW.vendor_notified_at IS NOT NULL THEN
    INSERT INTO public.consultation_booking_notes (booking_id, note_text, note_type)
    VALUES (
      NEW.id,
      'Vendor notification sent',
      'system'
    );
  END IF;
  
  -- Log vendor responses
  IF OLD.vendor_response IS DISTINCT FROM NEW.vendor_response AND NEW.vendor_response IS NOT NULL THEN
    INSERT INTO public.consultation_booking_notes (booking_id, note_text, note_type)
    VALUES (
      NEW.id,
      'Vendor response: ' || NEW.vendor_response,
      'vendor_response'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for booking status changes
CREATE TRIGGER consultation_booking_status_logger
  AFTER UPDATE ON public.consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_status_change();

-- Update consultation_bookings status column to include new statuses
ALTER TABLE public.consultation_bookings 
DROP CONSTRAINT IF EXISTS consultation_bookings_status_check;

ALTER TABLE public.consultation_bookings 
ADD CONSTRAINT consultation_bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'vendor_confirmed', 'vendor_declined', 'awaiting_vendor'));

-- Set default vendor_response
UPDATE public.consultation_bookings 
SET vendor_response = 'pending', status_updated_at = now() 
WHERE vendor_response IS NULL;