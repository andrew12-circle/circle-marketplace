-- Add new pricing fields to services table
ALTER TABLE public.services 
ADD COLUMN retail_price text,
ADD COLUMN pro_price text,
ADD COLUMN co_pay_price text;