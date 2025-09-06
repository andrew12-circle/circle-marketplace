import { supabase } from "@/integrations/supabase/client";

export async function commitPlan(planId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('commit-plan', {
      body: { planId }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error committing plan:', error);
    throw error;
  }
}

export async function emailPlan(planId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('email-plan-summary', {
      body: { planId }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error emailing plan:', error);
    throw error;
  }
}