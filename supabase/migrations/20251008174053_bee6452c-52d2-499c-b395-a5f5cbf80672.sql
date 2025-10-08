-- ============================================
-- PHASE 1: Version System & Optimistic Concurrency
-- ============================================

-- Step 1: Create moderation_actions audit table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK(target_type IN ('VENDOR', 'SERVICE')),
  target_version_id UUID NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('APPROVE', 'REJECT', 'COMMENT', 'SUBMIT')),
  actor_user_id UUID REFERENCES auth.users(id),
  reason TEXT,
  diff JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_moderation_actions_target ON public.moderation_actions(target_version_id, target_type);
CREATE INDEX idx_moderation_actions_created_at ON public.moderation_actions(created_at DESC);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage moderation actions" ON public.moderation_actions
  FOR ALL USING (get_user_admin_status());

-- Step 2: Add version system columns to service_drafts
ALTER TABLE public.service_drafts
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS row_version BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS state TEXT;

-- Step 3: Add version system columns to vendor_drafts
ALTER TABLE public.vendor_drafts
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS row_version BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS state TEXT;

-- Step 4: Migrate existing status to new state field
UPDATE public.service_drafts SET state = CASE
  WHEN status = 'pending' THEN 'SUBMITTED'
  WHEN status = 'approved' THEN 'PUBLISHED'
  WHEN status = 'rejected' THEN 'CHANGES_REQUESTED'
  ELSE 'DRAFT'
END WHERE state IS NULL;

UPDATE public.vendor_drafts SET state = CASE
  WHEN status = 'pending' THEN 'SUBMITTED'
  WHEN status = 'approved' THEN 'PUBLISHED'
  WHEN status = 'rejected' THEN 'CHANGES_REQUESTED'
  ELSE 'DRAFT'
END WHERE state IS NULL;

-- Step 5: Consolidate draft_data + funnel_data into payload for service_drafts
UPDATE public.service_drafts 
SET payload = jsonb_build_object(
  'core', COALESCE(draft_data, '{}'::jsonb),
  'funnel', COALESCE(funnel_data, '{}'::jsonb)
)
WHERE payload = '{}'::jsonb OR payload IS NULL;

-- Step 6: Consolidate draft_data into payload for vendor_drafts
UPDATE public.vendor_drafts 
SET payload = COALESCE(draft_data, '{}'::jsonb)
WHERE payload = '{}'::jsonb OR payload IS NULL;

-- Step 7: Add live_version_id pointers
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS live_version_id UUID;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS live_version_id UUID;

-- Step 8: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_service_drafts_version ON public.service_drafts(service_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_service_drafts_state ON public.service_drafts(state);
CREATE INDEX IF NOT EXISTS idx_vendor_drafts_version ON public.vendor_drafts(vendor_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_drafts_state ON public.vendor_drafts(state);

-- Step 9: RPC function to save service draft with optimistic concurrency
CREATE OR REPLACE FUNCTION save_service_draft(
  p_service_id UUID,
  p_payload JSONB,
  p_row_version BIGINT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_draft RECORD;
  v_new_row_version BIGINT;
  v_result JSONB;
BEGIN
  -- Get current draft
  SELECT * INTO v_current_draft
  FROM service_drafts
  WHERE service_id = p_service_id
    AND state IN ('DRAFT', 'CHANGES_REQUESTED')
  ORDER BY version_number DESC
  LIMIT 1;

  -- Optimistic concurrency check
  IF v_current_draft.id IS NOT NULL AND v_current_draft.row_version != p_row_version THEN
    RAISE EXCEPTION 'STALE_DRAFT: Draft has been modified by another session'
      USING HINT = format('Current version: %s', v_current_draft.row_version);
  END IF;

  v_new_row_version := COALESCE(p_row_version, 0) + 1;

  IF v_current_draft.id IS NOT NULL THEN
    -- Update existing draft
    UPDATE service_drafts
    SET payload = p_payload,
        row_version = v_new_row_version,
        updated_at = now()
    WHERE id = v_current_draft.id
    RETURNING jsonb_build_object(
      'id', id,
      'version_number', version_number,
      'row_version', row_version,
      'state', state
    ) INTO v_result;
  ELSE
    -- Create new draft
    INSERT INTO service_drafts (service_id, vendor_id, payload, version_number, row_version, state)
    VALUES (
      p_service_id,
      auth.uid(),
      p_payload,
      COALESCE((SELECT MAX(version_number) FROM service_drafts WHERE service_id = p_service_id), 0) + 1,
      v_new_row_version,
      'DRAFT'
    )
    RETURNING jsonb_build_object(
      'id', id,
      'version_number', version_number,
      'row_version', row_version,
      'state', state
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- Step 10: RPC function to submit service draft
CREATE OR REPLACE FUNCTION submit_service_draft(p_service_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft RECORD;
  v_result JSONB;
BEGIN
  -- Get draft
  SELECT * INTO v_draft
  FROM service_drafts
  WHERE service_id = p_service_id
    AND state = 'DRAFT'
    AND vendor_id = auth.uid()
  ORDER BY version_number DESC
  LIMIT 1;

  IF v_draft.id IS NULL THEN
    RAISE EXCEPTION 'NO_DRAFT: No draft found to submit';
  END IF;

  -- Transition DRAFT → SUBMITTED
  UPDATE service_drafts
  SET state = 'SUBMITTED',
      submitted_by = auth.uid(),
      submitted_at = now()
  WHERE id = v_draft.id
  RETURNING jsonb_build_object(
    'id', id,
    'state', state,
    'submitted_at', submitted_at
  ) INTO v_result;

  -- Log moderation action
  INSERT INTO moderation_actions (target_type, target_version_id, action, actor_user_id)
  VALUES ('SERVICE', v_draft.id, 'SUBMIT', auth.uid());

  RETURN v_result;
END;
$$;

-- Step 11: RPC function to save vendor draft with optimistic concurrency
CREATE OR REPLACE FUNCTION save_vendor_draft(
  p_vendor_id UUID,
  p_payload JSONB,
  p_row_version BIGINT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_draft RECORD;
  v_new_row_version BIGINT;
  v_result JSONB;
BEGIN
  -- Get current draft
  SELECT * INTO v_current_draft
  FROM vendor_drafts
  WHERE vendor_id = p_vendor_id
    AND state IN ('DRAFT', 'CHANGES_REQUESTED')
  ORDER BY version_number DESC
  LIMIT 1;

  -- Optimistic concurrency check
  IF v_current_draft.id IS NOT NULL AND v_current_draft.row_version != p_row_version THEN
    RAISE EXCEPTION 'STALE_DRAFT: Draft has been modified by another session'
      USING HINT = format('Current version: %s', v_current_draft.row_version);
  END IF;

  v_new_row_version := COALESCE(p_row_version, 0) + 1;

  IF v_current_draft.id IS NOT NULL THEN
    -- Update existing draft
    UPDATE vendor_drafts
    SET payload = p_payload,
        row_version = v_new_row_version,
        updated_at = now()
    WHERE id = v_current_draft.id
    RETURNING jsonb_build_object(
      'id', id,
      'version_number', version_number,
      'row_version', row_version,
      'state', state
    ) INTO v_result;
  ELSE
    -- Create new draft
    INSERT INTO vendor_drafts (vendor_id, payload, version_number, row_version, state)
    VALUES (
      p_vendor_id,
      p_payload,
      COALESCE((SELECT MAX(version_number) FROM vendor_drafts WHERE vendor_id = p_vendor_id), 0) + 1,
      v_new_row_version,
      'DRAFT'
    )
    RETURNING jsonb_build_object(
      'id', id,
      'version_number', version_number,
      'row_version', row_version,
      'state', state
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- Step 12: RPC function to submit vendor draft
CREATE OR REPLACE FUNCTION submit_vendor_draft(p_vendor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft RECORD;
  v_result JSONB;
BEGIN
  -- Get draft
  SELECT * INTO v_draft
  FROM vendor_drafts
  WHERE vendor_id = p_vendor_id
    AND state = 'DRAFT'
  ORDER BY version_number DESC
  LIMIT 1;

  IF v_draft.id IS NULL THEN
    RAISE EXCEPTION 'NO_DRAFT: No draft found to submit';
  END IF;

  -- Transition DRAFT → SUBMITTED
  UPDATE vendor_drafts
  SET state = 'SUBMITTED',
      submitted_by = auth.uid(),
      submitted_at = now()
  WHERE id = v_draft.id
  RETURNING jsonb_build_object(
    'id', id,
    'state', state,
    'submitted_at', submitted_at
  ) INTO v_result;

  -- Log moderation action
  INSERT INTO moderation_actions (target_type, target_version_id, action, actor_user_id)
  VALUES ('VENDOR', v_draft.id, 'SUBMIT', auth.uid());

  RETURN v_result;
END;
$$;