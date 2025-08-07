-- Add consultation-specific fields to services table
ALTER TABLE public.services 
ADD COLUMN calendar_link text,
ADD COLUMN consultation_email text,
ADD COLUMN consultation_phone text;