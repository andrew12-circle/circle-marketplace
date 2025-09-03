-- Create fraud detection tables and functions
CREATE TABLE IF NOT EXISTS public.affiliate_fraud_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  check_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}',
  flagged BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automated approval workflow table
CREATE TABLE IF NOT EXISTS public.affiliate_approval_workflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'application_submitted',
  auto_approval_score INTEGER NOT NULL DEFAULT 0,
  manual_review_required BOOLEAN NOT NULL DEFAULT false,
  approval_criteria_met JSONB NOT NULL DEFAULT '{}',
  stage_history JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create terms acceptance table
CREATE TABLE IF NOT EXISTS public.affiliate_terms_acceptance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  terms_version TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  acceptance_method TEXT NOT NULL DEFAULT 'web_form'
);

-- Create mobile tracking events table
CREATE TABLE IF NOT EXISTS public.mobile_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  affiliate_id UUID,
  event_type TEXT NOT NULL,
  device_info JSONB NOT NULL DEFAULT '{}',
  app_version TEXT,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social sharing table
CREATE TABLE IF NOT EXISTS public.affiliate_social_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  share_url TEXT NOT NULL,
  tracking_parameters JSONB NOT NULL DEFAULT '{}',
  clicks_tracked INTEGER NOT NULL DEFAULT 0,
  conversions_tracked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.affiliate_fraud_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_terms_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_social_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage fraud checks" ON public.affiliate_fraud_checks FOR ALL USING (get_user_admin_status());
CREATE POLICY "Admins can manage approval workflow" ON public.affiliate_approval_workflow FOR ALL USING (get_user_admin_status());
CREATE POLICY "Affiliates can view their terms acceptance" ON public.affiliate_terms_acceptance FOR SELECT USING (
  EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_terms_acceptance.affiliate_id AND affiliates.user_id = auth.uid())
);
CREATE POLICY "System can insert terms acceptance" ON public.affiliate_terms_acceptance FOR INSERT WITH CHECK (true);
CREATE POLICY "System can manage mobile tracking" ON public.mobile_tracking_events FOR ALL USING (true);
CREATE POLICY "Affiliates can manage their social shares" ON public.affiliate_social_shares FOR ALL USING (
  EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_social_shares.affiliate_id AND affiliates.user_id = auth.uid())
);

-- Create fraud detection function
CREATE OR REPLACE FUNCTION public.detect_affiliate_fraud(p_affiliate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fraud_score INTEGER := 0;
  fraud_indicators JSONB := '[]'::JSONB;
  affiliate_info RECORD;
  similar_affiliates INTEGER := 0;
  recent_signups INTEGER := 0;
BEGIN
  -- Get affiliate information
  SELECT * INTO affiliate_info FROM affiliates WHERE id = p_affiliate_id;
  
  IF affiliate_info.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Affiliate not found');
  END IF;
  
  -- Check 1: Similar email patterns
  SELECT COUNT(*) INTO similar_affiliates
  FROM affiliates 
  WHERE email SIMILAR TO CONCAT(SPLIT_PART(affiliate_info.email, '@', 1), '+%@', SPLIT_PART(affiliate_info.email, '@', 2))
    AND id != p_affiliate_id;
  
  IF similar_affiliates > 0 THEN
    fraud_score := fraud_score + 25;
    fraud_indicators := fraud_indicators || jsonb_build_object('type', 'similar_emails', 'count', similar_affiliates);
  END IF;
  
  -- Check 2: Rapid signups from same location (if we had IP data)
  -- This would need IP tracking enhancement
  
  -- Check 3: Suspicious domain patterns
  IF affiliate_info.email ~ '(tempmail|guerrillamail|10minutemail|throwaway)' THEN
    fraud_score := fraud_score + 40;
    fraud_indicators := fraud_indicators || jsonb_build_object('type', 'suspicious_email_domain', 'domain', SPLIT_PART(affiliate_info.email, '@', 2));
  END IF;
  
  -- Check 4: Missing required information
  IF affiliate_info.legal_name IS NULL OR affiliate_info.country IS NULL THEN
    fraud_score := fraud_score + 15;
    fraud_indicators := fraud_indicators || jsonb_build_object('type', 'incomplete_profile');
  END IF;
  
  -- Insert fraud check record
  INSERT INTO affiliate_fraud_checks (affiliate_id, check_type, risk_score, details, flagged)
  VALUES (p_affiliate_id, 'automated_scan', fraud_score, 
          jsonb_build_object('indicators', fraud_indicators), fraud_score > 50);
  
  RETURN jsonb_build_object(
    'affiliate_id', p_affiliate_id,
    'fraud_score', fraud_score,
    'flagged', fraud_score > 50,
    'indicators', fraud_indicators,
    'recommendation', CASE 
      WHEN fraud_score > 75 THEN 'reject'
      WHEN fraud_score > 50 THEN 'manual_review'
      ELSE 'approve'
    END
  );
END;
$$;

-- Create automated approval function
CREATE OR REPLACE FUNCTION public.process_affiliate_approval(p_affiliate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approval_score INTEGER := 0;
  criteria_met JSONB := '{}'::JSONB;
  affiliate_info RECORD;
  fraud_result JSONB;
  current_workflow RECORD;
BEGIN
  -- Get affiliate information
  SELECT * INTO affiliate_info FROM affiliates WHERE id = p_affiliate_id;
  
  IF affiliate_info.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Affiliate not found');
  END IF;
  
  -- Run fraud detection
  SELECT public.detect_affiliate_fraud(p_affiliate_id) INTO fraud_result;
  
  -- Calculate approval score based on criteria
  
  -- Criterion 1: Complete profile (20 points)
  IF affiliate_info.legal_name IS NOT NULL AND affiliate_info.email IS NOT NULL AND affiliate_info.country IS NOT NULL THEN
    approval_score := approval_score + 20;
    criteria_met := criteria_met || jsonb_build_object('complete_profile', true);
  END IF;
  
  -- Criterion 2: Website provided (15 points)
  IF affiliate_info.website IS NOT NULL AND affiliate_info.website != '' THEN
    approval_score := approval_score + 15;
    criteria_met := criteria_met || jsonb_build_object('website_provided', true);
  END IF;
  
  -- Criterion 3: Marketing channels specified (10 points)
  IF affiliate_info.marketing_channels IS NOT NULL AND affiliate_info.marketing_channels != '' THEN
    approval_score := approval_score + 10;
    criteria_met := criteria_met || jsonb_build_object('marketing_channels_specified', true);
  END IF;
  
  -- Criterion 4: Terms accepted (required)
  IF EXISTS (SELECT 1 FROM affiliate_terms_acceptance WHERE affiliate_id = p_affiliate_id) THEN
    approval_score := approval_score + 25;
    criteria_met := criteria_met || jsonb_build_object('terms_accepted', true);
  END IF;
  
  -- Criterion 5: Low fraud score (30 points)
  IF (fraud_result->>'fraud_score')::INTEGER < 25 THEN
    approval_score := approval_score + 30;
    criteria_met := criteria_met || jsonb_build_object('low_fraud_risk', true);
  END IF;
  
  -- Determine approval decision
  DECLARE
    new_stage TEXT;
    manual_review BOOLEAN := false;
    auto_approved BOOLEAN := false;
  BEGIN
    IF approval_score >= 80 AND (fraud_result->>'fraud_score')::INTEGER < 50 THEN
      new_stage := 'auto_approved';
      auto_approved := true;
      -- Update affiliate status
      UPDATE affiliates SET status = 'active'::affiliate_status WHERE id = p_affiliate_id;
    ELSIF approval_score >= 60 THEN
      new_stage := 'pending_manual_review';
      manual_review := true;
    ELSE
      new_stage := 'additional_info_required';
    END IF;
    
    -- Insert or update workflow record
    INSERT INTO affiliate_approval_workflow 
    (affiliate_id, current_stage, auto_approval_score, manual_review_required, approval_criteria_met, stage_history)
    VALUES (
      p_affiliate_id, 
      new_stage, 
      approval_score, 
      manual_review,
      criteria_met,
      jsonb_build_array(jsonb_build_object(
        'stage', new_stage,
        'timestamp', now(),
        'score', approval_score,
        'auto_decision', auto_approved
      ))
    )
    ON CONFLICT (affiliate_id) DO UPDATE SET
      current_stage = new_stage,
      auto_approval_score = approval_score,
      manual_review_required = manual_review,
      approval_criteria_met = criteria_met,
      stage_history = affiliate_approval_workflow.stage_history || jsonb_build_array(jsonb_build_object(
        'stage', new_stage,
        'timestamp', now(),
        'score', approval_score,
        'auto_decision', auto_approved
      )),
      updated_at = now();
    
    RETURN jsonb_build_object(
      'affiliate_id', p_affiliate_id,
      'approval_score', approval_score,
      'current_stage', new_stage,
      'auto_approved', auto_approved,
      'manual_review_required', manual_review,
      'criteria_met', criteria_met,
      'fraud_check', fraud_result
    );
  END;
END;
$$;