-- Add AI assistance and quick templates for faster playbook creation

-- Add new columns to playbook templates for quick templates
ALTER TABLE agent_playbook_templates 
ADD COLUMN is_quick_template BOOLEAN DEFAULT false,
ADD COLUMN ai_draft_prompt TEXT,
ADD COLUMN auto_prefill_fields JSONB DEFAULT '[]'::jsonb;

-- Insert quick playbook templates
INSERT INTO agent_playbook_templates (
  template_name, 
  template_description, 
  sections, 
  estimated_completion_time, 
  difficulty_level,
  is_quick_template,
  ai_draft_prompt,
  auto_prefill_fields
) VALUES 
(
  'Quick Lead Generation System',
  'Fast-track template for agents who want to share their lead generation secrets in under 1 hour',
  '[
    {
      "title": "Your Lead Generation Story",
      "description": "Share your biggest lead generation breakthrough",
      "type": "story",
      "required_fields": ["breakthrough_story", "results_achieved"]
    },
    {
      "title": "Top 3 Lead Sources",
      "description": "Reveal your best performing lead sources",
      "type": "sources",
      "required_fields": ["source_1", "source_2", "source_3", "conversion_rates"]
    },
    {
      "title": "Essential Tools & Budget",
      "description": "Tools that made the difference",
      "type": "tools",
      "required_fields": ["primary_tools", "monthly_budget", "roi_data"]
    },
    {
      "title": "Quick Start Action Plan",
      "description": "What agents should do first",
      "type": "action_plan",
      "required_fields": ["week_1_actions", "month_1_goals", "success_metrics"]
    }
  ]'::jsonb,
  '45-60 minutes',
  'Beginner',
  true,
  'Create a lead generation playbook for a real estate agent who specializes in [MARKET] and generates [VOLUME] leads per month using [PRIMARY_METHODS]. Focus on actionable, specific strategies.',
  '["market", "specialization", "years_experience", "annual_volume"]'::jsonb
),
(
  'Quick Listing Presentation',
  'Share your listing presentation secrets in 30 minutes',
  '[
    {
      "title": "Your Unique Value Proposition",
      "description": "What makes you different from other agents",
      "type": "story",
      "required_fields": ["unique_value", "client_testimonial"]
    },
    {
      "title": "Presentation Structure",
      "description": "Your winning presentation flow",
      "type": "structure",
      "required_fields": ["opening", "key_points", "closing_technique"]
    },
    {
      "title": "Materials & Visuals",
      "description": "Props and visuals that wow clients",
      "type": "materials",
      "required_fields": ["presentation_materials", "visual_aids", "leave_behind"]
    }
  ]'::jsonb,
  '30-45 minutes',
  'Beginner',
  true,
  'Create a listing presentation playbook for a real estate agent in [MARKET] who has [YEARS_EXPERIENCE] years of experience and closes [CONVERSION_RATE]% of listing presentations.',
  '["market", "years_experience", "conversion_rate", "specialization"]'::jsonb
),
(
  'Quick Buyer Agent System',
  'Fast buyer consultation and conversion system',
  '[
    {
      "title": "Buyer Consultation Script",
      "description": "Your proven consultation approach",
      "type": "script",
      "required_fields": ["opening_questions", "qualification_process", "commitment_strategy"]
    },
    {
      "title": "Showing Process",
      "description": "How you conduct efficient showings",
      "type": "process",
      "required_fields": ["pre_showing_prep", "showing_strategy", "post_showing_follow_up"]
    },
    {
      "title": "Closing Techniques",
      "description": "How you get offers written and accepted",
      "type": "techniques",
      "required_fields": ["offer_strategies", "negotiation_tactics", "deal_closing"]
    }
  ]'::jsonb,
  '30-45 minutes',
  'Beginner',
  true,
  'Create a buyer agent playbook for someone who works with [BUYER_TYPE] in [MARKET] and has [CONVERSION_RATE]% buyer conversion rate.',
  '["buyer_type", "market", "conversion_rate", "average_price_range"]'::jsonb
);

-- Create table for AI assistance history
CREATE TABLE playbook_ai_assistance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  section_index INTEGER NOT NULL,
  assistance_type TEXT NOT NULL CHECK (assistance_type IN ('draft', 'improve', 'expand', 'shorten', 'complete_playbook')),
  original_content TEXT,
  ai_suggestion TEXT NOT NULL,
  user_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE playbook_ai_assistance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI assistance"
ON playbook_ai_assistance
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own AI assistance"
ON playbook_ai_assistance
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Add auto-save tracking to progress table
ALTER TABLE playbook_creation_progress
ADD COLUMN last_auto_save TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN auto_save_enabled BOOLEAN DEFAULT true;