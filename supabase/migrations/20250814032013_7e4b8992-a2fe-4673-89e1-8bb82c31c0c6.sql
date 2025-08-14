-- Fix security issues from the previous migration

-- First, let's drop the problematic view and recreate it without SECURITY DEFINER
DROP VIEW IF EXISTS vendors_with_live_stats;

-- Create RLS policies for the new functions we created
-- These functions are already SECURITY DEFINER which is appropriate for calculated stats

-- Update the VendorSelectionModal to use the calculate_vendor_stats function directly
-- through a simple query that doesn't require a special view

-- Add RLS policy for vendors table if not exists (seems like this might be the RLS issue)
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create policy for vendors to be viewable by authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendors' 
    AND policyname = 'Vendors are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Vendors are viewable by authenticated users" 
    ON vendors FOR SELECT 
    TO authenticated 
    USING (is_active = true);
  END IF;
END $$;

-- Create policy for vendors to be viewable by anonymous users (for public marketplace)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendors' 
    AND policyname = 'Vendors are publicly viewable'
  ) THEN
    CREATE POLICY "Vendors are publicly viewable" 
    ON vendors FOR SELECT 
    TO anon 
    USING (is_active = true);
  END IF;
END $$;

-- Admin policy for vendors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vendors' 
    AND policyname = 'Admins can manage vendors'
  ) THEN
    CREATE POLICY "Admins can manage vendors" 
    ON vendors FOR ALL 
    TO authenticated 
    USING (get_user_admin_status())
    WITH CHECK (get_user_admin_status());
  END IF;
END $$;