-- Add premium provider field to vendors table
ALTER TABLE public.vendors 
ADD COLUMN is_premium_provider boolean DEFAULT false;