export interface GoalFormData {
  annual_goal_transactions: number;
  annual_goal_volume: number;
  average_commission_per_deal: number;
  primary_challenge: string;
  marketing_time_per_week: number;
  budget_preference: string;
  // Personality data
  personality_type: string;
  work_style: string;
  communication_preference: string;
  lead_source_comfort: string[];
  // Current tools data
  current_crm: string;
  current_dialer: string;
  current_marketing_tools: string[];
  social_media_usage: string;
}

export interface StepProps {
  formData: GoalFormData;
  onUpdate: (field: keyof GoalFormData, value: string | number | string[]) => void;
}