-- Add SSP (Settlement Service Provider) flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_settlement_service_provider BOOLEAN DEFAULT false;