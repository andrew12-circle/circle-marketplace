-- Create storage buckets for vendor assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vendor-assets', 'vendor-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']),
  ('service-assets', 'service-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);

-- Create RLS policies for vendor-assets bucket
CREATE POLICY "Vendors can upload their own assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can view their own assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can update their own assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can delete their own assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for service-assets bucket
CREATE POLICY "Vendors can upload service assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view service assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-assets');

CREATE POLICY "Vendors can update service assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can delete service assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add pricing_tiers column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS pricing_tiers jsonb DEFAULT '[]'::jsonb;

-- Update admin_review_draft function to handle all vendor-editable fields
CREATE OR REPLACE FUNCTION public.admin_review_draft(draft_table text, draft_id uuid, action text, rejection_reason text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  draft_record RECORD;
  result JSONB;
BEGIN
  -- Check admin status
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin access required';
  END IF;
  
  -- Get draft record
  IF draft_table = 'service_drafts' THEN
    SELECT * INTO draft_record FROM public.service_drafts WHERE id = draft_id;
  ELSIF draft_table = 'vendor_drafts' THEN
    SELECT * INTO draft_record FROM public.vendor_drafts WHERE id = draft_id;
  ELSE
    RAISE EXCEPTION 'INVALID_TABLE: Invalid draft table specified';
  END IF;
  
  IF draft_record.id IS NULL THEN
    RAISE EXCEPTION 'DRAFT_NOT_FOUND: Draft not found';
  END IF;
  
  -- Process based on action
  IF action = 'approve' THEN
    -- Apply changes to live data
    IF draft_table = 'service_drafts' THEN
      -- Update service with ALL draft data including new fields
      UPDATE public.services 
      SET 
        title = COALESCE((draft_record.draft_data->>'title')::TEXT, title),
        description = COALESCE((draft_record.draft_data->>'description')::TEXT, description),
        retail_price = COALESCE((draft_record.draft_data->>'retail_price')::TEXT, retail_price),
        pro_price = COALESCE((draft_record.draft_data->>'pro_price')::TEXT, pro_price),
        category = COALESCE((draft_record.draft_data->>'category')::TEXT, category),
        tags = COALESCE((draft_record.draft_data->'tags')::TEXT[], tags),
        image_url = COALESCE((draft_record.draft_data->>'image_url')::TEXT, image_url),
        pricing_tiers = COALESCE(draft_record.draft_data->'pricing_tiers', pricing_tiers),
        funnel_content = COALESCE(draft_record.funnel_data, funnel_content),
        updated_at = now()
      WHERE id = draft_record.service_id;
    ELSIF draft_table = 'vendor_drafts' THEN
      -- Update vendor with ALL draft data
      UPDATE public.vendors 
      SET 
        name = COALESCE((draft_record.draft_data->>'name')::TEXT, name),
        description = COALESCE((draft_record.draft_data->>'description')::TEXT, description),
        contact_email = COALESCE((draft_record.draft_data->>'contact_email')::TEXT, contact_email),
        contact_phone = COALESCE((draft_record.draft_data->>'contact_phone')::TEXT, contact_phone),
        website_url = COALESCE((draft_record.draft_data->>'website_url')::TEXT, website_url),
        logo_url = COALESCE((draft_record.draft_data->>'logo_url')::TEXT, logo_url),
        license_states = COALESCE((draft_record.draft_data->'license_states')::TEXT[], license_states),
        service_states = COALESCE((draft_record.draft_data->'service_states')::TEXT[], service_states),
        mls_areas = COALESCE((draft_record.draft_data->'mls_areas')::TEXT[], mls_areas),
        vendor_type = COALESCE((draft_record.draft_data->>'vendor_type')::TEXT, vendor_type),
        individual_name = COALESCE((draft_record.draft_data->>'individual_name')::TEXT, individual_name),
        individual_title = COALESCE((draft_record.draft_data->>'individual_title')::TEXT, individual_title),
        individual_phone = COALESCE((draft_record.draft_data->>'individual_phone')::TEXT, individual_phone),
        individual_email = COALESCE((draft_record.draft_data->>'individual_email')::TEXT, individual_email),
        individual_license_number = COALESCE((draft_record.draft_data->>'individual_license_number')::TEXT, individual_license_number),
        updated_at = now()
      WHERE id = draft_record.vendor_id;
    END IF;
    
    -- Update draft status
    EXECUTE format('UPDATE public.%I SET status = $1, reviewed_at = $2, reviewed_by = $3 WHERE id = $4', 
                  draft_table) 
    USING 'approved', now(), auth.uid(), draft_id;
    
  ELSIF action = 'reject' THEN
    -- Update draft status with rejection reason
    EXECUTE format('UPDATE public.%I SET status = $1, reviewed_at = $2, reviewed_by = $3, rejection_reason = $4 WHERE id = $5', 
                  draft_table) 
    USING 'rejected', now(), auth.uid(), rejection_reason, draft_id;
  ELSE
    RAISE EXCEPTION 'INVALID_ACTION: Action must be approve or reject';
  END IF;
  
  -- Mark notification as read
  UPDATE public.admin_notifications 
  SET read = true, read_at = now(), read_by = auth.uid()
  WHERE entity_id = draft_id AND entity_type = draft_table;
  
  result := jsonb_build_object(
    'success', true,
    'action', action,
    'draft_id', draft_id,
    'reviewed_by', auth.uid(),
    'reviewed_at', now()
  );
  
  RETURN result;
END;
$function$;