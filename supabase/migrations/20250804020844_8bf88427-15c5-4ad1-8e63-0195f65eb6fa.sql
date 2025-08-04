-- Add is_pro column to profiles table for manual pro membership control
ALTER TABLE public.profiles 
ADD COLUMN is_pro BOOLEAN DEFAULT false;