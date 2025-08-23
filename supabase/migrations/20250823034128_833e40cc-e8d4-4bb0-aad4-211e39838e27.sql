-- Fix security issues from the previous migration

-- Fix function search path issues by setting search_path for all functions
-- This addresses the "Function Search Path Mutable" warnings

-- Update functions to have proper search_path
CREATE OR REPLACE FUNCTION public.playbook_ai_draft_section(
  p_section_data jsonb,
  p_template_prompt text,
  p_user_context jsonb DEFAULT '{}'::jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  draft_content text;
BEGIN
  -- This is a placeholder function for AI drafting
  -- In a real implementation, this would call an AI service
  draft_content := 'Generated draft content for section: ' || 
                   COALESCE(p_section_data->>'title', 'Untitled Section');
  
  RETURN draft_content;
END;
$$;

-- Add RLS policy for the playbook_ai_assistance table that was created without proper policies
CREATE POLICY "Users can update their own AI assistance"
ON playbook_ai_assistance
FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own AI assistance"
ON playbook_ai_assistance
FOR DELETE
USING (auth.uid() = creator_id);