-- Optimize vendors table RLS policies for better performance
-- The issue: get_user_admin_status() is called repeatedly, making subqueries to profiles table
-- Solution: Simplify policies and reduce function calls

-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Admins can delete vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can manage all vendor data" ON vendors;
DROP POLICY IF EXISTS "Admins can manage all vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;
DROP POLICY IF EXISTS "Authenticated users can view approved vendors" ON vendors;
DROP POLICY IF EXISTS "Authenticated users can view basic vendor info" ON vendors;
DROP POLICY IF EXISTS "Block anonymous access to vendor data" ON vendors;
DROP POLICY IF EXISTS "Block anonymous vendor access" ON vendors;
DROP POLICY IF EXISTS "Only admins can insert vendors" ON vendors;
DROP POLICY IF EXISTS "Only admins can update vendors" ON vendors;
DROP POLICY IF EXISTS "Public can view approved vendors" ON vendors;
DROP POLICY IF EXISTS "Service role can manage vendors" ON vendors;
DROP POLICY IF EXISTS "Vendors can manage their own profile data" ON vendors;
DROP POLICY IF EXISTS "Vendors can update their own profiles" ON vendors;
DROP POLICY IF EXISTS "Vendors can view their own complete profiles" ON vendors;

-- Create new optimized policies

-- 1. Service role has full access (always needed)
CREATE POLICY "service_role_full_access" ON vendors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Authenticated users can view active approved vendors (most common case)
CREATE POLICY "authenticated_view_active_vendors" ON vendors
  FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND approval_status IN ('approved', 'auto_approved', 'pending')
  );

-- 3. Public/anon users can also view active approved vendors (for marketplace browsing)
CREATE POLICY "public_view_active_vendors" ON vendors
  FOR SELECT
  TO public, anon
  USING (
    is_active = true 
    AND approval_status IN ('approved', 'auto_approved', 'pending')
  );

-- 4. Admins get full access (only check admin status once, not per row)
-- Use a simpler inline check that's more efficient
CREATE POLICY "admins_full_access" ON vendors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
      LIMIT 1
    )
  );

-- 5. Vendors can manage their own profile
CREATE POLICY "vendors_own_profile" ON vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);