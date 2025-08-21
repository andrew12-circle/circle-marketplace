-- Add affiliate and booking link flags to services table
ALTER TABLE public.services 
ADD COLUMN is_affiliate boolean DEFAULT false,
ADD COLUMN is_booking_link boolean DEFAULT false;