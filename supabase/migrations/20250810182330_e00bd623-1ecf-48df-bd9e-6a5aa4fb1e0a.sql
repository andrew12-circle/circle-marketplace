DO $outer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'services' 
      AND policyname = 'Vendor users can update associated services'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Vendor users can update associated services"
      ON public.services
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.vendor_user_associations vua
          WHERE vua.vendor_id = services.vendor_id
            AND vua.user_id = auth.uid()
            AND COALESCE(vua.role, 'member') IN ('owner','manager','editor','member')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.vendor_user_associations vua
          WHERE vua.vendor_id = services.vendor_id
            AND vua.user_id = auth.uid()
            AND COALESCE(vua.role, 'member') IN ('owner','manager','editor','member')
        )
      );
    $policy$;
  END IF;
END
$outer$;