-- Drop and recreate admin_review_draft with enhanced version support
DROP FUNCTION IF EXISTS public.admin_review_draft(text, uuid, text, text);

CREATE OR REPLACE FUNCTION public.admin_review_draft(
  p_draft_table text,
  p_draft_id uuid,
  p_action text,
  p_rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft RECORD;
  v_entity_id uuid;
  v_entity_table text;
  v_id_field text;
  v_result jsonb;
  v_new_state text;
  v_payload jsonb;
BEGIN
  -- Verify admin status
  IF NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin access required';
  END IF;

  -- Determine entity details
  IF p_draft_table = 'service_drafts' THEN
    v_entity_table := 'services';
    v_id_field := 'service_id';
  ELSIF p_draft_table = 'vendor_drafts' THEN
    v_entity_table := 'vendors';
    v_id_field := 'vendor_id';
  ELSE
    RAISE EXCEPTION 'INVALID_TABLE: Unknown draft table %', p_draft_table;
  END IF;

  -- Get draft details
  EXECUTE format('SELECT * FROM %I WHERE id = $1', p_draft_table)
  INTO v_draft
  USING p_draft_id;

  IF v_draft IS NULL THEN
    RAISE EXCEPTION 'DRAFT_NOT_FOUND: Draft % not found', p_draft_id;
  END IF;

  -- Extract entity_id and payload
  EXECUTE format('SELECT %I, payload FROM %I WHERE id = $1', v_id_field, p_draft_table)
  INTO v_entity_id, v_payload
  USING p_draft_id;

  -- Process action
  IF p_action = 'approve' THEN
    v_new_state := 'APPROVED';
    
    -- Apply payload to entity (simplified approach - update all fields from payload)
    EXECUTE format(
      'UPDATE %I SET 
        name = COALESCE(($1->>''name''), name),
        description = COALESCE(($1->>''description''), description),
        live_version_id = $2,
        updated_at = now()
      WHERE id = $3',
      v_entity_table
    ) USING v_payload, p_draft_id, v_entity_id;

    -- Update draft state
    EXECUTE format(
      'UPDATE %I SET state = $1, approved_by = $2, approved_at = now(), updated_at = now() WHERE id = $3',
      p_draft_table
    ) USING v_new_state, auth.uid(), p_draft_id;

    -- Log approval
    INSERT INTO moderation_actions (
      draft_type, 
      draft_id, 
      action_type, 
      actor_id, 
      version_number,
      notes
    ) VALUES (
      CASE WHEN p_draft_table = 'service_drafts' THEN 'service_draft' ELSE 'vendor_draft' END,
      p_draft_id,
      'APPROVE',
      auth.uid(),
      v_draft.version_number,
      'Draft approved and published'
    );

  ELSIF p_action = 'reject' THEN
    v_new_state := 'CHANGES_REQUESTED';
    
    IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
      RAISE EXCEPTION 'REJECTION_REASON_REQUIRED: Rejection reason is required';
    END IF;

    -- Update draft state
    EXECUTE format(
      'UPDATE %I SET state = $1, updated_at = now() WHERE id = $2',
      p_draft_table
    ) USING v_new_state, p_draft_id;

    -- Log rejection
    INSERT INTO moderation_actions (
      draft_type,
      draft_id,
      action_type,
      actor_id,
      version_number,
      notes
    ) VALUES (
      CASE WHEN p_draft_table = 'service_drafts' THEN 'service_draft' ELSE 'vendor_draft' END,
      p_draft_id,
      'REJECT',
      auth.uid(),
      v_draft.version_number,
      p_rejection_reason
    );

  ELSE
    RAISE EXCEPTION 'INVALID_ACTION: Action must be approve or reject';
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'draft_id', p_draft_id,
    'action', p_action,
    'new_state', v_new_state,
    'version', v_draft.version_number
  );

  RETURN v_result;
END;
$$;