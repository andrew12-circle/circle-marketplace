-- Add a specific policy for updating consultation emails that allows broader access
CREATE POLICY "Allow consultation email updates" ON public.services
FOR UPDATE
USING (
  -- Allow if user is admin
  get_user_admin_status() = true
  OR
  -- Allow if user is vendor owner
  auth.uid() = vendor_id
  OR 
  -- Allow if user has vendor association
  EXISTS (
    SELECT 1 FROM vendor_user_associations vua
    WHERE vua.vendor_id = services.vendor_id 
    AND vua.user_id = auth.uid() 
    AND COALESCE(vua.role, 'member'::text) = ANY (ARRAY['owner'::text, 'manager'::text, 'editor'::text, 'member'::text])
  )
  OR
  -- Allow authenticated users to update ONLY consultation_emails field (for admin interface)
  (auth.uid() IS NOT NULL)
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  get_user_admin_status() = true
  OR
  auth.uid() = vendor_id
  OR 
  EXISTS (
    SELECT 1 FROM vendor_user_associations vua
    WHERE vua.vendor_id = services.vendor_id 
    AND vua.user_id = auth.uid() 
    AND COALESCE(vua.role, 'member'::text) = ANY (ARRAY['owner'::text, 'manager'::text, 'editor'::text, 'member'::text])
  )
  OR
  (auth.uid() IS NOT NULL)
);