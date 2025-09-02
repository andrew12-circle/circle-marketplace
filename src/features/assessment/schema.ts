import { z } from 'zod';

export const AssessmentSchema = z.object({
  annual_goal_transactions: z.number().min(1, 'Must set at least 1 transaction'),
  annual_goal_volume: z.number().min(1, 'Must set a volume goal'),
  average_commission_per_deal: z.number().min(1, 'Must set commission amount'),
  primary_challenge: z.string().min(1, 'Must select a primary challenge'),
  marketing_time_per_week: z.number().min(0, 'Must set marketing time'),
  budget_preference: z.string().min(1, 'Must select budget preference'),
  personality_type: z.string().min(1, 'Must select personality type'),
  work_style: z.string().min(1, 'Must select work style'),
  communication_preference: z.string().min(1, 'Must select communication preference'),
  lead_source_comfort: z.array(z.string()).optional().default([]),
  current_crm: z.string().min(1, 'Must select current CRM'),
  current_dialer: z.string().optional().default(''),
  current_marketing_tools: z.array(z.string()).optional().default([]),
  social_media_usage: z.string().optional().default('')
});

export type AssessmentValues = z.infer<typeof AssessmentSchema>;

// Step-by-step validation schemas
export const Step1Schema = z.object({
  annual_goal_transactions: AssessmentSchema.shape.annual_goal_transactions,
  annual_goal_volume: AssessmentSchema.shape.annual_goal_volume
});

export const Step2Schema = z.object({
  average_commission_per_deal: AssessmentSchema.shape.average_commission_per_deal
});

export const Step3Schema = z.object({
  primary_challenge: AssessmentSchema.shape.primary_challenge
});

export const Step4Schema = z.object({
  marketing_time_per_week: AssessmentSchema.shape.marketing_time_per_week,
  budget_preference: AssessmentSchema.shape.budget_preference
});

export const Step5Schema = z.object({
  personality_type: AssessmentSchema.shape.personality_type,
  work_style: AssessmentSchema.shape.work_style,
  communication_preference: AssessmentSchema.shape.communication_preference
});

export const Step6Schema = z.object({
  current_crm: AssessmentSchema.shape.current_crm
});